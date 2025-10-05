// src/components/landing/pages/Inventory.jsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { FilterMatchMode } from "primereact/api";
import { useQuery, useMutation } from "@apollo/client/react";
import { format } from "date-fns";
import { GET_MEMBERSHIPS } from "../../graphql/queries";
import { useNavigate } from "react-router-dom";
import {
  ADD_MEMBERSHIP,
  DELETE_MEMBERSHIP,
  RENEW_MEMBERSHIP,
  UPDATE_MEMBERSHIP,
} from "../../graphql/mutations";

export default function Membership() {
  //queries
  const { data, loading, error } = useQuery(GET_MEMBERSHIPS);

  //mutations
  const [addMembership] = useMutation(ADD_MEMBERSHIP);
  const [updateMembership] = useMutation(UPDATE_MEMBERSHIP);
  const [renewMembership] = useMutation(RENEW_MEMBERSHIP);
  const [DeleteMembership] = useMutation(DELETE_MEMBERSHIP);

  //
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);
  const navigate = useNavigate();
  // Modal states
  const [visible, setVisible] = useState(false);
  const [renewVisible, setrenewVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [renewRow, setrenewRow] = useState({ member: "", period: "" });
  const [originalRow, setOriginalRow] = useState(null);
  const [renewError, setrenewError] = useState("");
  const toast = useRef(null);

  //Add/edit Membership
  function normalizeDate(val) {
    if (!val) return null;
    const dateObj = typeof val === "string" ? new Date(val) : val;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const addRow = () => {
    setEditingRow({
      id: Date.now(),
      name: "",
      mobileNumber: "",
      profie: "",
      address: "",
      membershipid: "",
      dob: "",
      _isNew: true,
    });
    setVisible(true);
  };

  const saveRow = async () => {
    if (
      !editingRow.name?.trim() ||
      !editingRow.address?.trim() ||
      !editingRow.mobileNumber ||
      !editingRow.dob
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
      let profileBase64 = editingRow.preview || null;
      const dob = normalizeDate(editingRow.dob);
      if (editingRow._isNew) {
        // CREATE
        await addMembership({
          variables: {
            name: editingRow.name,
            address: editingRow.address,
            mobileNumber: editingRow.mobileNumber,
            profile: profileBase64,
            dob: dob,
          },
          refetchQueries: [{ query: GET_MEMBERSHIPS }],
          awaitRefetchQueries: true,
        });

        toast.current?.show({
          severity: "success",
          summary: "Saved",
          detail: "Member Added",
        });
      } else {
        // UPDATE
        const updates = {};
        const newDate = normalizeDate(editingRow.validuntil);
        const oldDate = normalizeDate(originalRow.validuntil);
        const newDob = editingRow.dob ? normalizeDate(editingRow.dob) : null;
        const oldDob = originalRow.dob ? normalizeDate(originalRow.dob) : null;

        if (editingRow.name !== originalRow.name)
          updates.name = editingRow.name;
        if (editingRow.mobileNumber !== originalRow.mobileNumber)
          updates.mobileNumber = editingRow.mobileNumber;
        if (editingRow.address !== originalRow.address)
          updates.address = editingRow.address;
        if (newDate !== oldDate) updates.validuntil = newDate;
        if (newDob !== oldDob) updates.dob = newDob;

        if (editingRow.preview && editingRow.preview !== originalRow.preview) {
          updates.profile = editingRow.preview;
        }

        await updateMembership({
          variables: {
            id: editingRow.id,
            ...updates,
          },
          refetchQueries: [{ query: GET_MEMBERSHIPS }],
          awaitRefetchQueries: true,
        });

        toast.current?.show({
          severity: "success",
          summary: "Saved",
          detail: "Changes saved.",
        });
      }

      setVisible(false);
      setEditingRow(null);
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
            refetchQueries: [{ query: GET_MEMBERSHIPS }],
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

  // for renew membership

  const renew = async () => {
    if (!renewRow.member || !renewRow.newvalidity) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please select required field",
      });
      return;
    }
    const normalizedDate = normalizeDate(renewRow.newvalidity);
    try {
      await renewMembership({
        variables: {
          id: renewRow.member,
          validuntil: normalizedDate,
        },
        refetchQueries: [{ query: GET_MEMBERSHIPS }],
        awaitRefetchQueries: true,
      });

      setrenewVisible(false);
      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: "Changes saved.",
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message || "Error at membership deletion.",
      });
    }
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
      <div className="w-full bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4 ">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between w-full gap-3">
          <div className="text-center md:text-left">
            <h1 className="font-bold md:text-start text-center md:text-[22px] text-[16px]">
              MEMBERSHIPS
            </h1>
            <p className="text-sm text-gray-500">
              Manage membership, add/edit memberships
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start w-full md:w-auto">
            <button
              onClick={addRow}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              Add Membership
            </button>
            <button
              onClick={() => setrenewVisible(true)}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              Renew Membership
            </button>
            <button
              onClick={() => {
                const pdfWindow = window.open(
                  "",
                  "_blank",
                  "noopener,noreferrer"
                );
                if (pdfWindow) {
                  pdfWindow.location.href =
                    "https://redstarpunnathala.in/api/pdfprint/memberships";
                } else {
                  alert(
                    "Please allow pop-ups in your browser to view the PDF."
                  );
                }
              }}
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
            <p>Loading memberships...</p>
          ) : (
            <p>Error: {error.message}</p>
          )
        ) : (
          <>
            <div className="w-full p-5 bg-[#F9FAFB] mb-3 rounded-sm border-1 border-[#e6e6e6] flex md:justify-end justify-center">
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
              removableSort
              stripedRows
              onPage={onPage} //for when adding new coloumn new added will be listed at last
              filters={filters}
              globalFilterFields={["name", "mobileNumber", "address"]}
              emptyMessage="No Memberships found."
              tableStyle={{ minWidth: "70rem", tableLayout: "fixed" }}
              className=" overflow-auto !text-[14px] !font-[poppins]"
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
                      className=" "
                      onClick={() => {
                        setEditingRow(rowData);
                        setOriginalRow(rowData);
                        setVisible(true);
                      }}
                    >
                      <i className="bi bi-pencil  cursor-pointer text-blue-500 p-2 rounded bg-blue-100"></i>
                    </button>
                    <button onClick={() => confirmDelete(rowData)}>
                      <i className="bi bi-trash  cursor-pointer text-red-500 p-2 rounded bg-red-100"></i>
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
                body={(rowData) => {
                  return rowData.profile ? (
                    <img
                      src={`https://redstarpunnathala.in/media/${rowData.profile}`}
                      alt={rowData.profile}
                      className="mx-auto w-10 h-10 object-cover rounded-[6px]"
                    />
                  ) : (
                    <span className="text-gray-400">No Profile</span>
                  );
                }}
                bodyClassName="text-center"
                alignHeader={"center"}
                style={{
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
                header="Age"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                body={(rowData) => {
                  if (!rowData.dob)
                    return <span className="text-gray-400">N/A</span>;
                  const dob = new Date(rowData.dob);
                  const today = new Date();
                  let age = today.getFullYear() - dob.getFullYear();
                  const m = today.getMonth() - dob.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                    age--;
                  }
                  return age;
                }}
                style={{
                  width: "10%",
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
                header="Valid Until"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                body={(rowData) => {
                  return rowData.validuntil ? (
                    format(new Date(rowData.validuntil), "dd-MM-yy")
                  ) : (
                    <span className="text-gray-400">No valid Added.</span>
                  );
                }}
                style={{
                  width: "10%",
                  textAlign: "center",
                }}
                dateFormat="dd-mm-yy"
              />
              <Column
                header="Status"
                headerClassName="font-[poppins]"
                body={(rowData) => {
                  // Compare validuntil with today's date
                  const today = new Date();
                  const validUntilDate = new Date(rowData.validuntil); // assuming validuntil comes from GraphQL API

                  const isActive = validUntilDate >= today;

                  return (
                    <div
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isActive ? "ACTIVE" : "EXPIRED"}
                    </div>
                  );
                }}
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />
            </DataTable>{" "}
          </>
        )}
      </div>

      {/* Edit/Add membership Modal */}
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
            <div className="flex justify-between gap-2">
              <div className="lex flex-col w-[50%] ">
                <label className="block text-sm font-medium mb-1">Name*</label>
                <InputText
                  value={editingRow.name}
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, name: e.target.value })
                  }
                  placeholder="Enter name..."
                  autoComplete="name"
                  className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
                />
              </div>
              <div className="flex flex-col w-[50%] ">
                <label className="block text-sm font-medium mb-1 !font-[poppins]">
                  DOB*
                </label>
                <Calendar
                  inputClassName="!p-1.5"
                  placeholder="select dob"
                  value={editingRow.dob ? new Date(editingRow.dob) : null}
                  className=" placeholder:text-sm  !font-[poppins] !p-0"
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, dob: e.value })
                  }
                  showButtonBar
                  dateFormat="dd-mm-yy"
                  maxDate={new Date()}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <InputText
                value={editingRow.address}
                autoComplete="address"
                placeholder="Enter address..."
                onChange={(e) =>
                  setEditingRow({ ...editingRow, address: e.target.value })
                }
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>
            <div className="flex justify-between gap-2">
              <div
                className={`flex flex-col ${
                  editingRow._isNew ? "w-[100%]" : "w-[50%]"
                }`}
              >
                <label className="block text-sm font-medium mb-1 !font-[poppins]">
                  Contact Number*
                </label>
                <InputText
                  value={editingRow.mobileNumber}
                  placeholder="Type lender mobile number..."
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  autoComplete="tel"
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setEditingRow({
                      ...editingRow,
                      mobileNumber: val,
                    });
                  }}
                  className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
                />
              </div>
              {editingRow._isNew ? (
                ""
              ) : (
                <div className="flex flex-col w-[50%] ">
                  <label className="block text-sm font-medium mb-1 !font-[poppins]">
                    Valid Until*
                  </label>
                  <Calendar
                    inputClassName="!p-1"
                    value={
                      editingRow.validuntil
                        ? new Date(editingRow.validuntil)
                        : null
                    }
                    className=" placeholder:text-sm  !font-[poppins] !p-0"
                    onChange={(e) =>
                      setEditingRow({ ...editingRow, validuntil: e.value })
                    }
                    showButtonBar
                    dateFormat="dd-mm-yy"
                    readonlyInput
                  />
                </div>
              )}
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
                        preview: ev.target.result,
                        profile: file,
                      });
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {editingRow.preview ? (
                <div className="mt-3">
                  <img
                    src={editingRow.preview}
                    alt="preview"
                    className="w-30 h-30  object-cover rounded-md border border-gray-200"
                  />
                </div>
              ) : (
                editingRow.profile && (
                  <div className="mt-3">
                    <img
                      src={`https://redstarpunnathala.in/media/${editingRow.profile}`}
                      alt="profile photo"
                      className="w-30 h-30  object-cover rounded-md border border-gray-200"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Renew Membership */}
      <Dialog
        header="Renew Membership"
        headerClassName="!font-[poppins]"
        visible={renewVisible}
        draggable={false}
        className="w-[90%] md:w-[40%] "
        modal
        onHide={() => setrenewVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              className="!font-[poppins] !text-[14px] "
              onClick={() => setrenewVisible(false)}
            />
            <Button
              label="Save"
              severity="success"
              className="!font-[poppins] !text-[14px]"
              onClick={renew}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Member*</label>
            <Dropdown
              value={
                renewRow?.member
                  ? typeof renewRow.member === "object"
                    ? renewRow.member?.id?.toString()
                    : renewRow.member?.toString()
                  : ""
              }
              options={[
                { label: "Select Member", value: "" },
                ...(data?.memberships?.map((mbr) => ({
                  label: `${mbr.name} (${mbr.membershipId})`,
                  value: mbr.id.toString(),
                })) || []),
              ]}
              placeholder="Select member name or id..."
              onChange={(e) => {
                setrenewError("");
                const selectedMember = data.memberships.find(
                  (mbr) => mbr.id.toString() === e.value
                );
                const today = new Date();
                const currentValidity = selectedMember.validuntil
                  ? new Date(selectedMember.validuntil)
                  : null;

                if (currentValidity && currentValidity >= today) {
                  setrenewError(
                    "Have an active membership. Renewal not allowed.!"
                  );
                  return;
                }
                setrenewRow({
                  ...renewRow,
                  member: e.value || "",
                  validuntil: selectedMember
                    ? new Date(selectedMember.validuntil)
                    : null,
                });
              }}
              className="w-full placeholder:text-sm !font-[poppins] [&_.p-dropdown-label]:!p-1.5 "
            />
          </div>
          <div className="w-full pl-1 h-[10px] flex items-center justify-start ">
            <p
              className={`font-[poppins] text-[12px] transition-all duration-200 ${
                renewError ? "text-red-500 opacity-100" : "opacity-0"
              }`}
            >
              {renewError || "Renewal not possible"}
            </p>
          </div>
          <div className="flex flex-col w-[50%] ">
            <label className="block text-sm font-medium mb-1 !font-[poppins]">
              Current Validity Until*
            </label>
            <Calendar
              inputClassName="!p-1"
              value={renewRow.validuntil || null}
              className="placeholder:text-sm !font-[poppins] !p-0"
              dateFormat="dd-mm-yy"
              disabled
            />
          </div>
          <div className="flex justify-between gap-2">
            {/* Select Period */}
            <div className="flex flex-col w-[50%]">
              <label className="block text-sm font-medium mb-1 !font-[poppins]">
                Select Period*
              </label>
              <Dropdown
                value={renewRow.period || ""}
                options={[
                  { label: "6 Months", value: "6m" },
                  { label: "1 Year", value: "1y" },
                  { label: "2 Years", value: "2y" },
                  { label: "5 Years", value: "5y" },
                ]}
                placeholder="Select period..."
                onChange={(e) => {
                  const today = new Date();

                  let newDate = new Date();

                  switch (e.value) {
                    case "6m":
                      newDate.setMonth(newDate.getMonth() + 6);
                      break;
                    case "1y":
                      newDate.setFullYear(newDate.getFullYear() + 1);
                      break;
                    case "2y":
                      newDate.setFullYear(newDate.getFullYear() + 2);
                      break;
                    case "5y":
                      newDate.setFullYear(newDate.getFullYear() + 5);
                      break;
                    default:
                      break;
                  }

                  setrenewRow({
                    ...renewRow,
                    period: e.value,
                    newvalidity: newDate,
                  });
                }}
                disabled={!renewRow.member}
                className="w-full placeholder:text-sm !font-[poppins] [&_.p-dropdown-label]:!p-1.5"
              />
            </div>

            {/* New Valid Until */}
            <div className="flex flex-col w-[50%]">
              <label className="block text-sm font-medium mb-1 !font-[poppins]">
                New Validity Until*
              </label>
              <Calendar
                inputClassName="!p-1"
                value={
                  renewRow.newvalidity ? new Date(renewRow.newvalidity) : null
                }
                disabled
                className="placeholder:text-sm !font-[poppins] !p-0"
                showButtonBar
                dateFormat="dd-mm-yy"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
