// src/components/landing/pages/Inventory.jsx
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
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
  //queries
  const { data, loading, error, refetch } = useQuery(GET_INVENTORIES);
  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
    refetch: categoryFetch,
  } = useQuery(GET_CATEGORIES);

  //mutations
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
  const [categoryModalFilters, setCategoryModalFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [categoryModalFilterValue, setCategoryModalFilterValue] = useState("");
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);

  //Category modal States
  const [categoryModalVisible, setcategoryModalVisible] = useState(false);
  const [selectedCategory, setselectedCategory] = useState(null);
  const [categoryRow, setcategoryRow] = useState({
    name: "",
    image: null,
  });

  //Inventory modal States
  const [visible, setVisible] = useState(false);
  const [editingRow, setEditingRow] = useState({ name: "", category: "" });

  //Detailedview of products each category modal states
  const [detaledViewModal, setdetaledViewModal] = useState(false);
  const toast = useRef(null);

  //for hidden input functions while updating image
  const fileInputRef = useRef(null);

  const [updatingCategoryImage, setUpdatingCategoryImage] = useState({
    id: null,
    file: null,
    preview: null,
  });

  //create inventory
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
      await createInventory({
        variables: {
          name: editingRow.name,
          category: editingRow.category,
        },
        refetchQueries: [{ query: GET_INVENTORIES }, { query: GET_CATEGORIES }],
        awaitRefetchQueries: true,
      });
      setEditingRow({ name: "", category: "" });
      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: "Inventory Added Succesfully",
      });
      setVisible(false);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
  };

  //For create Category
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const saveCategory = async () => {
    if (!categoryRow.name?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please fill in all required fields",
      });
      return;
    }

    if (!categoryRow) return;

    let convertedImage = null;

    if (categoryRow.image) {
      convertedImage = await convertToBase64(categoryRow.image);
    }

    try {
      await createCategory({
        variables: {
          name: categoryRow.name,
          image: convertedImage,
        },
        refetchQueries: [{ query: GET_CATEGORIES }, { query: GET_INVENTORIES }],
        awaitRefetchQueries: true,
      });

      setcategoryRow({ name: "", image: null });
      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: "Category Added",
      });
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
  };

  //For updating category (Inline edit)
  const UpdateCategoryDetails = async (e) => {
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
          detail: "Category updated successfully",
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

  const updateCategoryImage = async (categoryId, file) => {
    if (!file) return;

    try {
      const base64Image = await convertToBase64(file);
      await updateCategory({
        variables: { id: categoryId, image: base64Image },
        refetchQueries: [{ query: GET_CATEGORIES }],
      });

      toast.current?.show({
        severity: "success",
        summary: "Updated",
        detail: "Category image updated successfully",
      });

      // Reset after success
      setUpdatingCategoryImage({ id: null, file: null, preview: null });
      fileInputRef.current.value = null;
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
  };

  //For update inventory details
  const UpdateInventoryDetails = async (e) => {
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
  };

  //For deletion of both catgory and inventory
  const confirmDelete = (rowData, type) => {
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
        try {
          if (type === "inventory") {
            await DeleteInventory({
              variables: { id: rowData.id },
              refetchQueries: [
                { query: GET_CATEGORIES },
                { query: GET_INVENTORIES },
              ],
              awaitRefetchQueries: true,
            });
          } else if (type === "category") {
            await deleteCategory({
              variables: { id: rowData.id },
              refetchQueries: [
                { query: GET_CATEGORIES },
                { query: GET_INVENTORIES },
              ],
              awaitRefetchQueries: true,
            });
          }
          toast.current?.show({
            severity: "success",
            summary: "Deleted",
            detail: `${
              type === "inventory" ? "Inventory" : "Category"
            } removed`,
          });
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err.message,
          });
        }
      },
    });
  };

  //dropdownoptions in category select when adding a inventory in albhepetical order
  const categoryOptions = categoryLoading
    ? [{ label: "Select Category", value: "" }]
    : [
        { label: "Select Category", value: "" },
        ...(categoryData?.categories
          .filter(
            (cat, index, self) =>
              cat && self.findIndex((c) => c.id === cat.id) === index
          )
          .slice()
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
          )
          .map((cat) => ({
            label: cat.name,
            value: cat.id.toString(),
          })) || []),
      ];

  //searching filteration global datatable
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  //searching filteration category datatable
  const onCategoryModalFilterChange = (e) => {
    const value = e.target.value;
    const _filters = { ...categoryModalFilters };
    _filters["global"].value = value;

    setCategoryModalFilters(_filters);
    setCategoryModalFilterValue(value);
  };

  //for when adding new coloumn new added will be listed at last
  const onPage = (e) => {
    setFirst(e.first);
    setRows(e.rows);
  };

  //for inline edit text editor openup a inut field
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
    <section className="w-full h-full px-5 py-5 bg-[#f5f5f5]">
      <div className="w-full bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between w-full gap-3">
          <div className="text-center md:text-left">
            <h1 className="font-bold text-[16px] md:text-[22px]">INVENTORY</h1>
            <p className="text-sm text-gray-500">
              Manage inventory, add/edit inventory
            </p>
          </div>
          <div className=" flex flex-wrap gap-3 items-center justify-center md:justify-start w-full md:w-auto ">
            <button
              onClick={() => {
                setEditingRow({ name: "", category: "" });
                setVisible(true);
              }}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center flex-shrink-0"
            >
              Add Inventory
            </button>
            <button
              onClick={() => setcategoryModalVisible(true)}
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[rgb(224,21,20)] hover:bg-[#ff2828] flex items-center justify-center flex-shrink-0"
            >
              Add Category
            </button>
            <button
              className="rounded-lg text-[14px] font-semibold px-5 py-2 text-white bg-[#E01514] hover:bg-[#ff2828] flex items-center justify-center flex-shrink-0"
              onClick={() =>
                window.open(
                  "https://redstarpunnathala.in/api/pdfprint/inventory",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
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
            <div className="w-full p-5 bg-[#F9FAFB] mb-3 rounded-sm border-1 border-[#e6e6e6] flex md:justify-end justify-center">
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
            {/* main landing datatable */}
            <DataTable
              value={categoryData.categories || []}
              dataKey="id"
              alwaysShowPaginator={true}
              paginatorClassName="mt-3"
              paginator={categoryData?.categories?.length > 5 || rows > 5}
              rowsPerPageOptions={[5, 10, 20, 50]}
              rows={rows}
              first={first}
              removableSort
              size="small"
              onPage={onPage}
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
              className=" overflow-auto !text-[14px] !font-[poppins] "
            >
              <Column
                header="S.No"
                headerClassName="font-[poppins] uppercase"
                body={(rowData, options) => options.rowIndex + 1}
                alignHeader={"center"}
                style={{
                  width: "5%",
                  textAlign: "center",
                }}
              />

              <Column
                header="View"
                headerClassName="font-[poppins] uppercase"
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
                  width: "7%",
                  textAlign: "center",
                }}
              />

              <Column
                header="Image"
                headerClassName="uppercase"
                body={(rowData) => {
                  return rowData.image ? (
                    <img
                      src={`https://redstarpunnathala.in/media/${rowData.image}`}
                      alt={rowData.name}
                      className="mx-auto w-10 h-10 object-cover rounded-[2px]"
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
                headerClassName="font-[poppins] uppercase"
                className="uppercase"
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />

              <Column
                header="Total Stock"
                body={(rowData) => {
                  const totalCount = rowData?.inventories?.length || 0;

                  return (
                    <div className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {totalCount}
                    </div>
                  );
                }}
                headerClassName="font-[poppins] uppercase"
                alignHeader={"center"}
                style={{
                  textAlign: "center",
                }}
              />

              <Column
                header="Avail Stock"
                body={(rowData) => {
                  const availableCount =
                    rowData?.inventories?.filter(
                      (inv) => inv.status === true || inv.status === 1
                    ).length || 0;
                  return (
                    <div className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {availableCount}
                    </div>
                  );
                }}
                sortable
                headerClassName="font-[poppins] uppercase"
                alignHeader={"center"}
                style={{
                  width: "13%",
                  textAlign: "center",
                }}
              />

              <Column
                header="Status"
                headerClassName="font-[poppins] uppercase"
                body={(rowData) => {
                  const availableCount =
                    rowData?.inventories?.filter(
                      (inv) => inv.status === true || inv.status === 1
                    ).length || 0;

                  return (
                    <div
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        availableCount > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {availableCount > 0 ? "AVAILABLE" : "UNAVAILABLE"}
                    </div>
                  );
                }}
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

      {/* Inventory adding modal */}
      <Dialog
        header={"Add Inventory"}
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
                className="w-full !font-[poppins] placeholder:!text-sm [&>.p-dropdown-label]:!p-1.5 !px-2"
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Category Adding modal */}
      <Dialog
        header={"Add Category"}
        headerClassName="!font-[poppins]"
        visible={categoryModalVisible}
        draggable={false}
        className="w-[90%] lg:w-[40%] md:w-[50%] sm:w-[50%]"
        modal
        onHide={() => {
          fileInputRef.current.value = null;
          setUpdatingCategoryImage({ id: null, file: null, preview: null });
          setcategoryModalVisible(false);
        }}
      >
        <div className="w-full flex flex-col gap-1">
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
                          preview: ev.target?.result,
                          image: file,
                        });
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {categoryRow.preview && (
                <div className="mt-3">
                  <img
                    src={categoryRow.preview}
                    alt="preview"
                    className="w-25 h-25 sm:w-30 sm:h-30 object-cover rounded-md border border-gray-200"
                  />
                </div>
              )}
              {updatingCategoryImage.preview && (
                <div className="mt-3 flex flex-col items-start gap-2">
                  <img
                    src={updatingCategoryImage.preview}
                    alt="preview"
                    className="w-25 h-25 sm:w-30 sm:h-30 object-cover rounded-md border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateCategoryImage(
                        updatingCategoryImage.id,
                        updatingCategoryImage.file
                      )
                    }
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Save Image
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <div className="relative ">
                <input
                  value={categoryModalFilterValue}
                  onChange={onCategoryModalFilterChange}
                  type="text"
                  placeholder="Search..."
                  className="w-full py-1.5 pl-8  pr-3 text-sm rounded-md ring-1 ring-gray-300  focus:outline-none"
                />
                <i className="bi bi-search  absolute left-[10px] top-[50%] translate-y-[-50%] text-[14px] text-black"></i>
              </div>
            </div>
            {/* for update image hidden input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && updatingCategoryImage.id) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setUpdatingCategoryImage({
                      ...updatingCategoryImage,
                      file,
                      preview: ev.target.result,
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
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
                removableSort
                size="small"
                stripedRows
                onPage={onPage}
                filters={categoryModalFilters}
                globalFilterFields={["name"]}
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
                onRowEditSave={(e) => UpdateCategoryDetails(e)}
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
                    width: "3.5rem",
                    textAlign: "center",
                  }}
                  headerClassName="text-left"
                  bodyClassName="text-left  "
                />
                <Column
                  header="Actions"
                  alignHeader={"center"}
                  headerClassName="font-[poppins] "
                  body={(rowData) => (
                    <div className="flex gap-2 justify-center">
                      <i
                        className="bi bi-trash cursor-pointer text-red-500 p-2 rounded bg-red-100"
                        onClick={() => confirmDelete(rowData, "category")}
                      ></i>

                      <div className="flex gap-2">
                        <i
                          className="bi bi-image cursor-pointer text-green-500 p-2 rounded bg-green-100"
                          onClick={() => {
                            setUpdatingCategoryImage({
                              id: rowData.id,
                              file: null,
                              preview: null,
                            });
                            fileInputRef.current.click();
                          }}
                        ></i>
                      </div>
                    </div>
                  )}
                  bodyStyle={{ alignContent: "center" }}
                  style={{
                    width: "20%",
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
                  className="uppercase"
                />
              </DataTable>
            </>
          )}
        </div>
      </Dialog>

      {/* Detailled view of inventory category wise */}
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
                editMode="row"
                stripedRows
                rowEditorInitIcon="bi bi-pencil cursor-pointer text-blue-500 p-2 bg-blue-100"
                rowEditorSaveIcon="bi bi-check-lg cursor-pointer text-green-600 p-2 rounded-md bg-green-100"
                rowEditorCancelIcon="bi bi-x-lg cursor-pointer text-red-500 p-2 rounded-md  bg-red-100"
                onPage={onPage}
                filters={filters}
                emptyMessage="No products listed yet...."
                tableStyle={{ minWidth: "30rem", tableLayout: "fixed" }}
                className="min-h-full h-[34vh] overflow-auto !text-[14px] !font-[poppins] mt-5"
                onRowEditSave={(e) => UpdateInventoryDetails(e)}
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
                    width: "7%",
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
                  className="uppercase"
                  alignHeader={"center"}
                  style={{
                    width: "20%",
                    textAlign: "center",
                  }}
                />

                <Column
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
      <Toast ref={toast} />
      <ConfirmDialog />
    </section>
  );
}
