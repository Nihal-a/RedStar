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
import { Dropdown } from "primereact/dropdown";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_BOOK_LENDING,
  GET_BOOKS,
  GET_MEMBERSHIPS,
} from "../../graphql/queries";
import { format, addMonths } from "date-fns";
import {
  ADD_BOOK_LENDING,
  DELETE_BOOK_LENDING,
  RETURN_BOOK_LENDING,
  UPDATE_BOOK_LENDING,
} from "../../graphql/mutations";
import { useNavigate } from "react-router-dom";

export default function BookLending() {
  //queries
  const { data, loading, error, refetch } = useQuery(GET_BOOK_LENDING);
  const {
    data: bookData,
    loading: bookLoading,
    error: bookError,
    refetch: bookRefetch,
  } = useQuery(GET_BOOKS);

  const {
    data: memberData,
    loading: memberLoading,
    error: memberError,
    refetch: memberRefetch,
  } = useQuery(GET_MEMBERSHIPS);

  //mutations

  const [addBookLending] = useMutation(ADD_BOOK_LENDING);
  const [deleteBookLending] = useMutation(DELETE_BOOK_LENDING);
  const [updateBookLending] = useMutation(UPDATE_BOOK_LENDING);
  const [returnBookLending] = useMutation(RETURN_BOOK_LENDING);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: "equals" },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  const navigate = useNavigate();
  // Modal states
  const [visible, setVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [originalRow, setOriginalRow] = useState(null);
  const [confirmVisible, setconfirmVisible] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState("");
  const [returndatetemp, setreturndatetemp] = useState(new Date());
  const [selectedRow, setSelectedRow] = useState(null);

  const toast = useRef(null);

  /* ---------- CRUD ---------- */
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
      book: "",
      member: "",
      lendedDate: null,
      remarks: "",
      status: "",
      _isNew: true,
    });
    setVisible(true);
  };

  const saveRow = async () => {
    if (!editingRow.member || !editingRow.book || !editingRow.lendedDate) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please fill in all required fields",
      });
      return;
    }
    if (!editingRow) return;
    const normalizedLendedDate = normalizeDate(editingRow.lendedDate);

    try {
      if (editingRow._isNew) {
        // CREATE
        await addBookLending({
          variables: {
            member: parseInt(editingRow.member),
            book: parseInt(editingRow.book),
            lendedDate: normalizedLendedDate,
            remarks: editingRow.remarks || null,
          },
          refetchQueries: [
            { query: GET_BOOK_LENDING },
            { query: GET_MEMBERSHIPS },
            { query: GET_BOOKS },
          ],
          awaitRefetchQueries: true,
        });
      } else {
        const newLendedDate = normalizeDate(editingRow.lendedDate);
        const oldLendedDate = normalizeDate(originalRow.lendedDate);

        const newReturnDate = normalizeDate(editingRow.returnDate);
        const oldReturnDate = normalizeDate(originalRow.returnDate);

        const updates = {};

        const newBookId = editingRow.book?.toString();
        const oldBookId = originalRow.book?.toString();

        const newMemberId = editingRow.member?.toString();
        const oldMemberId = originalRow.member?.toString();

        if (newBookId && newBookId !== oldBookId) {
          updates.book = parseInt(newBookId, 10);
        }
        if (newMemberId && newMemberId !== oldMemberId) {
          updates.member = parseInt(newMemberId, 10);
        }

        if (newLendedDate !== oldLendedDate) updates.lendedDate = newLendedDate;
        if (newReturnDate !== oldReturnDate) updates.returnDate = newReturnDate;
        if (editingRow.remarks !== originalRow.remarks) {
          updates.remarks = editingRow.remarks;
        }

        if (Object.keys(updates).length > 0) {
          await updateBookLending({
            variables: {
              id: editingRow.id,
              ...updates,
            },
            refetchQueries: [{ query: GET_BOOK_LENDING }],
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
            ? "Book record added successfully"
            : "Changes saved successfully"
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
        detail: "Please select return date.",
      });
      return;
    }
    try {
      const date = normalizeDate(returndatetemp);
      await returnBookLending({
        variables: {
          id: id,
          remarks: returnRemarks,
          returnDate: date,
        },
        refetchQueries: [
          { query: GET_BOOK_LENDING },
          { query: GET_MEMBERSHIPS },
          { query: GET_BOOKS },
        ],
        awaitRefetchQueries: true,
      });
      setconfirmVisible(false);
      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: "Book Return Marked ",
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
      acceptlabel: "Delete",
      acceptClassName: "m-0",
      rejectLabel: "Cancel",
      draggable: false,
      accept: async () => {
        try {
          await deleteBookLending({
            variables: { id: rowData.id },
            refetchQueries: [
              { query: GET_BOOK_LENDING },
              { query: GET_MEMBERSHIPS },
              { query: GET_BOOKS },
            ],
            awaitRefetchQueries: true,
          });

          toast.current?.show({
            severity: "success",
            summary: "Deleted",
            detail: "Record removed",
          });
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err.message || "Lending Book not returned yet.",
          });
        }
      },
    });
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  //for when adding new coloumn new added will be listed at last
  const onPage = (e) => {
    setFirst(e.first);
    setRows(e.rows);
    setFilters((prev) => ({ ...prev })); // keep filters intact
  };

  return (
    <section className="w-full min-h-screen px-5 py-5 bg-[#f5f5f5]">
      <div className="w-full bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between w-full gap-3">
          <div className="text-center md:text-left">
            <h1 className="font-bold md:text-start text-center md:text-[22px] text-[16px]">
              BOOKS LENDING
            </h1>
            <p className="text-sm text-gray-500 ">
              Manage books lents, add/edit lents
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start w-full md:w-auto">
            <button
              onClick={addRow}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[rgb(224,21,20)] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              Add Record
            </button>
            <button
              onClick={() => {
                const pdfWindow = window.open(
                  "https://redstarpunnathala.in/api/pdfprint/book_lending",
                  "_blank",
                  "noopener,noreferrer"
                );
               
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
            <p>Loading records...</p>
          ) : (
            <p>Error: {error.message}</p>
          )
        ) : (
          <>
            <div className="w-full p-5 bg-[#F9FAFB] mb-3 rounded-sm border-1 border-[#e6e6e6] flex md:justify-end justify-center gap-2">
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
              <Dropdown
                value={
                  filters.status?.value === undefined
                    ? "ALL"
                    : filters.status.value
                }
                options={[
                  { label: "All", value: "ALL" },
                  { label: "Pending", value: false },
                  { label: "Returned", value: true },
                ]}
                onChange={(e) => {
                  setFilters((prev) => {
                    const updated = { ...prev };
                    if (e.value === "ALL") {
                      delete updated.status;
                    } else {
                      updated.status = { value: e.value, matchMode: "equals" };
                    }
                    return updated;
                  });
                }}
                placeholder="Filter by Status"
                className="md:w-35 w-25 text-sm [&_.p-dropdown-label]:!p-1.5"
              />
            </div>

            <DataTable
              value={data.bookLending}
              dataKey="id"
              alwaysShowPaginator={true}
              paginatorClassName="mt-3"
              paginator={data?.bookLending?.length > 5 || rows > 10}
              rowsPerPageOptions={[5, 10, 20, 50]}
              removableSort
              size="normal"
              stripedRows
              rows={rows}
              first={first}
              onPage={onPage} //for when adding new coloumn new added will be listed at last
              filters={filters}
              globalFilterFields={[
                "name",
                "book",
                "address",
                "mobilenumber",
                "lendedDate",
              ]}
              emptyMessage="No Records found."
              tableStyle={{ minWidth: "70rem", tableLayout: "fixed" }}
              className=" w-full  overflow-auto !text-[14px] !font-[poppins] "
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
                      className="   "
                      onClick={() => {
                        setEditingRow(rowData);
                        setOriginalRow({ ...rowData });
                        setVisible(true);
                      }}
                    >
                      <i className="bi bi-pencil  cursor-pointer text-blue-500 p-2 rounded bg-blue-100"></i>
                    </button>
                    {rowData.status ? (
                      <button
                        className=" "
                        onClick={() => confirmDelete(rowData)}
                      >
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
                  width: "10%",
                  textAlign: "center",
                }}
              />
              <Column
                field="member.name"
                header="Lender"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />

              <Column
                field="book.name"
                header="Book"
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
                dateFormat="dd-mm-yy"
              />
              <Column
                header="Deadline"
                sortable
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                body={(rowData) => {
                  if (!rowData.lendedDate) return "-";
                  const newDate = addMonths(new Date(rowData.lendedDate), 1);
                  return format(newDate, "dd-MM-yy");
                }}
                style={{
                  width: "10%",
                  textAlign: "center",
                }}
                dateFormat="dd-mm-yy"
              />
              <Column
                field="returneddate"
                header="Return Date"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
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
                dateFormat="dd-mm-yy"
              />

              <Column
                field="remarks"
                header="Remarks"
                body={(rowData) => {
                  return rowData.remarks ? (
                    <span>{rowData.remarks}</span>
                  ) : (
                    <span className="text-gray-400">No remarks.</span>
                  );
                }}
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />

              <Column
                header="Status"
                filterField="status"
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
        header={editingRow?._isNew ? "Add Book Lending" : "Edit Book Lending"}
        headerClassName="!font-[poppins]"
        visible={visible}
        className="w-[90%] md:w-[40%] "
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
                Lender*
              </label>

              {memberLoading ? (
                ""
              ) : (
                <Dropdown
                  value={
                    editingRow?.member
                      ? typeof editingRow.member === "object"
                        ? editingRow.member?.id?.toString()
                        : editingRow.member?.toString()
                      : ""
                  }
                  options={[
                    { label: "Select Member", value: "" },
                    ...(memberData?.memberships?.map((mbr) => {
                      const today = new Date();
                      const expiry = new Date(mbr.validuntil);
                      const isExpired = expiry < today;

                      return {
                        label: `${mbr.name} (${mbr.membershipId}) ${
                          isExpired ? " - Expired" : ""
                        }`,
                        value: mbr.id.toString(),
                        disabled: isExpired,
                        name: mbr.name,
                        membershipId: mbr.membershipId,
                      };
                    }) || []),
                  ]}
                  placeholder="Type lender name or ID..."
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, member: e.value || "" })
                  }
                  className="w-full placeholder:text-sm !font-[poppins] [&_.p-dropdown-label]:!p-1.5 [&_.p-dropdown-filter]:!p-1.5"
                  filter
                  filterBy="label,name,membershipId"
                  showClear
                  filterPlaceholder="Search by name or ID"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 !font-[poppins]">
                book Name*
              </label>
              {bookLoading ? (
                ""
              ) : (
                <Dropdown
                  value={
                    editingRow?.book
                      ? typeof editingRow.book === "object"
                        ? editingRow.book?.id?.toString?.() || ""
                        : editingRow.book?.toString?.() || ""
                      : ""
                  }
                  options={[
                    { label: "Select Book", value: "" },
                    ...(bookData?.books?.map((book) => ({
                      label: book.name,
                      value: book.id.toString(),
                      disabled: book.available === 0,
                    })) || []),
                  ]}
                  onChange={(e) => {
                    setEditingRow({ ...editingRow, book: e.value || "" });
                  }}
                  placeholder="Select book..."
                  className="w-full  [&_.p-dropdown-label]:!p-1.5 "
                />
              )}
            </div>

            <div className="flex justify-start gap-2">
              <div className="flex flex-col w-[50%]">
                <label className="block text-sm font-medium mb-1 !font-[poppins]">
                  Lended Date*
                </label>
                <Calendar
                  inputClassName="!p-1 !placeholder:text-[8px] !font-[poppins] "
                  value={
                    editingRow.lendedDate
                      ? new Date(editingRow.lendedDate)
                      : null
                  }
                  onChange={(e) => {
                    setEditingRow({
                      ...editingRow,
                      lendedDate: e.value,
                    });
                  }}
                  showButtonBar
                  maxDate={new Date()}
                  placeholder="Select lended date"
                />
              </div>
              {/* <div className="flex flex-col w-[50%]">
                {" "}
                <label className="block text-sm font-medium mb-1 !font-[poppins]">
                  Deadline
                </label>
                <Calendar
                  inputClassName="!p-1"
                  value={editingRow.deadline}
                  className=" placeholder:text-sm  !font-[poppins] !p-0"
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, deadline: e.value })
                  }
                  showButtonBar
                  maxDate={new Date()}
                />
              </div> */}
              {!editingRow._isNew &&
                (editingRow?.status === true || editingRow?.status === 1) && (
                  <div className="flex flex-col w-[50%]">
                    <label className="block text-sm font-medium mb-1 !font-[poppins]">
                      Returned Date
                    </label>
                    <Calendar
                      inputClassName="!p-1 !placeholder:text-[8px] !font-[poppins] "
                      value={
                        editingRow.returnDate
                          ? new Date(editingRow.returnDate)
                          : null
                      }
                      className=" placeholder:text-sm  !font-[poppins] !p-0"
                      onChange={(e) =>
                        setEditingRow({ ...editingRow, returneddate: e.value })
                      }
                      showButtonBar
                      minDate={
                        editingRow.lendedDate
                          ? new Date(editingRow.lendedDate)
                          : null
                      }
                      maxDate={new Date()}
                      placeholder="Enter return date"
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
            {selectedRow?.member?.name || "This person"} is returning{" "}
            {selectedRow?.book?.name || "this book"}?.
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
