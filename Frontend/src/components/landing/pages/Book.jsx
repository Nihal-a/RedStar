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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Dummy ProductService
const ProductService = {
  getProductsMini() {
    return Promise.resolve([
      {
        id: 1,
        name: "The Alchemist",
        category: "Novel",
        author: "Paulo Coelho",
        count: 2,
        available: 1,
      },
      {
        id: 2,
        name: "Pathummayude Aadu",
        category: "Fiction",
        image: "black-watch.jpg",
        author: "Vaikom Muhammad Basheer",
        count: 2,
        available: 1,
      },
      {
        id: 3,
        name: "The Motorcycle Diaries",
        category: "Memoir",
        image: "black-watch.jpg",
        author: "Ernesto Che Guevara",
        count: 1,
        available: 0,
      },
    ]);
  },
};

export default function Book() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(8);

  const data = [
    "Vaikom Muhammad Basheer",
    "Hobbit",
    "Hamlet",
    "Hunger Games",
    "Head First Java",
  ];
  // Modal states
  const [visible, setVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [authorSuggestions, setAuthorSuggestions] = useState([]);
  const [bookSuggestions, setBookSuggestions] = useState([]);

  const toast = useRef(null);

  useEffect(() => {
    ProductService.getProductsMini().then((data) => {
      const normalized = data.map((p, idx) => ({ ...p, id: p.id ?? idx + 1 }));
      setProducts(normalized);
    });
  }, []);

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
      console.log(data);
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
      console.error("Error fetching books:", err);
      setBookSuggestions([]);
    }
  };

  /* ---------- PDF export ---------- */
  const exportPDF = () => {
    const doc = new jsPDF("p", "pt");
    doc.setFontSize(14);
    doc.text("Inventory Report", 40, 30);

    const headers = [
      ["S.No", "Name", "Category", "Count", "Available", "Status"],
    ];
    const data = products.map((p, index) => [
      index + 1,
      p.name || "—",
      p.category || "—",
      p.count ?? 0,
      p.available ?? 0,
      getStatus(p.count),
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 50,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellWidth: "wrap",
        overflow: "linebreak",
      },
    });

    doc.save("inventory.pdf");
  };

  /* ---------- CRUD ---------- */
  const addRow = () => {
    setEditingRow({
      id: Date.now(),
      name: "",
      author: "",
      image: "",
      category: "",
      count: 0,
      available: 0,
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

  const saveRow = () => {
    if (
      !editingRow.name?.trim() ||
      !editingRow.author?.trim() ||
      !editingRow.category?.trim() ||
      !editingRow.count ||
      editingRow.count < 1
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please fill in all required fields",
      });
      return;
    }

    if (!editingRow) return;
    let updated;
    if (editingRow._isNew) {
      updated = [...products, { ...editingRow }];
      delete updated[updated.length - 1]._isNew;
    } else {
      updated = products.map((p) => (p.id === editingRow.id ? editingRow : p));
    }
    setProducts(updated);
    setVisible(false);
    toast.current?.show({
      severity: "success",
      summary: "Saved",
      detail: "Row saved",
    });
  };

  /* ---------- Helpers ---------- */
  const getStatus = (available) => {
    if (available == 0) return "UNAVAILABLE";
    return "AVAILABLE";
  };

  const statusBody = (rowData) => {
    const status = getStatus(rowData.available);
    const classes =
      status === "AVAILABLE"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";

    return (
      <span
        className={`inline-block px-2 py-1 rounded text-xs font-medium ${classes}`}
      >
        {status}
      </span>
    );
  };

  const searchAuthor = (event) => {
    let query = event.query.toLowerCase();
    let filtered = data.filter((item) => item.toLowerCase().includes(query));
    setAuthorSuggestions(filtered);
  };

  const serialBody = (rowData, options) => first + options.rowIndex + 1;

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

      <div className="w-full  bg-white rounded-lg shadow-md p-4 mb-4 flex  items-center justify-between ">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="">
            <h1 className="text-xl font-bold md:text-start text-center ">
              BOOKS
            </h1>
            <p className="text-sm text-gray-500 ">
              Manage books, add/edit books
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addRow}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              Add Book
            </button>
            <button
              onClick={exportPDF}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              <i class="bi bi-file-earmark-pdf pr-1 "></i>
              Export pdf
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 ">
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
          value={products}
          dataKey="id"
          paginator
          draggable={false}
          rows={10}
          alwaysShowPaginator={true}
          paginatorClassName="mt-3 "
          first={first}
          removableSort
          size="small"
          stripedRows
          onPage={onPage} //for when adding new coloumn new added will be listed at last
          rowsPerPageOptions={[5, 10, 20, 50]}
          filters={filters}
          globalFilterFields={["name", "category"]}
          emptyMessage="No inventory found."
          tableStyle={{ minWidth: "70rem", tableLayout: "fixed" }}
          className="min-h-full h-[72vh] overflow-auto !text-[14px] !font-[poppins]"
        >
          <Column
            header="S.No"
            headerClassName="font-[poppins]"
            body={serialBody}
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
            field="count"
            header="Count"
            headerClassName="font-[poppins]"
            alignHeader={"center"}
            style={{
              width: "10%",
              textAlign: "center",
            }}
          />
          <Column
            field="available"
            header="Available Stock"
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
            body={statusBody}
            alignHeader={"center"}
            style={{
              // width: "15%",
              textAlign: "center",
            }}
          />
        </DataTable>
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
                required={true}
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
                required={true}
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
                required={true}
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
                value={editingRow.count}
                required={true}
                onValueChange={(e) =>
                  setEditingRow({ ...editingRow, count: e.value ?? 0 })
                }
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
                min={1}
                showButtons
              />
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
