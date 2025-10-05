// src/components/landing/pages/Inventory.jsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { AutoComplete } from "primereact/autocomplete";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { FilterMatchMode } from "primereact/api";
import { useQuery, useMutation } from "@apollo/client/react";
import { CREATE_BOOK, DELETE_BOOK, UPDATE_BOOK } from "../../graphql/mutations";
import { GET_BOOKS } from "../../graphql/queries";
import { useNavigate } from "react-router-dom";

export default function Book() {
  //graphql
  const { data, loading, error, refetch } = useQuery(GET_BOOKS);

  //mutations
  const [createBook] = useMutation(CREATE_BOOK);
  const [deleteBook] = useMutation(DELETE_BOOK);
  const [updateBook] = useMutation(UPDATE_BOOK);

  //component
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);
  const navigate = useNavigate();

  //modal
  const [visible, setVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [originalRow, setOriginalRow] = useState(null);
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const toast = useRef(null);

  //auto suggestion while typiing book name using google API
  const searchBooks = async (event) => {
    if (!event.query.trim()) {
      setBookSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          event.query
        )}`
      );
      const data = await res.json();
      if (data.items) {
        const mapped = data.items.map((item) => {
          const info = item.volumeInfo;
          return {
            title: info.title || "Unknown Title",
            author: info.authors?.join(", ") || "Unknown Author",
            category: info.categories?.[0] || "Uncategorized",
          };
        });
        setBookSuggestions(mapped);
      }
    } catch (err) {
      setBookSuggestions([]);
    }
  };

  //save/edit book
  const addRow = () => {
    setEditingRow({
      id: Date.now(),
      name: "",
      author: "",
      category: "",
      count: 0,
      _isNew: true,
    });
    setVisible(true);
  };

  const saveRow = async () => {
    if (
      !editingRow.name?.trim() ||
      !editingRow.author?.trim() ||
      !editingRow.category?.trim()
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please fill in all required fields",
      });
      return;
    }

    try {
      if (editingRow._isNew) {
        createBook({
          variables: {
            name: editingRow.name,
            category: editingRow.category,
            author: editingRow.author,
            total: editingRow.count,
          },
          refetchQueries: [{ query: GET_BOOKS }],
          awaitRefetchQueries: true,
        });
        setEditingRow(null);
        setVisible(false);
        toast.current?.show({
          severity: "success",
          summary: "Saved",
          detail: "New book added.",
        });
      } else {
        const updates = {};
        if (editingRow.name !== originalRow.name)
          updates.name = editingRow.name;
        if (editingRow.category !== originalRow.category)
          updates.category = editingRow.category;
        if (editingRow.author !== originalRow.author)
          updates.author = editingRow.author;
        if (editingRow.count !== originalRow.count)
          updates.total = editingRow.count;

        await updateBook({
          variables: {
            id: editingRow.id,
            ...updates,
          },
          refetchQueries: [{ query: GET_BOOKS }],
          awaitRefetchQueries: true,
        });
        setOriginalRow(null);
        setVisible(false);
        toast.current?.show({
          severity: "success",
          summary: "Saved",
          detail: "changes saved.",
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

  const confirmDelete = async (rowData) => {
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
      accept: async () => {
        try {
          await deleteBook({
            variables: { id: rowData.id },
            refetchQueries: [{ query: GET_BOOKS }],
            awaitRefetchQueries: true,
          });
          toast.current?.show({
            severity: "success",
            summary: "Deleted",
            detail: "Book removed",
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
      <div className="w-full bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between w-full gap-3">
          <div className="text-center md:text-left">
            <h1 className="text-xl font-bold md:text-start text-center ">
              BOOKS
            </h1>
            <p className="text-sm text-gray-500 ">
              Manage books, add/edit books
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start w-full md:w-auto">
            <button
              onClick={addRow}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              Add Book
            </button>
            <button
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
              onClick={() => {
                const pdfWindow = window.open(
                  "",
                  "_blank",
                  "noopener,noreferrer"
                );
                if (pdfWindow) {
                  pdfWindow.location.href =
                    "https://redstarpunnathala.in/api/pdfprint/books";
                } else {
                  alert(
                    "Please allow pop-ups in your browser to view the PDF."
                  );
                }
              }}
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
            <p>Loading books...</p>
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
                  className="w-full py-2 md:pl-8 pl-2 pr-3 text-sm rounded-md ring-1 ring-gray-300  focus:outline-none"
                />
                <i className="bi bi-search hidden md:block absolute left-[10px] top-[50%] translate-y-[-50%] text-[14px] text-black"></i>
              </div>
            </div>

            <DataTable
              value={data.books}
              dataKey="id"
              draggable={false}
              paginatorClassName="mt-3 "
              paginator={data.books.length > 5}
              rows={5}
              rowsPerPageOptions={[5, 10, 20, 50]}
              alwaysShowPaginator={true}
              first={first}
              removableSort
              stripedRows
              onPage={onPage} //for when adding new coloumn new added will be listed at last
              filters={filters}
              globalFilterFields={["name", "category", "author"]}
              emptyMessage="No books found."
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
                      onClick={() => {
                        setEditingRow(rowData);
                        setOriginalRow({ ...rowData });
                        setVisible(true);
                      }}
                    >
                      <i className="bi bi-pencil  cursor-pointer text-blue-500 p-2 rounded bg-blue-100"></i>
                    </button>
                    <button
                      className=" "
                      onClick={() => confirmDelete(rowData)}
                    >
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
                field="author"
                header="Author"
                headerClassName="font-[poppins]"
                sortable
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />

              <Column
                field="category"
                header="Category"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  // width: "15%",
                  textAlign: "center",
                }}
              />

              <Column
                field="total"
                header="Count"
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
                        rowData.available > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {rowData.available > 0 ? "AVAILABLE" : "UNAVAILABLE"}
                    </div>
                  );
                }}
                alignHeader={"center"}
                style={{
                  // width: "15%",
                  textAlign: "center",
                }}
              />
            </DataTable>
          </>
        )}
      </div>

      {/* Edit/Add Modal */}
      <Dialog
        header={editingRow?._isNew ? "Add Book" : "Edit Book Details"}
        headerClassName="!font-[poppins]"
        visible={visible}
        draggable={false}
        className="w-[90%] md:w-[30%] "
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
            <div className="w-full">
              <label className="block text-sm font-medium mb-1">
                Book Name*
              </label>
              <AutoComplete
                value={editingRow.name}
                suggestions={bookSuggestions}
                completeMethod={searchBooks}
                field="title"
                placeholder="Type book name..."
                className="w-full"
                inputClassName="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
                onChange={(e) =>
                  setEditingRow({ ...editingRow, name: e.value })
                }
                onSelect={(e) => {
                  setEditingRow({
                    ...editingRow,
                    name: e.value.title,
                    author: e.value.author,
                    category: e.value.category,
                  }); // auto-fill when selected
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Author of Book*
              </label>
              <InputText
                value={editingRow.author}
                placeholder="Type author name..."
                onChange={(e) =>
                  setEditingRow({ ...editingRow, author: e.target.value })
                }
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Catagory of Book*
              </label>
              <InputText
                value={editingRow.category}
                placeholder="Type category of book..."
                onChange={(e) =>
                  setEditingRow({ ...editingRow, category: e.target.value })
                }
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Total Count*
              </label>
              <InputNumber
                value={editingRow.total}
                onValueChange={(e) =>
                  setEditingRow({ ...editingRow, count: e.value ?? 0 })
                }
                inputClassName="!p-1.5 !px-3 w-full"
                className="w-full placeholder:text-sm  !font-[poppins] "
                min={0}
                showButtons
              />
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
