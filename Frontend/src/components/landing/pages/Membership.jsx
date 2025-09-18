// src/components/landing/pages/Inventory.jsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { FilterMatchMode } from "primereact/api";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_MEMEBRSHIPS } from "../../graphql/queries";
import {
  ADD_MEMBERSHIP,
  DELETE_MEMBERSHIP,
  UPDATE_MEMBERSHIP,
} from "../../graphql/mutations";

export default function Membership() {
  //queries
  const { data, loading, error } = useQuery(GET_MEMEBRSHIPS);

  //mutations
  const [addMembership] = useMutation(ADD_MEMBERSHIP);
  const [updateMembership] = useMutation(UPDATE_MEMBERSHIP);
  const [DeleteMembership] = useMutation(DELETE_MEMBERSHIP);

  //
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);

  // Modal states
  const [visible, setVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [originalRow, setOriginalRow] = useState(null);
  const toast = useRef(null);

  //Add/edit Membership
  const addRow = () => {
    setEditingRow({
      id: Date.now(),
      name: "",
      mobileNumber: "",
      profie: "",
      address: "",
      membershipid: "",
      status: 0,
      _isNew: true,
    });
    setVisible(true);
  };

  const saveRow = async () => {
    if (
      !editingRow.name?.trim() ||
      !editingRow.address?.trim() ||
      !editingRow.mobileNumber
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

    if (!editingRow) return;
    try {
      if (editingRow._isNew) {
        // CREATE
        await addMembership({
          variables: {
            name: editingRow.name,
            address: editingRow.address,
            mobileNumber: editingRow.mobileNumber,
          },
          refetchQueries: [{ query: GET_MEMEBRSHIPS }],
          awaitRefetchQueries: true,
        });
        setVisible(false);
        setEditingRow(null);
        toast.current?.show({
          severity: "success",
          summary: "Saved",
          detail: "Member Added",
        });
      } else {
        const updates = {};

        if (editingRow.name !== originalRow.name)
          updates.name = editingRow.name;
        if (editingRow.mobileNumber !== originalRow.mobileNumber)
          updates.mobileNumber = editingRow.mobileNumber;
        if (editingRow.address !== originalRow.address)
          updates.address = editingRow.address;

        await updateMembership({
          variables: {
            id: editingRow.id,
            ...updates,
          },
          refetchQueries: [{ query: GET_MEMEBRSHIPS }],
          awaitRefetchQueries: true,
        });

        setVisible(false);
        toast.current?.show({
          severity: "success",
          summary: "Saved",
          detail: "Changes saved.",
        });
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
  };

  //Membership deletion
  const confirmDelete = (rowData) => {
    confirmDialog({
      message: `Delete ${rowData.name || "this person's"}'s Membership ?`,
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
      accept: async () => {
        try {
          await DeleteMembership({
            variables: { id: rowData.id },
            refetchQueries: [{ query: GET_MEMEBRSHIPS }],
            awaitRefetchQueries: true,
          });

          toast.current?.show({
            severity: "success",
            summary: "Deleted",
            detail: "Membership removed",
          });
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err.message || "Error at membership deletion.",
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

  return (
    <section className="w-full min-h-screen px-5 py-5 bg-[#f5f5f5]">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="w-full  bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between ">
        <div className="w-full flex flex-col md:flex-row  items-center justify-between gap-3">
          <div>
            <h1 className="font-bold md:text-start text-center md:text-[22px] text-[16px]">
              MEMBERSHIP
            </h1>
            <p className="text-sm text-gray-500">
              Manage membership, add/edit membership
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addRow}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              Add Membership
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
            <p>Loading inventories...</p>
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
                  className="w-full py-2 pl-8  pr-3 text-sm rounded-md ring-1 ring-gray-300  focus:outline-none"
                />
                <i className="bi bi-search  absolute left-[10px] top-[50%] translate-y-[-50%] text-[14px] text-black"></i>
              </div>
            </div>
            <DataTable
              value={data.memberships}
              dataKey="id"
              alwaysShowPaginator={false}
              paginatorClassName="mt-3"
              paginator={data.memberships > 5}
              rowsPerPageOptions={[5, 10, 20, 50]}
              rows={rows}
              first={first}
              removableSort // <-- update state
              size="small"
              stripedRows
              onPage={onPage} //for when adding new coloumn new added will be listed at last
              filters={filters}
              globalFilterFields={["name", "mobileNumber", "address"]}
              emptyMessage="No Membership found."
              tableStyle={{ minWidth: "70rem", tableLayout: "fixed" }}
              className="min-h-full h-[72vh] overflow-auto !text-[14px] !font-[poppins]"
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
                        setEditingRow(rowData);
                        setOriginalRow(rowData);
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
                  </div>
                )}
                alignHeader={"center"}
                style={{
                  width: "10%",
                  textAlign: "center",
                }}
              />
              <Column
                field="membershipId"
                header="Membership Id"
                headerClassName="font-[poppins]"
                sortable
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />
              <Column
                header="Profile"
                headerClassName=""
                // body={(rowData) => (
                //   <img
                //     src={resolveImageSrc(rowData.profile)}
                //     alt="item"
                //     className="mx-auto w-10 h-10 object-cover rounded-[6px]"
                //   />
                // )}
                bodyClassName="text-center"
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
                sortable
                alignHeader={"center"}
                style={{
                  // width: "15%",
                  textAlign: "center",
                }}
              />
              <Column
                field="mobileNumber"
                header="Contact Number"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  // width: "15%",
                  textAlign: "center",
                }}
              />
              <Column
                field="address"
                header="Address"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  width: "10%",
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
                        rowData.status == 1
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {rowData.status == 1 ? "ACTIVE" : "EXPIRED"}
                    </div>
                  );
                }}
                alignHeader={"center"}
                style={{
                  // width: "15%",
                  textAlign: "center",
                }}
              />
            </DataTable>{" "}
          </>
        )}
      </div>

      {/* Edit/Add Modal */}
      <Dialog
        header={editingRow?._isNew ? "Add Membership" : "Edit Inventory"}
        headerClassName="!font-[poppins]"
        visible={visible}
        draggable={false}
        className="w-[90%] md:w-[40%] "
        modal
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
              <label className="block text-sm font-medium mb-1">Name*</label>
              <InputText
                value={editingRow.name}
                onChange={(e) =>
                  setEditingRow({ ...editingRow, name: e.target.value })
                }
                placeholder="Enter name..."
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <InputText
                value={editingRow.address}
                placeholder="Enter address..."
                onChange={(e) =>
                  setEditingRow({ ...editingRow, address: e.target.value })
                }
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 !font-[poppins]">
                Contact Number*
              </label>
              <InputText
                value={editingRow.mobileNumber}
                placeholder="Type lender mobile number..."
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                onChange={(e) => {
                  // Strip everything that is not a digit
                  const val = e.target.value.replace(/\D/g, "");
                  setEditingRow({
                    ...editingRow,
                    mobileNumber: val,
                  });
                }}
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Profile</label>
              <input
                type="file"
                accept="image/*"
                className="w-full pl-3 ring-1 rounded-sm p-1.5 ring-gray-300 "
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) =>
                      setEditingRow({
                        ...editingRow,
                        profile: ev.target.result,
                      });
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {/* {editingRow.image && (
                <img
                  src={resolveImageSrc(editingRow.image)}
                  alt="preview"
                  className="w-20 h-20 mt-2 object-cover rounded"
                />
              )} */}
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
