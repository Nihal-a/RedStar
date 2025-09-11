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
import { Dropdown } from "primereact/dropdown";
import { FilterMatchMode } from "primereact/api";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_CATEGORIES, GET_INVENTORIES } from "../../graphql/queries";
import { CREATE_INVENTORY, DELETE_INVENTORY } from "../../graphql/mutations";

export default function Inventory() {
  //graphql
  const { data, loading, error, refetch } = useQuery(GET_INVENTORIES);
  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
  } = useQuery(GET_CATEGORIES);
  console.log(categoryData);

  const [createInventory] = useMutation(CREATE_INVENTORY);
  const [DeleteInventory] = useMutation(DELETE_INVENTORY);

  const inventoriesByCategory = React.useMemo(() => {
    if (!data?.inventories) return [];

    const map = new Map();

    data.inventories.forEach((inv) => {
      if (!map.has(inv.category?.id)) {
        map.set(inv.category.id, {
          ...inv,
          count: inv.total,
          available: inv.available,
        });
      } else {
        // Optional: sum totals/available if multiple inventories per category
        const existing = map.get(inv.category.id);
        map.set(inv.category.id, {
          ...existing,
          count: existing.count + inv.total,
          available: existing.available + inv.available,
        });
      }
    });

    return Array.from(map.values());
  }, [data?.inventories]);

  //components
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(8);
  const [expandedRows, setExpandedRows] = useState(null);

  // Modal states
  const [visible, setVisible] = useState(false);
  const [categoryModalVisible, setcategoryModalVisible] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const toast = useRef(null);

  /* ---------- CRUD ---------- */
  const addRow = () => {
    console.log(editingRow);
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

  const categoryOptions = loading
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

  const confirmDelete = (rowData) => {
    confirmDialog({
      message: `Delete "${rowData.name || "this item"}"?`,
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
        await DeleteInventory({ variables: rowData.id });
        refetch();
        toast.current?.show({
          severity: "success",
          summary: "Deleted",
          detail: "Item removed",
        });
      },
    });
  };

  const saveRow = async () => {
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

    try {
      if (editingRow._isNew) {
        const { data } = await createInventory({
          variables: {
            name: editingRow.name,
            category: editingRow.category,
            total: editingRow.count,
          },
          update: (cache, { data }) => {
            if (!data?.createInventory) return;

            const existing = cache.readQuery({ query: GET_INVENTORIES }) || {
              inventories: [],
            };
            cache.writeQuery({
              query: GET_INVENTORIES,
              data: {
                inventories: [
                  ...existing.inventories,
                  data.createInventory.inventory,
                ],
              },
            });
          },
        });
      }

      setVisible(false);
      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: "Inventory saved successfully",
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
  };

  const saveCategory = () => {
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
    if (count === 0) return "UNAVAILABLE";
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

  const rowExpansionTemplate = (rowData) => {
    // If inventories not ready yet, show a spinner or placeholder
    if (!data || !data.inventories) {
      return (
        <div className="p-3 ml-10 flex items-center text-gray-500">
          <i className="pi pi-spin pi-spinner text-blue-500 mr-2"></i>
          Loading...
        </div>
      );
    }

    return (
      <div className="p-3 ml-10">
        <DataTable
          responsiveLayout="scroll"
          stripedRows
          value={data.inventories ?? []} // fallback to []
        >
          <Column
            header="S.No"
            body={(row, options) => options.rowIndex + 1}
            style={{ width: "5%", textAlign: "center" }}
          />
          <Column
            header="Actions"
            body={(row) => (
              <div className="w-full flex items-center justify-center gap-2">
                <button
                  className="bg-blue-500 text-white rounded-[6px] p-2.5"
                  onClick={() => {
                    setEditingRow(row);
                    setVisible(true);
                  }}
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className="bg-red-500 text-white rounded-[6px] p-2.5"
                  onClick={() => confirmDelete(row)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            )}
            style={{ width: "20%", textAlign: "center" }}
          />
          <Column
            field="name"
            header="Name"
            sortable
            style={{ textAlign: "center" }}
          />
        </DataTable>
      </div>
    );
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
            <button className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center cursor-pointer">
              <i className="bi bi-file-earmark-pdf pr-1 "></i>
              Export pdf
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 ">
        {categoryLoading || categoryError ? (
          categoryLoading ? (
            <p>Loading inventories...</p>
          ) : (
            <p>Error: {categoryError.message}</p>
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
              value={categoryData.categories}
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
              expandedRows={expandedRows}
              onRowToggle={(e) => setExpandedRows(e.data)}
              rowExpansionTemplate={rowExpansionTemplate}
              size="small"
              // stripedRows
              onPage={onPage} //for when adding new coloumn new added will be listed at last
              rowsPerPageOptions={[5, 10, 20, 50]}
              filters={filters}
              globalFilterFields={["name", "category"]}
              emptyMessage="No inventory found."
              tableStyle={{ minWidth: "70rem", tableLayout: "fixed" }}
              className="min-h-full h-[72vh] overflow-auto !text-[14px] !font-[poppins]"
            >
              <Column expander style={{ width: "2%" }} />
              <Column
                header="S.No"
                headerClassName="font-[poppins]"
                body={(rowData, options) => options.rowIndex + 1}
                alignHeader={"center"}
                style={{
                  width: "5%",
                  textAlign: "center",
                }}
              />

              <Column
                header="Image"
                headerClassName=""
                body={(rowData) => (
                  <img
                    // src={resolveImageSrc(rowData.image)}
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
            </DataTable>{" "}
          </>
        )}
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
              <Dropdown
                value={editingRow.category}
                options={categoryOptions}
                onChange={(e) =>
                  setEditingRow({ ...editingRow, category: e.value })
                }
                onSelect={(e) => {
                  setEditingRow({
                    ...editingRow,
                    category: e.value.category,
                  });
                }}
                placeholder="Select a category"
                className="w-full !font-[poppins] placeholder:!text-sm "
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
                className="w-full placeholder:text-sm  !font-[poppins]"
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
                onClick={saveCategory}
                className="px-4 py-2 bg-[#E01514] text-white text-sm font-semibold rounded-r-md  cursor-pointer focus:outline-0 hover:bg-[#ff2828] "
              >
                Add
              </button>
            </div>
          </div>

          {loading || error ? (
            loading ? (
              <p>Loading inventories...</p>
            ) : (
              <p>Error: {error.message}</p>
            )
          ) : (
            <>
              <DataTable
                value={data.inventories}
                dataKey="id"
                rows={10}
                first={first}
                removableSort // <-- update state
                size="small"
                stripedRows
                onPage={onPage} //for when adding new coloumn new added will be listed at last
                filters={filters}
                emptyMessage="No categories listed."
                tableStyle={{ minWidth: "40rem", tableLayout: "fixed" }}
                className="min-h-full h-[34vh] overflow-auto !text-[14px] !font-[poppins] mt-5"
              >
                <Column
                  header="S.No"
                  headerClassName="font-[poppins]"
                  body={(rowData, options) => options.rowIndex + 1}
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
                        <i className="bi bi-pencil leading-none"></i>
                      </button>
                      <button
                        className=" !bg-red-500 !text-white flex items-center justify-center rounded-[6px] p-2.5 cursor-pointer"
                        onClick={() => confirmDelete(rowData)}
                      >
                        <i className="bi bi-trash leading-none"></i>
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
            </>
          )}
        </div>
      </Dialog>
    </section>
  );
}
