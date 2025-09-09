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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import redstar_logo_copy from "../../../assets/redstar_logo_copy.jpg";

// Dummy ProductService
const ProductService = {
  getProductsMini() {
    return Promise.resolve([
      {
        id: 1,
        name: "Wheelchair",
        category: "Assistive Devices",
        image: "black-watch.jpg",
        count: 12,
        available: 4,
      },
      {
        id: 2,
        name: "Black Watch",
        category: "Accessories",
        image: "black-watch.jpg",
        count: 10,
        available: 2,
      },
      {
        id: 3,
        name: "Blue Band",
        category: "Fitness",
        image: "blue-band.jpg",
        count: 2,
        available: 0,
      },
    ]);
  },
};

const resolveImageSrc = (image) => {
  if (!image) return "";
  if (
    typeof image === "string" &&
    (image.startsWith("http") || image.startsWith("data:"))
  )
    return image;
  return `https://primefaces.org/cdn/primereact/images/product/${image}`;
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(8);

  // Modal states
  const [visible, setVisible] = useState(false);
  const [categoryModalVisible, setcategoryModalVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const toast = useRef(null);

  useEffect(() => {
    ProductService.getProductsMini().then((data) => {
      const normalized = data.map((p, idx) => ({ ...p, id: p.id ?? idx + 1 }));
      setProducts(normalized);
    });
  }, []);

  /* ---------- PDF export ---------- */
  const exportPDF = () => {
    const doc = new jsPDF("p", "pt");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // doc.text("INVENTORY REPORT", doc.internal.pageSize.getWidth() / -1, 40, {
    //   align: "right",
    // });
    // doc.addImage(imgData, format, x, y, width, height);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(224, 21, 20);
    doc.text("INVENTORY REPORT", pageWidth - 40, 40, {
      align: "right",
    });

    doc.addImage(redstar_logo_copy, "PNG", 32, 20, 50, 50);

    //adrees and reg no
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(
      [
        "Reg No:",
        " ",
        "Mukkilapeedika, Punnathala,",
        "Malappuram, Kerala, 676552",
      ],
      40,
      100
    );

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Generated on: 04 Sep 2025", 450, 100);

    //footer
    const footerHeight = 13;
    const bottomMargin = 8;
    const y = 60;

    doc.setFillColor(224, 21, 20);
    doc.rect(
      0,
      pageHeight - footerHeight - bottomMargin,
      pageWidth,
      footerHeight,
      "F"
    ); // footer bar
    doc.setTextColor(255, 255, 255); // white text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("📞 +91 9876543210", 40, y, { align: "left" });
    doc.text("John Doe", pageWidth / 2, y, { align: "center" });
    doc.text("✉️ john@example.com", pageWidth - 40, y, { align: "right" });
    // Table headers & data
    const headers = [["S.No", "Name", "Category", "Count", "Avail Count"]];
    const data = products.map((p, index) => [
      index + 1,
      p.name || "—",
      p.category || "—",
      p.count ?? "_",
      p.available ?? "_",
    ]);

    autoTable(doc, {
      head: headers,
      headStyles: {
        fillColor: [224, 21, 20],
        textColor: 255,
        fontStyle: "extrabold",
        halign: "center",
      },
      body: data,
      startY: 200,
      margin: { left: 32 },
      theme: "grid",
      styles: {
        fontSize: 12,
        cellWidth: "wrap",
        overflow: "linebreak",
      },
      columnStyles: {
        1: { cellWidth: 180 },
        2: { cellWidth: 200 },
      },
      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const wmWidth = 300;
        const wmHeight = 300;

        const x = (pageWidth - wmWidth) / 2;
        const y = (pageHeight - wmHeight) / 2;

        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.addImage(redstar_logo_copy, "JPG", x, y, wmWidth, wmHeight);

        doc.setGState(new doc.GState({ opacity: 1 }));
      },
    });

    doc.save("inventory.pdf");
  };
  /* ---------- CRUD ---------- */
  const addRow = () => {
    setEditingRow({
      id: Date.now(),
      name: "",
      category: "",
      image: "",
      count: 0,
      available: 0,
      _isNew: true,
    });
    setVisible(true);
  };

  const addCategory = () => {
    setcategoryModalVisible(true);
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
      !editingRow.category?.trim() ||
      !editingRow.count
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
  const getStatus = (count) => {
    if (count === 0) return "OUTOFSTOCK";
    if (count < 3) return "LOWSTOCK";
    return "INSTOCK";
  };

  const statusBody = (rowData) => {
    const status = getStatus(rowData.available);
    const classes =
      status === "INSTOCK"
        ? "bg-green-100 text-green-800"
        : status === "LOWSTOCK"
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";

    return (
      <span
        className={`inline-block px-2 py-1 rounded text-xs font-medium ${classes}`}
      >
        {status}
      </span>
    );
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

      <div className="w-full  bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between ">
        <div className="w-full flex flex-col md:flex-row  items-center justify-between gap-3">
          <div>
            <h1 className="font-bold md:text-start text-center md:text-[22px] text-[16px]">
              INVENTORY
            </h1>
            <p className="text-sm text-gray-500">
              Manage inventory, add/edit inventory
            </p>
          </div>
          <div className="flex gap-3">
            {" "}
            <button
              onClick={addRow}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              Add Inventory
            </button>
            <button
              onClick={addCategory}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[rgb(224,21,20)] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer"
            >
              Add Category
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
              className="w-full py-2 pl-8  pr-3 text-sm rounded-md ring-1 ring-gray-300  focus:outline-none"
            />
            <i className="bi bi-search  absolute left-[10px] top-[50%] translate-y-[-50%] text-[14px] text-black"></i>
          </div>
        </div>

        <DataTable
          value={products}
          dataKey="id"
          paginator
          rows={10}
          alwaysShowPaginator={true}
          paginatorClassName="mt-3 "
          first={first}
          removableSort
          selection={selectedProducts} // <-- bind selected rows
          onSelectionChange={(e) => setSelectedProducts(e.value)} // <-- update state
          selectionMode="multiple"
          rowClassName={(rowData) =>
            selectedProducts?.some((p) => p.id === rowData.id)
              ? "!bg-[#e0141415] !text-[#E01514] !"
              : ""
          }
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
            selectionMode="multiple"
            headerStyle={{ width: "2%" }}
            className=""
          />
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
            header="Image"
            headerClassName=""
            body={(rowData) => (
              <img
                src={resolveImageSrc(rowData.image)}
                alt="item"
                className="mx-auto w-10 h-10 object-cover rounded-[6px]"
              />
            )}
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

      <Dialog
        header={editingRow?._isNew ? "Add Inventory" : "Edit Inventory"}
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
              <label className="block text-sm font-medium mb-1">
                Product Name*
              </label>
              <InputText
                value={editingRow.name}
                onChange={(e) =>
                  setEditingRow({ ...editingRow, name: e.target.value })
                }
                placeholder="Type inventory name..."
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Product Category
              </label>
              <InputText
                value={editingRow.category}
                placeholder="Type category name..."
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
                onValueChange={(e) =>
                  setEditingRow({ ...editingRow, count: e.value ?? 0 })
                }
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
                min={1}
                showButtons
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full pl-3 ring-1 rounded-sm p-1.5 ring-gray-300 "
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) =>
                      setEditingRow({ ...editingRow, image: ev.target.result });
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {editingRow.image && (
                <img
                  src={resolveImageSrc(editingRow.image)}
                  alt="preview"
                  className="w-20 h-20 mt-2 object-cover rounded"
                />
              )}
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        header={"Add Category"}
        headerClassName="!font-[poppins]"
        visible={categoryModalVisible}
        draggable={false}
        className="w-[90%] md:w-[40%] "
        modal
        onHide={() => setcategoryModalVisible(false)}
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Category Name*
            </label>
            <div className="flex">
              <InputText
                placeholder="Type category name..."
                className="flex-1 placeholder:text-sm !p-1.5 !font-[poppins] !px-3 !rounded-l-md !rounded-r-none"
              />
              <button
                type="button"
                className="px-4 py-2 bg-[#E01514] text-white text-sm font-semibold rounded-r-md  cursor-pointer focus:outline-0 hover:bg-[#ff2828] "
              >
                Add
              </button>
            </div>
          </div>
          <DataTable
            value={products}
            dataKey="id"
            rows={10}
            first={first}
            removableSort
            selection={selectedProducts} // <-- bind selected rows
            onSelectionChange={(e) => setSelectedProducts(e.value)} // <-- update state
            selectionMode="multiple"
            rowClassName={(rowData) =>
              selectedProducts?.some((p) => p.id === rowData.id)
                ? "!bg-[#e0141415] !text-[#E01514] !"
                : ""
            }
            size="small"
            stripedRows
            onPage={onPage} //for when adding new coloumn new added will be listed at last
            filters={filters}
            globalFilterFields={["name", "category"]}
            emptyMessage="No inventory found."
            tableStyle={{ minWidth: "40rem", tableLayout: "fixed" }}
            className="min-h-full h-[34vh] overflow-auto !text-[14px] !font-[poppins] mt-5"
          >
            <Column
              header="S.No"
              headerClassName="font-[poppins]"
              body={serialBody}
              alignHeader={"center"}
              style={{
                width: "10%",
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
                width: "15%",
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
          </DataTable>
        </div>
      </Dialog>
    </section>
  );
}
