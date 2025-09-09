import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { AutoComplete } from "primereact/autocomplete";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { FilterMatchMode } from "primereact/api";
import { Calendar } from "primereact/calendar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ProductService = {
  getProductsMini() {
    return Promise.resolve([
      {
        id: 1,
        book: "Oxygen cylindar",
        name: "Mohammed Nihal Areekkadan",
        mobilenumber: "9846080265",
        address: " Areekkadan(h), punnathala (p.o),",
        lendeddate: "Wed Sep 21 2025 00:00:00 GMT+0530 (India Standard Time)",
        returneddate: "-",
        remarks: "-",
        status: "Pending",
        deadline: "Wed Sep 29 2025 00:00:00 GMT+0530 (India Standard Time)",
      },
      {
        id: 2,
        book: "Wheel Chair",
        name: "Swalih",
        mobilenumber: "8075244365",
        address: "  kundan(h), punnathala (p.o)",
        lendeddate: "Wed Sep 08 2025 00:00:00 GMT+0530 (India Standard Time)",
        returneddate: "",
        remarks: "-",
        status: "Pending",
        deadline: "Wed Sep 29 2025 00:00:00 GMT+0530 (India Standard Time)",
      },
      {
        id: 3,
        book: "Water Bed",
        name: "Sinan",
        mobilenumber: "6282856560",
        address: " kundan(h), punnathala (p.o)",
        lendeddate: "Wed Sep 03 2025 00:00:00 GMT+0530 (India Standard Time)",
        returneddate: "Wed Sep 02 2025 00:00:00 GMT+0530 (India Standard Time)",
        remarks: "Small leakage",
        status: "Returned",
        deadline: "Wed Sep 29 2025 00:00:00 GMT+0530 (India Standard Time)",
      },
    ]);
  },
};

export default function BookLending() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    lendeddate: { value: null, matchMode: FilterMatchMode.DATE_IS },
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

  const [confirmVisible, setconfirmVisible] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState("");
  const [returndatetemp, setreturndatetemp] = useState(new Date());
  const [selectedRow, setSelectedRow] = useState(null);

  const toast = useRef(null);

  useEffect(() => {
    ProductService.getProductsMini().then((data) => {
      const normalized = data.map((p, idx) => ({
        ...p,
        id: p.id ?? idx + 1,
        lendeddate:
          p.lendeddate && p.lendeddate !== "-" ? new Date(p.lendeddate) : null,
        returneddate:
          p.returneddate && p.returneddate !== "-"
            ? new Date(p.returneddate)
            : null,
        deadline:
          p.deadline && p.deadline !== "-"
            ? new Date(
                new Date(p.deadline).setMonth(
                  new Date(p.deadline).getMonth() + 1
                )
              )
            : null,
      }));
      setProducts(normalized);
    });
  }, []);

  /* ---------- PDF export ---------- */
  const exportPDF = () => {
    const doc = new jsPDF("p", "pt");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 128);
    doc.text(
      "Inventory lending Report",
      doc.internal.pageSize.getWidth() / 2,
      40,
      {
        align: "center",
      }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Generated on: 04 Sep 2025", 40, 70);

    const headers = [
      ["S.No", "Name", "book", "Address", "Date", "Remarks", "Status"],
    ];
    const data = products.map((p, index) => [
      index + 1,
      p.name || "—",
      p.book || "—",
      p.address ?? "_",
      p.date ?? "_",
      p.remarks ?? "_",
      p.deadline ?? "-",
      p.status ?? "_",
    ]);

    autoTable(doc, {
      head: headers,
      headStyles: {
        fillColor: [224, 21, 20],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      body: data,
      startY: 50,
      margin: { left: 32 },
      theme: "grid",
      styles: {
        fontSize: 10,
        cellWidth: "wrap",
        overflow: "linebreak",
      },
      columnStyles: {
        1: { cellWidth: 80 },
        2: { cellWidth: 100 },
        3: { cellWidth: 130 },
        5: { cellWidth: 80 },
      },
    });

    doc.save("inventorylending.pdf");
  };

  /* ---------- CRUD ---------- */
  const addRow = () => {
    setEditingRow({
      id: Date.now(),
      book: "",
      name: "",
      mobilenumber: "",
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

  const saveRow = () => {
    if (
      !editingRow.name?.trim() ||
      !editingRow.book?.trim() ||
      !editingRow.mobilenumber?.trim() ||
      !editingRow.address?.trim() ||
      !editingRow.lendeddate
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
      const newRow = { ...editingRow };
      delete newRow._isNew;
      updated = [newRow, ...products];
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

  const getStatus = (count) => {
    if (count > 10) return "INSTOCK";
    if (count > 0) return "LOWSTOCK";
    return "OUTOFSTOCK";
  };

  const statusBody = (rowData) => {
    const status = rowData.status;
    const classes =
      status === "Pending"
        ? "bg-red-100 text-red-800"
        : "bg-green-100 text-green-800";

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
          rows={10}
          alwaysShowPaginator={true}
          paginatorClassName="mt-3 "
          removableSort
          size="small"
          stripedRows
          first={first}
          onPage={onPage} //for when adding new coloumn new added will be listed at last
          rowsPerPageOptions={[5, 10, 20, 30]}
          filters={filters}
          globalFilterFields={[
            "name",
            "book",
            "address",
            "mobilenumber",
            "lendeddate",
          ]}
          emptyMessage="No Books found."
          tableStyle={{ minWidth: "70rem", tableLayout: "fixed" }}
          className="min-h-full w-full h-[72vh] overflow-auto !text-[14px] !font-[poppins]"
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
                <button
                  className=" !bg-green-500 !text-white flex items-center justify-center rounded-[6px] p-2.5 cursor-pointer"
                  onClick={() => confirmReturn(rowData)}
                >
                  <i class="bi bi-check-lg leading-none"></i>
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
            alignHeader={"center"}
            style={{
              textAlign: "center",
            }}
          />
          <Column
            field="mobilenumber"
            header="Mobile Number"
            headerClassName="font-[poppins]"
            alignHeader={"center"}
            style={{
              textAlign: "center",
            }}
          />
          <Column
            field="book"
            header="Book"
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
            field="lendeddate"
            header="Lended Date"
            headerClassName="font-[poppins]"
            sortable
            body={(row) =>
              row.lendeddate ? row.lendeddate.toLocaleDateString("en-GB") : "-"
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
            field="deadline"
            header="Deadline"
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
            body={statusBody}
            alignHeader={"center"}
            style={{
              textAlign: "center",
            }}
          />
        </DataTable>
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
                value={editingRow.mobilenumber}
                placeholder="Type lender mobile number..."
                onChange={(e) =>
                  setEditingRow({ ...editingRow, mobilenumber: e.target.value })
                }
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 !font-[poppins]">
                book Name*
              </label>
              <AutoComplete
                value={editingRow.book}
                suggestions={authorSuggestions}
                completeMethod={searchAuthor}
                onChange={(e) =>
                  setEditingRow({ ...editingRow, book: e.value })
                }
                placeholder="Select book..."
                className="w-full "
                inputClassName="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3"
                panelClassName=""
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
            <div className="flex justify-center gap-2">
              <div className="flex flex-col w-[50%]">
                <label className="block text-sm font-medium mb-1 !font-[poppins]">
                  Lended Date*
                </label>
                <Calendar
                  inputClassName="!p-1 !placeholder:text-[8px] !font-[poppins] "
                  value={editingRow?.lendeddate || null}
                  onChange={(e) => {
                    const lended = e.value;

                    if (lended) {
                      const deadline = new Date(lended);
                      deadline.setMonth(deadline.getMonth() + 1);

                      setEditingRow({
                        ...editingRow,
                        lendeddate: lended,
                        deadline: deadline,
                      });
                    } else {
                      setEditingRow({
                        ...editingRow,
                        lendeddate: null,
                        deadline: null,
                      });
                    }
                  }}
                  showButtonBar
                  maxDate={new Date()}
                  placeholder="Select lended date"
                />
              </div>
              <div className="flex flex-col w-[50%]">
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
              </div>{" "}
              <div className="flex flex-col w-[50%]">
                {" "}
                <label className="block text-sm font-medium mb-1 !font-[poppins]">
                  Returned Date
                </label>
                <Calendar
                  inputClassName="!p-1 !placeholder:text-[8px] !font-[poppins] "
                  value={editingRow.returneddate}
                  className=" placeholder:text-sm  !font-[poppins] !p-0"
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, returneddate: e.value })
                  }
                  showButtonBar
                  maxDate={new Date()}
                  placeholder="Enter return date"
                />
              </div>
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
              {selectedRow?.book || "this item"}?.
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
    </section>
  );
}
