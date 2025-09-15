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
import { ADD_INVENTORY_LENDING } from "../../graphql/mutations";

export default function InventoryLending() {
  //graphql
  const { data, loading, error, refetch } = useQuery(GET_INVENTORY_LENDING);
  console.log(data);
  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
    refetch: categoryFetch,
  } = useQuery(GET_CATEGORIES);

  const [addInventoryLending] = useMutation(ADD_INVENTORY_LENDING);

  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(8);

  // Modal states
  const [visible, setVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const [confirmVisible, setconfirmVisible] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState("");
  const [returndatetemp, setreturndatetemp] = useState(new Date());
  const [selectedRow, setSelectedRow] = useState(null);

  const toast = useRef(null);

  /* ---------- CRUD ---------- */
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
      status: "Pending",
      _isNew: true,
    });
    setVisible(true);
  };

  const confirmDelete = (rowData) => {
    confirmDialog({
      message: `Delete "${rowData.name || "this item"}"?`,
      header: "Delete Confirmation",
      headerClassName: "pr-8",
      // icon: "pi pi-trash text-red-600 text-[10px]",
      icon: (
        <i className="pi pi-trash text-red-600" style={{ fontSize: "18px" }} />
      ),
      acceptLabel: "Delete",
      acceptClassName: "m-0",
      rejectLabel: "Cancel",
      draggable: false,
      accept: () => {
        setProducts((prev) => prev.filter((p) => p.id !== rowData.id));
        toast.current?.show({
          severity: "success",
          summary: "Deleted",
          detail: "Item removed",
        });
      },
    });
  };

  const confirmReturn = (rowData) => {
    setSelectedRow(rowData);
    setReturnRemarks("");
    setconfirmVisible(true);
  };

  const saveRow = async () => {
    console.log(editingRow);
    if (
      !editingRow.name?.trim() ||
      // !editingRow.inventory ||
      !editingRow.address?.trim() ||
      !editingRow.lendedDate
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please fill in all required fields",
      });
      return;
    }

    if (!/^\d{10}$/.test(editingRow.mobileNumber)) {
      toast.current.show({
        severity: "warn",
        summary: "Validation",
        detail: "Mobile number must be exactly 10 digits (numbers only).",
      });
      return;
    }

    if (!editingRow) return;

    const normalizedLendedDate = editingRow.lendedDate
      ? editingRow.lendedDate.toISOString().split("T")[0]
      : null;
    console.log(normalizedLendedDate);
    try {
      // await addInventoryLending({
      //   variables: {
      //     name: editingRow.name,
      //     inventory: "47", // assuming ID
      //     mobileNumber: editingRow.mobileNumber,
      //     address: editingRow.address,
      //     lendedDate: normalizedLendedDate,
      //     remarks: editingRow.remarks || "",
      //   },
      //   update: (cache, { data }) => {
      //     if (!data?.addInventoryLending) return;
      //     const existing = cache.readQuery({
      //       query: GET_INVENTORY_LENDING,
      //     }) || { inventoryLending: [] };

      //     cache.writeQuery({
      //       query: GET_INVENTORY_LENDING,
      //       data: {
      //         inventoryLending: [
      //           ...existing.inventoryLending,
      //           data.addInventoryLending.inventory,
      //         ],
      //       },
      //     });
      //   },
      // });
      await addInventoryLending({
        variables: {
          name: editingRow.name,
          inventory: editingRow.inventory, // ID from dropdown
          mobile_number: editingRow.mobileNumber,
          address: editingRow.address,
          lended_date: normalizedLendedDate, // "YYYY-MM-DD"
          remarks: editingRow.remarks || "",
        },
      });
      setVisible(false);
      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: "Inventory added successfully",
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
  };

  const categoryOptions = categoryLoading
    ? [{ label: "Select Category", value: "" }]
    : [
        { label: "Select Category", value: "" },
        ...(categoryData?.categories
          .filter(
            (cat, index, self) =>
              cat && self.findIndex((c) => c.id === cat.id) === index
          )
          .map((cat) => ({
            label: cat.name,
            value: cat.id.toString(),
          })) || []),
      ];

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

  return (
    <section className="w-full min-h-screen px-5 py-5 bg-[#f5f5f5]">
      <div className="w-full  bg-white rounded-lg shadow-md p-4 mb-4 flex  items-center justify-between ">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="">
            <h1 className="font-bold md:text-start text-center md:text-[22px] text-[16px]">
              INVENTORY LENDING
            </h1>
            <p className="text-sm text-gray-500 ">
              Manage lents, add/edit lents
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
              <i class="bi bi-file-earmark-pdf pr-1 "></i>
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
            <div className="w-full p-5 bg-[#F9FAFB] mb-3 rounded-sm border-1 border-[#e6e6e6] flex justify-between">
              <div className="opacity-0 ">o</div>
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
              size="small"
              stripedRows
              first={first}
              onPage={onPage}
              filters={filters}
              globalFilterFields={[
                "name",
                "product",
                "address",
                "mobilenumber",
                "lendeddate",
              ]}
              emptyMessage="No Records found."
              tableStyle={{ minWidth: "70rem", tableLayout: "fixed" }}
              className="min-h-full w-full h-[72vh] overflow-auto !text-[14px] !font-[poppins]"
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
                      className=" !bg-blue-500 !text-white flex items-center justify-center rounded-[6px] p-2.5 cursor-pointer"
                      onClick={() => {
                        setEditingRow({
                          ...rowData,
                          category:
                            rowData.inventory?.category?.id?.toString() || "",
                        });
                        setVisible(true);
                      }}
                    >
                      <i class="bi bi-pencil leading-none"></i>
                    </button>
                    <button
                      className=" !bg-red-500 !text-white flex items-center justify-center rounded-[6px] p-2.5 cursor-pointer"
                      onClick={() => confirmDelete(rowData)}
                    >
                      <i class="bi bi-trash leading-none"></i>
                    </button>
                    <button
                      className=" !bg-green-500 !text-white flex items-center justify-center rounded-[6px] p-2.5 cursor-pointer"
                      onClick={() => confirmReturn(rowData)}
                    >
                      <i class="bi bi-check-lg leading-none"></i>
                    </button>
                  </div>
                )}
                // body={(rowData) => (
                //   <div className="flex gap-2">
                //     <i
                //       className="bi bi-trash  cursor-pointer text-red-500 p-2 rounded bg-red-100"
                //       // onClick={() => confirmDelete(rowData, "category")}
                //     ></i>
                //   </div>
                // )}
                alignHeader={"center"}
                style={{
                  width: "10%",
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
                // body={(rowData) => rowData.lendedDate}
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
                field="returneddate"
                header="Return Date"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                body={(row) =>
                  row.returneddate
                    ? row.returneddate.toLocaleDateString("en-GB")
                    : "-"
                }
                style={{
                  width: "10%",
                  textAlign: "center",
                }}
              />
              <Column
                field="remarks"
                header="Remarks"
                headerClassName="font-[poppins]"
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
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d{0,10}$/.test(val))
                    setEditingRow({
                      ...editingRow,
                      mobileNumber: e.target.value,
                    });
                }}
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 !font-[poppins]">
                Product*{editingRow?.inventory?.category?.name}
              </label>
              <Dropdown
                value={editingRow.category}
                options={categoryOptions}
                onChange={(e) => {
                  setEditingRow({
                    ...editingRow,
                    category: e.value, // ✅ keep only id here
                  });
                }}
                onSelect={(e) => {
                  setEditingRow({
                    ...editingRow,
                    category: e.value.category,
                  });
                }}
                placeholder="Select a category"
                className="w-full !font-[poppins] placeholder:!text-sm [&>.p-dropdown-label]:!p-1.5 !px-2"
              />
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
              {editingRow?._isNew ? (
                ""
              ) : (
                <div className="flex flex-col w-[50%]">
                  <label className="block text-sm font-medium mb-1 !font-[poppins]">
                    Returned Date
                  </label>
                  <Calendar
                    inputClassName="!p-1"
                    value={editingRow.returnedDate}
                    className=" placeholder:text-sm  !font-[poppins] !p-0"
                    onChange={(e) =>
                      setEditingRow({ ...editingRow, returnedDate: e.value })
                    }
                    showButtonBar
                    minDate={
                      editingRow.lendedDate
                        ? new Date(editingRow.lendedDate)
                        : null
                    }
                    maxDate={new Date()}
                    dateFormat="dd-mm-yy"
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

      <ConfirmDialog
        className="w-[90%] md:w-[25%]"
        visible={confirmVisible}
        onHide={() => setconfirmVisible(false)}
        header="Return Confirmation"
        message={
          <div className="flex flex-col gap-3">
            <p>
              {selectedRow?.name || "This person"} is returning{" "}
              {selectedRow?.product || "this item"}?.
            </p>
            <div>
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
        }
        acceptLabel="Confirm"
        rejectLabel="Cancel"
        acceptClassName="m-0 !p-2 !font-[poppins] !text-[14px] !bg-green-500 !border-0"
        rejectClassName="!p-2 !font-[poppins] !text-[14px] !bg-gray-500 !border-0"
        accept={() => {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === selectedRow.id
                ? {
                    ...p,
                    status: "Returned",
                    returneddate: returndatetemp,
                    remarks: returnRemarks || "-",
                  }
                : p
            )
          );
          setReturnRemarks("");
          setconfirmVisible(false);
          toast.current?.show({
            severity: "success",
            summary: "Updated",
            detail: "Return Confirmed",
          });
        }}
        reject={() => setReturnRemarks("")}
      />
      <Toast ref={toast} />
      <ConfirmDialog />
    </section>
  );
}
