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
import {
  CREATE_CATEGORY,
  CREATE_INVENTORY,
  DELETE_CATEGORY,
  DELETE_INVENTORY,
  UPDATE_CATEGORY,
  UPDATE_INVENTORY,
} from "../../graphql/mutations";

export default function Inventory() {
  //graphql
  const { data, loading, error, refetch } = useQuery(GET_INVENTORIES);
  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
    refetch: categoryFetch,
  } = useQuery(GET_CATEGORIES);

  console.log(categoryData);

  const [createInventory] = useMutation(CREATE_INVENTORY);
  const [DeleteInventory] = useMutation(DELETE_INVENTORY);
  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [updateInventory] = useMutation(UPDATE_INVENTORY);
  const [updateCategory] = useMutation(UPDATE_CATEGORY);
  const [deleteCategory] = useMutation(DELETE_CATEGORY);

  //components
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  // Modal states
  const [visible, setVisible] = useState(false);
  const [categoryModalVisible, setcategoryModalVisible] = useState(false);
  const [detaledViewModal, setdetaledViewModal] = useState(false);
  const [selectedCategory, setselectedCategory] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [orginalData, setorginalData] = useState({});
  const [formData, setformData] = useState({});
  const [categoryRow, setcategoryRow] = useState({
    name: "",
    image: null,
  });
  const toast = useRef(null);

  /* ---------- CRUD ---------- */
  const addRow = () => {
    setEditingRow({
      name: "",
      category: "",
      _isNew: true,
    });
    setVisible(true);
  };

  const saveRow = async () => {
    if (!editingRow.name?.trim() || !editingRow.category) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please fill in all required fields",
      });
      return;
    }

    try {
      if (editingRow._isNew) {
        // CREATE
        await createInventory({
          variables: {
            name: editingRow.name,
            category: editingRow.category,
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
      } else {
        // UPDATE
        const changes = getChangeFields();
        if (Object.keys(changes).length > 0) {
          await updateInventory({
            variables: { id: formData.id, ...changes },
          });
        }
      }

      setVisible(false);
      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: formData._isNew
          ? "Inventory saved successfully"
          : "Inventory edited successfully",
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
  };

  const resolveImageSrc = (image) => {
    if (!image) return "";
    if (image.startsWith("data:image")) {
      return image;
    }
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    return `${process.env.REACT_APP_API_URL || ""}${image}`;
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

  const confirmDelete = (rowData, type) => {
    confirmDialog({
      message: `Delete "${rowData.name || "this item"}"? ${type}`,
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
        if (type === "inventory") {
          await DeleteInventory({ variables: { id: rowData.id } });
          refetch();
          categoryFetch();
        } else if (type === "category") {
          await deleteCategory({ variables: { id: rowData.id } });
          categoryFetch();
        }

        toast.current?.show({
          severity: "success",
          summary: "Deleted",
          detail: `${type === "inventory" ? "Inventory" : "Category"} removed`,
        });
      },
    });
  };

  const addCategoryRow = () => {
    setcategoryRow({
      name: "",
      image: null,
      _isNew: true,
    });
    setcategoryModalVisible(true);
  };

  const saveCategory = async () => {
    console.log(categoryRow);
    if (!categoryRow.name?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please fill in all required fields",
      });
      return;
    }
    if (!categoryRow) return;
    try {
      if (categoryRow._isNew) {
        await createCategory({
          variables: { name: categoryRow.name, image: categoryRow.image },
        });
        setcategoryRow({ name: "", image: null });
        // setcategoryModalVisible(false);
        toast.current?.show({
          severity: "success",
          summary: "Saved",
          detail: "Row saved",
        });
        categoryFetch();
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
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

  const textEditor = (options) => {
    return (
      <InputText
        type="text"
        value={options.value}
        onChange={(e) => options.editorCallback(e.target.value)}
        className=" flex-1 placeholder:!text-sm !p-2 md:!p-1.5 !font-[poppins] !px-3 !rounded-md !mx-2 sm:mx-3 w-full !md:w-auto"
      />
    );
  };

  return (
    <section className="w-full min-h-screen px-5 py-5 bg-[#f5f5f5]">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="w-full bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between w-full gap-3">
          <div className="text-center md:text-left">
            <h1 className="font-bold text-[16px] md:text-[22px]">INVENTORY</h1>
            <p className="text-sm text-gray-500">
              Manage inventory, add/edit inventory
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start w-full md:w-auto">
            <button
              onClick={addRow}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center flex-shrink-0"
            >
              Add Inventory
            </button>
            <button
              onClick={addCategoryRow}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[rgb(224,21,20)] hover:bg-[#ff2828] flex items-center justify-center flex-shrink-0"
            >
              Add Category
            </button>
            <button className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center flex-shrink-0">
              <i className="bi bi-file-earmark-pdf pr-1"></i>
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
              rows={rows}
              alwaysShowPaginator
              paginatorClassName="mt-3"
              first={first}
              removableSort
              size="small"
              onPage={onPage}
              rowsPerPageOptions={[5, 10, 20, 50]}
              filters={filters}
              globalFilterFields={["name"]}
              emptyMessage="No inventory found."
              tableStyle={{
                minWidth:
                  window.innerWidth >= 1024
                    ? "60rem"
                    : window.innerWidth >= 768
                    ? "50rem"
                    : "40rem",
                tableLayout: "fixed",
              }}
              className="min-h-full h-[72vh] overflow-auto !text-[14px] !font-[poppins] "
            >
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
                header="View"
                headerClassName="font-[poppins]"
                body={(rowData) => (
                  <i
                    className="pi pi-eye cursor-pointer text-blue-500 p-2 rounded bg-blue-100"
                    onClick={() => {
                      setselectedCategory(rowData);
                      setdetaledViewModal(true);
                    }}
                  ></i>
                )}
                alignHeader="center"
                style={{
                  width: "5%",
                  textAlign: "center",
                }}
              />

              <Column
                header="Image"
                headerClassName=""
                body={(rowData) => {
                  return rowData.image ? (
                    <img
                      src={rowData.image}
                      alt={rowData.name}
                      className="mx-auto w-10 h-10 object-cover rounded-[6px]"
                    />
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  );
                }}
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
                header="Total Stock"
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  width: "10%",
                  textAlign: "center",
                }}
              />
              <Column
                field="available"
                header="Avail Stock"
                sortable
                headerClassName="font-[poppins]"
                alignHeader={"center"}
                style={{
                  width: "13%",
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
        className="w-[90%] md:w-[40%] sm:w-[40%]"
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
          </div>
        )}
      </Dialog>

      <Dialog
        header={"Add Category"}
        headerClassName="!font-[poppins]"
        visible={categoryModalVisible}
        draggable={false}
        className="w-[90%] lg:w-[40%] md:w-[50%] sm:w-[50%]"
        modal
        onHide={() => setcategoryModalVisible(false)}
      >
        <div className="w-full flex flex-col gap-3">
          <div className="w-full">
            <label className="block text-sm font-medium mb-1">
              Category Name*
            </label>
            <div className="w-full flex">
              <InputText
                value={categoryRow.name}
                onChange={(e) =>
                  setcategoryRow({ ...categoryRow, name: e.target.value })
                }
                placeholder="Type category name..."
                className="flex-1 placeholder:text-sm  !p-1.5 !font-[poppins] !px-3  font-poppins rounded-md sm:rounded-l-md sm:rounded-r-none w-full"
              />
              <button
                type="button"
                onClick={saveCategory}
                className="px-4 py-2 bg-[#E01514] text-white text-sm font-semibold rounded-md sm:rounded-r-md sm:rounded-l-none flex-shrink-0 hover:bg-[#ff2828] focus:outline-none"
              >
                Add
              </button>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                Product Image
              </label>

              {/* Styled file input */}
              <label className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md cursor-pointer bg-white hover:bg-gray-50 text-sm">
                <span className="text-gray-600">
                  {categoryRow.image ? "Change Image" : "Choose an image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setcategoryRow({
                          ...categoryRow,
                          image: ev.target?.result,
                        });
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              {/* Preview */}
              {categoryRow.image && (
                <div className="mt-3">
                  <img
                    src={resolveImageSrc(categoryRow.image)}
                    alt="preview"
                    className="w-25 h-25 sm:w-30 sm:h-30 object-cover rounded-md border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>

          {categoryLoading || categoryError ? (
            categoryLoading ? (
              <p>Loading inventories...</p>
            ) : (
              <p>Error: {categoryError.message}</p>
            )
          ) : (
            <>
              <DataTable
                value={categoryData.categories}
                dataKey="id"
                rows={10}
                first={first}
                removableSort // <-- update state
                size="small"
                stripedRows
                onPage={onPage} //for when adding new coloumn new added will be listed at last
                filters={filters}
                emptyMessage="No categories listed."
                tableStyle={{
                  minWidth: "30rem",
                  tableLayout: "fixed",
                }}
                className="min-h-full h-[34vh] overflow-auto !text-[14px] !font-[poppins] mt-5"
                editMode="row"
                rowEditorInitIcon="bi bi-pencil cursor-pointer text-blue-500 p-2 rounded bg-blue-100"
                rowEditorSaveIcon="bi bi-check-lg cursor-pointer text-green-600 p-2 rounded bg-green-100"
                rowEditorCancelIcon="bi bi-x-lg cursor-pointer text-red-500 p-2 rounded bg-red-100"
                onRowEditInit={(e) => setorginalData(e.data)}
                onRowEditCancel={() => {
                  setorginalData(null);
                }}
                onRowEditSave={async (e) => {
                  try {
                    const changes = {};
                    for (const key in e.newData) {
                      if (e.newData[key] !== e.data[key]) {
                        changes[key] = e.newData[key];
                      }
                    }

                    if (Object.keys(changes).length > 0) {
                      await updateCategory({
                        variables: { id: e.newData.id, ...changes },
                      });
                      toast.current?.show({
                        severity: "success",
                        summary: "Updated",
                        detail: "Inventory updated successfully",
                      });
                    }
                  } catch (err) {
                    toast.current?.show({
                      severity: "error",
                      summary: "Error",
                      detail: err.message,
                    });
                  }
                }}
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
                  rowEditor
                  style={{
                    width: "20%",
                    textAlign: "center",
                  }}
                  headerClassName="text-left"
                  bodyClassName="text-left"
                />
                <Column
                  header="Actions"
                  alignHeader={"center"}
                  headerClassName="font-[poppins] "
                  body={(rowData) => (
                    <div className="flex gap-2">
                      <i
                        className="bi bi-trash  cursor-pointer text-red-500 p-2 rounded bg-red-100"
                        onClick={() => confirmDelete(rowData, "category")}
                      ></i>
                    </div>
                  )}
                  bodyStyle={{ alignContent: "center" }}
                  style={{
                    width: "10%",
                    textAlign: "center",
                  }}
                />
                <Column
                  field="name"
                  header="Name"
                  editor={(options) => textEditor(options)}
                  headerClassName="font-[poppins]"
                  alignHeader={"center"}
                  body={(rowData) => (
                    <div className="overflow-x-auto whitespace-nowrap text-center">
                      {rowData.name}
                    </div>
                  )}
                  style={{
                    textAlign: "center",
                  }}
                />
              </DataTable>
            </>
          )}
        </div>
      </Dialog>

      <Dialog
        header={selectedCategory?.name}
        headerClassName="!font-[poppins]"
        visible={detaledViewModal}
        draggable={false}
        className="w-[90%] md:w-[40%] "
        modal
        onHide={() => {
          setdetaledViewModal(false), setselectedCategory(null);
        }}
      >
        <div className="flex flex-col gap-3">
          {loading || error ? (
            loading ? (
              <p>Loading inventories...</p>
            ) : (
              <p>Error: {error.message}</p>
            )
          ) : (
            <>
              <DataTable
                value={data.inventories?.filter(
                  (inv) => inv.category?.id === selectedCategory?.id
                )}
                dataKey="id"
                rows={10}
                first={first}
                removableSort
                size="small"
                editMode="row"
                stripedRows
                rowEditorInitIcon="bi bi-pencil cursor-pointer text-blue-500 p-2 rounded bg-blue-100"
                rowEditorSaveIcon="bi bi-check-lg cursor-pointer text-green-600 p-2 rounded bg-green-100"
                rowEditorCancelIcon="bi bi-x-lg cursor-pointer text-red-500 p-2 rounded bg-red-100"
                onPage={onPage}
                filters={filters}
                emptyMessage="No products listed yet...."
                tableStyle={{ minWidth: "30rem", tableLayout: "fixed" }}
                className="min-h-full h-[34vh] overflow-auto !text-[14px] !font-[poppins] mt-5"
                // onRowEditInit={(e) => setorginalData(e.data)}
                onRowEditCancel={() => {
                  setorginalData(null);
                }}
                onRowEditSave={async (e) => {
                  try {
                    const changes = {};
                    for (const key in e.newData) {
                      if (e.newData[key] !== e.data[key]) {
                        changes[key] = e.newData[key];
                      }
                    }

                    if (Object.keys(changes).length > 0) {
                      await updateInventory({
                        variables: { id: e.newData.id, ...changes },
                      });
                      toast.current?.show({
                        severity: "success",
                        summary: "Updated",
                        detail: "Inventory updated successfully",
                      });
                    }
                  } catch (err) {
                    toast.current?.show({
                      severity: "error",
                      summary: "Error",
                      detail: err.message,
                    });
                  }
                }}
              >
                <Column
                  header="S.No"
                  headerClassName="font-[poppins]"
                  body={(rowData, options) => options?.rowIndex + 1}
                  alignHeader="center"
                  style={{
                    width: "5%",
                    textAlign: "center",
                  }}
                />
                <Column
                  rowEditor
                  style={{
                    width: "13%",
                    textAlign: "center",
                  }}
                />
                <Column
                  header="Actions"
                  headerClassName="font-[poppins]"
                  body={(rowData) => (
                    <div className="flex gap-2 justify-center">
                      <i
                        className="bi bi-trash  cursor-pointer text-red-500 p-2 rounded bg-red-100"
                        onClick={() => confirmDelete(rowData, "inventory")}
                      ></i>
                    </div>
                  )}
                  alignHeader={"center"}
                  style={{
                    width: "5%",
                    textAlign: "center",
                  }}
                />
                <Column
                  field="name"
                  header="Name"
                  editor={(options) => textEditor(options)}
                  headerClassName="font-[poppins]"
                  alignHeader={"center"}
                  style={{
                    width: "20%",
                    textAlign: "center",
                  }}
                />

                <Column
                  field="status"
                  header="Status"
                  headerClassName="font-[poppins]"
                  body={(rowData) => (
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        rowData?.status
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {rowData.status ? "AVAILABLE" : "UNAVAILABLE"}
                    </span>
                  )}
                  alignHeader={"center"}
                  style={{
                    width: "15%",
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
