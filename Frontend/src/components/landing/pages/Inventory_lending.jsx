import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { FilterMatchMode } from "primereact/api";
import { Calendar } from "primereact/calendar";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_CATEGORIES, GET_INVENTORY_LENDING } from "../../graphql/queries";
import { format } from "date-fns";
import { Dropdown } from "primereact/dropdown";
import {
  ADD_INVENTORY_LENDING,
  DELETE_INVENTORY_LENDING,
  RETURN_INVENTORY_LENDING,
  UPDATE_INVENTORY_LENDING,
} from "../../graphql/mutations";

export default function InventoryLending() {
  //queries
  const { data, loading, error, refetch } = useQuery(GET_INVENTORY_LENDING);
  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
    refetch: categoryFetch,
  } = useQuery(GET_CATEGORIES);

  //mutations
  const [addInventoryLending] = useMutation(ADD_INVENTORY_LENDING);
  const [updateInventoryLending] = useMutation(UPDATE_INVENTORY_LENDING);
  const [returnInventoryLending] = useMutation(RETURN_INVENTORY_LENDING);
  const [deleteInventoryLending] = useMutation(DELETE_INVENTORY_LENDING);

  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: "equals" },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(8);

  // Modal states
  const [visible, setVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [originalRow, setOriginalRow] = useState(null);
  const [confirmVisible, setconfirmVisible] = useState(false);
  const [inventoryOptions, setinventoryOptions] = useState([]);
  const [returnRemarks, setReturnRemarks] = useState("");
  const [returndatetemp, setreturndatetemp] = useState(new Date());
  const [selectedRow, setSelectedRow] = useState(null);

  const toast = useRef(null);

  /* ---------- CRUD ---------- */

  //Handler for date setting when edting record
  function normalizeDate(val) {
    if (!val) return null;
    const dateObj = typeof val === "string" ? new Date(val) : val;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // stays in local date
  }

  const addRow = () => {
    setEditingRow({
      id: Date.now(),
      inventory: "",
      name: "",
      mobileNumber: "",
      address: "",
      lendeddate: null,
      returneddate: null,
      remarks: "",
      status: false,
      _isNew: true,
    });
    setVisible(true);
  };

  //add/edit record
  const saveRow = async () => {
    if (
      !editingRow.name?.trim() ||
      !editingRow.address?.trim() ||
      !editingRow.lendedDate ||
      !editingRow.inventory
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please fill in all required fields",
      });
      return;
    }
    if (!/^\d{10}$/.test(editingRow.mobileNumber)) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Mobile number must be exactly 10 digits.",
      });
      return;
    }

    const normalizedLendedDate = normalizeDate(editingRow.lendedDate);

    try {
      if (editingRow._isNew) {
        // CREATE
        await addInventoryLending({
          variables: {
            name: editingRow.name,
            inventory: parseInt(editingRow.inventory),
            mobileNumber: editingRow.mobileNumber,
            address: editingRow.address,
            lendedDate: normalizedLendedDate,
            remarks: editingRow.remarks || null,
          },
          refetchQueries: [
            { query: GET_INVENTORY_LENDING },
            { query: GET_CATEGORIES },
          ],
          awaitRefetchQueries: true,
        });
      } else {
        const newLendedDate = normalizeDate(editingRow.lendedDate);
        const oldLendedDate = normalizeDate(originalRow.lendedDate);

        const newReturnDate = normalizeDate(editingRow.returnDate);
        const oldReturnDate = normalizeDate(originalRow.returnDate);

        const updates = {};
        if (editingRow.name !== originalRow.name)
          updates.name = editingRow.name;
        if (editingRow.mobileNumber !== originalRow.mobileNumber)
          updates.mobileNumber = editingRow.mobileNumber;
        if (editingRow.address !== originalRow.address)
          updates.address = editingRow.address;

        const newInventoryId =
          typeof editingRow.inventory === "object"
            ? editingRow.inventory.id.toString()
            : editingRow.inventory?.toString();

        const oldInventoryId =
          typeof originalRow.inventory === "object"
            ? originalRow.inventory.id.toString()
            : originalRow.inventory?.toString();

        if (newInventoryId !== oldInventoryId) {
          updates.inventory = parseInt(newInventoryId);
        }

        if (newLendedDate !== oldLendedDate) updates.lendedDate = newLendedDate;
        if (newReturnDate !== oldReturnDate) updates.returnDate = newReturnDate;
        if (editingRow.remarks !== originalRow.remarks)
          updates.remarks = editingRow.remarks;

        if (Object.keys(updates).length > 0) {
          await updateInventoryLending({
            variables: {
              id: editingRow.id,
              ...updates,
            },
            refetchQueries: [
              { query: GET_INVENTORY_LENDING },
              { query: GET_CATEGORIES },
            ],
            awaitRefetchQueries: true,
          });
        }
      }
      setVisible(false);
      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: `${
          editingRow._isNew
            ? "Inventory Added successfully"
            : "Inventory Saved successfully"
        }`,
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
  };

  //Return inventory
  const confirmReturn = (rowData) => {
    setSelectedRow(rowData);
    setReturnRemarks("");
    setconfirmVisible(true);
  };

  const markReturn = async (id) => {
    if (!returndatetemp || !id) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please fill required fields",
      });
      return;
    }
    try {
      const date = normalizeDate(returndatetemp);
      await returnInventoryLending({
        variables: {
          id: id,
          remarks: returnRemarks,
          returnDate: date,
        },
        refetchQueries: [
          { query: GET_INVENTORY_LENDING },
          { query: GET_CATEGORIES },
        ],
        awaitRefetchQueries: true,
      });
      setconfirmVisible(false);
      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: "Inventory Return Marked ",
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
  };

  const confirmDelete = (rowData) => {
    confirmDialog({
      message: `Delete record of "${rowData.name || "this person"}" lended "${
        rowData.inventory?.category?.name || "item"
      }"?`,
      header: "Delete Confirmation",
      headerClassName: "pr-8",
      icon: (
        <i className="pi pi-trash text-red-600" style={{ fontSize: "18px" }} />
      ),
      acceptLabel: "Delete",
      acceptClassName: "m-0",
      rejectLabel: "Cancel",
      draggable: false,
      accept: async () => {
        try {
          await deleteInventoryLending({
            variables: { id: rowData.id },
            refetchQueries: [
              { query: GET_INVENTORY_LENDING },
              { query: GET_CATEGORIES },
            ],
            awaitRefetchQueries: true,
          });

          toast.current?.show({
            severity: "success",
            summary: "Deleted",
            detail: "Item removed",
          });
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err.message || "Lending inventory not returned yet.",
          });
        }
      },
    });
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  //for when adding new coloumn new added will be listed at last
  const onPage = (e) => {
    setFirst(e.first);
    setRows(e.rows);
  };

  //for preservation of choose selection while editing the inventory lending
  useEffect(() => {
    if (!categoryData) return;

    if (!editingRow?.category) {
      setinventoryOptions([]);
      return;
    }

    const selectedCategory = categoryData.categories.find(
      (cat) => cat.id.toString() === editingRow.category
    );

    if (!selectedCategory) {
      setinventoryOptions([]);
      return;
    }

    let availableInventories =
      selectedCategory.inventories
        ?.filter((inv) => inv.status === true || inv.status === 1)
        .map((inv) => ({
          label: inv.name,
          value: inv.id.toString(),
        })) || [];

    if (!editingRow._isNew && originalRow?.inventory) {
      const originalInventoryId = originalRow.inventory.id.toString();
      const originalCategoryId = originalRow.inventory.category.id.toString();

      if (editingRow.category === originalCategoryId) {
        if (
          !availableInventories.some((inv) => inv.value === originalInventoryId)
        ) {
          availableInventories.unshift({
            label: `${originalRow.inventory.name} (Original Selection)`,
            value: originalInventoryId,
          });
        }
      }
    }

    if (editingRow.inventory) {
      const currentInventoryId =
        typeof editingRow.inventory === "object"
          ? editingRow.inventory.id.toString()
          : editingRow.inventory.toString();

      if (
        !availableInventories.some((inv) => inv.value === currentInventoryId)
      ) {
        const inventoryInCategory = selectedCategory.inventories?.find(
          (inv) => inv.id.toString() === currentInventoryId
        );

        if (inventoryInCategory) {
          availableInventories.unshift({
            label: `${inventoryInCategory.name} (Current Selection)`,
            value: currentInventoryId,
          });
        }
      }
    }

    setinventoryOptions(availableInventories);
  }, [
    editingRow?.category,
    categoryData,
    editingRow?._isNew,
    originalRow?.inventory,
  ]);

  return (
    <section className="w-full min-h-screen px-5 py-5 bg-[#f5f5f5]">
      <div className="w-full  bg-white rounded-lg shadow-md p-4 mb-4 flex  items-center justify-between ">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="">
            <h1 className="font-bold md:text-start text-center md:text-[22px] text-[16px]">
              INVENTORY LENDING
            </h1>
            <p className="text-sm text-gray-500 ">
              Manage inventory lents, add/edit lents
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addRow}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[rgb(224,21,20)] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              Add Record
            </button>

            <button
              // onClick={exportPDF}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              <i className="bi bi-file-earmark-pdf pr-1 "></i>
              Export pdf
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 ">
        {loading || error ? (
          loading ? (
            <p>Loading records...</p>
          ) : (
            <p>Error: {error.message}</p>
          )
        ) : (
          <>
            <div className="w-full p-5 bg-[#F9FAFB] mb-3 rounded-sm border-1 border-[#e6e6e6] flex md:justify-end justify-center gap-2">
              <div className="relative ">
                <input
                  value={globalFilterValue}
                  onChange={onGlobalFilterChange}
                  type="text"
                  placeholder="Search..."
                  className="w-full py-2 md:pl-8 pl-2 pr-3 text-sm rounded-md ring-1 ring-gray-300  focus:outline-none"
                />
                <i className="bi bi-search hidden md:block absolute left-[10px] top-[50%] translate-y-[-50%] text-[14px] text-black"></i>
              </div>
              <Dropdown
                value={filters.status?.value ?? null}
                options={[
                  { label: "All", value: "ALL" },
                  { label: "Pending", value: false },
                  { label: "Returned", value: true },
                ]}
                onChange={(e) => {
                  let _filters = { ...filters };

                  if (e.value === "ALL") {
                    delete _filters["status"];
                  } else {
                    _filters["status"] = {
                      value: e.value,
                      matchMode: "equals",
                    };
                  }

                  setFilters(_filters);
                }}
                placeholder="Filter by Status "
                className="w-35 text-sm [&_.p-dropdown-label]:!p-1.5"
              />
            </div>

            <DataTable
              value={data.inventoryLending}
              dataKey="id"
              alwaysShowPaginator={false}
              paginatorClassName="mt-3"
              paginator={data.inventoryLending?.length > 5}
              rowsPerPageOptions={[5, 10, 20, 50]}
              rows={rows}
              removableSort
              stripedRows
              first={first}
              onPage={onPage}
              filters={filters}
              globalFilterFields={[
                "name",
                "inventory.category.name",
                "address",
                "mobileNumber",
                "lendedDate",
              ]}
              emptyMessage="No Records found."
              tableStyle={{ minWidth: "70rem", tableLayout: "fixed" }}
              className=" w-full  overflow-auto !text-[14px] !font-[poppins]"
            >
              <Column
                header="S.No"
                headerClassName="font-[poppins]"
                body={(rowData, options) => first + options.rowIndex + 1}
                alignHeader={"center"}
                style={{
                  width: "5%",
                  textAlign: "center",
                }}
              />
              <Column
                header="Actions"
                headerClassName="font-[poppins]"
                body={(rowData) => (
                  <div className="w-full flex items-center justify-center gap-2">
                    <button
                      className=""
                      onClick={() => {
                        setEditingRow({
                          ...rowData,
                          category:
                            rowData.inventory?.category?.id?.toString() || "",
                          // Keep the inventory as object for editing
                          inventory: rowData.inventory || "",
                        });
                        setOriginalRow({ ...rowData });
                        setVisible(true);
                      }}
                    >
                      <i className="bi bi-pencil  cursor-pointer text-blue-500 p-2 rounded bg-blue-100"></i>
                    </button>
                    {rowData.status ? (
                      <button onClick={() => confirmDelete(rowData)}>
                        <i className="bi bi-trash  cursor-pointer text-red-500 p-2 rounded bg-red-100"></i>
                      </button>
                    ) : (
                      ""
                    )}
                    {rowData.status ? (
                      ""
                    ) : (
                      <button
                        className=" "
                        onClick={() => confirmReturn(rowData)}
                      >
                        <i className="bi bi-check-lg  cursor-pointer text-green-500 p-2 rounded bg-green-100"></i>
                      </button>
                    )}
                  </div>
                )}
                alignHeader={"center"}
                style={{
                  // width: "10%",
                  textAlign: "center",
                }}
              />
              <Column
                field="name"
                header="Name"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />
              <Column
                field="mobileNumber"
                header="Mobile Number"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />
              <Column
                field="product"
                body={(rowData) => (
                  <div>
                    <span className="">
                      {rowData.inventory?.category?.name}
                    </span>
                    <br />
                    <span className="text-[12px]">
                      {rowData.inventory?.name}
                    </span>
                  </div>
                )}
                header="Product"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />
              <Column
                field="address"
                header="Address"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />
              <Column
                field="lendedDate"
                header="Lended Date"
                headerClassName="font-[poppins]"
                sortable
                body={(rowData) =>
                  format(new Date(rowData.lendedDate), "dd-MM-yy")
                }
                alignHeader={"center"}
                style={{
                  width: "10%",
                  textAlign: "center",
                }}
              />
              <Column
                field="returnDate"
                header="Returned Date"
                headerClassName="font-[poppins]"
                alignHeader="center"
                body={(rowData) => {
                  return rowData.returnDate ? (
                    format(new Date(rowData.returnDate), "dd-MM-yy")
                  ) : (
                    <span className="text-gray-400">Not returned.</span>
                  );
                }}
                style={{
                  width: "10%",
                  textAlign: "center",
                }}
              />
              <Column
                field="remarks"
                header="Remarks"
                headerClassName="font-[poppins]"
                body={(rowData) => {
                  return rowData.remarks ? (
                    <span>{rowData.remarks}</span>
                  ) : (
                    <span className="text-gray-400">No remarks.</span>
                  );
                }}
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />
              <Column
                header="Status"
                headerClassName="font-[poppins]"
                body={(rowData) => {
                  return (
                    <div
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        rowData.status
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {rowData.status ? "RETURNED" : "PENDING"}
                    </div>
                  );
                }}
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />
            </DataTable>
          </>
        )}
      </div>

      {/* Edit/Add Modal */}
      <Dialog
        header={
          editingRow?._isNew
            ? "Add Inventory Lending"
            : "Edit Inventory Lending"
        }
        headerClassName="!font-[poppins]"
        visible={visible}
        className="w-[90%] lg:w-[40%] md:w-[60%] "
        modal
        draggable={false}
        onHide={() => setVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              className="!font-[poppins] !text-[14px] "
              onClick={() => setVisible(false)}
            />
            <Button
              label="Save"
              severity="success"
              className="!font-[poppins] !text-[14px]"
              onClick={saveRow}
            />
          </div>
        }
      >
        {editingRow && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 !font-[poppins]">
                Name*
              </label>
              <InputText
                value={editingRow.name}
                placeholder="Type lender name..."
                onChange={(e) =>
                  setEditingRow({ ...editingRow, name: e.target.value })
                }
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 !font-[poppins]">
                Mobile Number*
              </label>
              <InputText
                value={editingRow.mobileNumber}
                placeholder="Type lender mobile number..."
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d{0,10}$/.test(val)) {
                    setEditingRow({
                      ...editingRow,
                      mobileNumber: e.target.value,
                    });
                  }
                }}
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>

            <div className="flex justify-between gap-2">
              <div className="flex flex-col w-[50%]">
                <label className="block text-sm font-medium mb-1 !font-[poppins]">
                  Category*
                </label>
                <Dropdown
                  value={editingRow.category}
                  options={[
                    { label: "Select Category", value: "" },
                    ...(categoryData?.categories.map((cat) => ({
                      label: cat.name,
                      value: cat.id.toString(),
                    })) || []),
                  ]}
                  onChange={(e) => {
                    const selectedCategoryId = e.value;
                    const newEditingRow = {
                      ...editingRow,
                      category: selectedCategoryId,
                    };

                    if (
                      !editingRow._isNew &&
                      originalRow?.inventory &&
                      selectedCategoryId ===
                        originalRow.inventory.category.id.toString()
                    ) {
                      newEditingRow.inventory =
                        originalRow.inventory.id.toString();
                    } else {
                      newEditingRow.inventory = "";
                    }

                    setEditingRow(newEditingRow);
                  }}
                  placeholder="Select a category"
                  className="[&_.p-dropdown-label]:!p-1.5"
                />
              </div>
              <div className="flex flex-col w-[50%]">
                <label
                  className={`block text-sm font-medium mb-1 !font-[poppins] `}
                >
                  Inventory*
                </label>
                <Dropdown
                  value={
                    editingRow?.inventory
                      ? typeof editingRow.inventory === "object"
                        ? editingRow.inventory.id.toString()
                        : editingRow.inventory.toString()
                      : ""
                  }
                  options={inventoryOptions}
                  onChange={(e) => {
                    setEditingRow({ ...editingRow, inventory: e.value });
                  }}
                  placeholder="Select inventory"
                  className="[&_.p-dropdown-label]:!p-1.5"
                  disabled={!editingRow.category} // Disable if no category selected
                />
                {editingRow.category &&
                  inventoryOptions.length < 1 &&
                  categoryData?.categories.some(
                    (cat) => cat.id.toString() === editingRow.category
                  ) && (
                    <label className="pl-3 text-[13px] text-red-500">
                      {
                        categoryData.categories.find(
                          (cat) => cat.id.toString() === editingRow.category
                        )?.name
                      }{" "}
                      not available!
                    </label>
                  )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 !font-[poppins]">
                Address*
              </label>
              <InputTextarea
                value={editingRow.address}
                placeholder="Type full address..."
                onChange={(e) =>
                  setEditingRow({ ...editingRow, address: e.target.value })
                }
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>
            <div className="flex justify-between gap-2">
              <div className="flex flex-col w-[50%]">
                <label className="block text-sm font-medium mb-1 !font-[poppins]">
                  Lended Date*
                </label>
                <Calendar
                  inputClassName="!p-1"
                  value={
                    editingRow.lendedDate
                      ? new Date(editingRow.lendedDate)
                      : null
                  }
                  className=" placeholder:text-sm  !font-[poppins] !p-0"
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, lendedDate: e.value })
                  }
                  showButtonBar
                  maxDate={new Date()}
                  dateFormat="dd-mm-yy"
                />
              </div>
              {!editingRow?._isNew &&
                (editingRow?.status === true || editingRow?.status === 1) && (
                  <div className="flex flex-col w-[50%]">
                    <label className="block text-sm font-medium mb-1 !font-[poppins]">
                      Returned Date
                    </label>
                    <Calendar
                      inputClassName="!p-1"
                      value={
                        editingRow.returnDate
                          ? new Date(editingRow.returnDate)
                          : null
                      }
                      className=" placeholder:text-sm  !font-[poppins] !p-0"
                      onChange={(e) =>
                        setEditingRow({ ...editingRow, returnDate: e.value })
                      }
                      showButtonBar
                      minDate={
                        editingRow.lendedDate
                          ? new Date(editingRow.lendedDate)
                          : null
                      }
                      maxDate={new Date()}
                      dateFormat="dd-mm-yy"
                      readonlyInput
                    />
                  </div>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 !font-[poppins]">
                Remarks
              </label>
              <InputText
                value={editingRow.remarks}
                placeholder="Enter remarks..."
                onChange={(e) =>
                  setEditingRow({ ...editingRow, remarks: e.target.value })
                }
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        className="w-[90%] md:w-[25%]"
        visible={confirmVisible}
        onHide={() => setconfirmVisible(false)}
        draggable={false}
        header="Return Confirmation"
      >
        <div className="flex flex-col gap-3 ">
          <p>
            {selectedRow?.name || "This person"} is returning{" "}
            {selectedRow?.inventory?.category?.name || "this item"}?.
          </p>
          <div className="">
            <label className="block text-sm font-medium mb-1">
              Return Date
            </label>
            <Calendar
              inputClassName="!p-1"
              value={returndatetemp}
              className=" placeholder:text-sm  !font-[poppins] !p-0"
              onChange={(e) => setreturndatetemp(e.value)}
              showButtonBar
              maxDate={new Date()}
              dateFormat="dd-mm-yy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <InputTextarea
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              placeholder="Enter remarks..."
              className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            className="!font-[poppins] !text-[14px] p-2 font-semibold !text-white bg-gray-500 rounded-md cursor-pointer hover:bg-gray-600"
            onClick={() => setconfirmVisible(false)}
          >
            Cancel
          </button>
          <button
            className="!font-[poppins] !text-[14px] p-2 font-semibold !text-white bg-green-500 rounded-md cursor-pointer hover:bg-green-600"
            onClick={() => markReturn(selectedRow.id)}
          >
            Mark Return
          </button>
        </div>
      </Dialog>
      <Toast ref={toast} />
      <ConfirmDialog />
    </section>
  );
}
