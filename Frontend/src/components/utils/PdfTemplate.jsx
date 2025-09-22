import React from "react";
import redstar_full from "../../assets/redstar_full.svg";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import {
  GET_BOOK_LENDING,
  GET_BOOKS,
  GET_INVENTORIES,
  GET_INVENTORY_LENDING,
  GET_MEMBERSHIPS,
} from "../graphql/queries";

const PdfTemplate = () => {
  const { type } = useParams();
  const [head, setHead] = useState("");

  // 1️⃣ Select query based on type
  const query =
    type === "books"
      ? GET_BOOKS
      : type === "book_lending"
      ? GET_BOOK_LENDING
      : type === "inventory"
      ? GET_INVENTORIES
      : type === "inventory_lending"
      ? GET_INVENTORY_LENDING
      : type === "memberships"
      ? GET_MEMBERSHIPS
      : null;

  const { data, loading, error } = useQuery(query);

  // 2️⃣ Set heading
  useEffect(() => {
    if (type === "books") setHead("Books Report");
    else if (type === "book_lending") setHead("Book Lending Report");
    else if (type === "inventory") setHead("Inventory Report");
    else if (type === "inventory_lending") setHead("Inventory Lending Report");
    else if (type === "memberships") setHead("Memberships Report");
  }, [type]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // 3️⃣ Columns map
  const columnMap = {
    books: [
      { key: "sno", label: "S.No" },
      { key: "name", label: "Book Name" },
      { key: "author", label: "Author" },
      { key: "total", label: "Total Books" },
      { key: "available", label: "Available" },
    ],
    book_lending: [
      { key: "sno", label: "S.No" },
      { key: "Book", label: "Book Name" },
      { key: "Member", label: "Member Name" },
      { key: "lendedDate", label: "Lended Date" },
      { key: "returnDate", label: "Return Date" },
      { key: "status", label: "Status" },
    ],
    inventory: [
      { key: "sno", label: "S.No" },
      { key: "name", label: "Item Code" },
      { key: "Category", label: "Category" },
    ],
    inventory_lending: [
      { key: "sno", label: "S.No" },
      { key: "name", label: "Lender Name" },
      { key: "mobileNumber", label: "Mobile Number" },
      { key: "Inventory", label: "Inventory" },
      { key: "address", label: "address" },
      { key: "lendedDate", label: "Lended Date" },
      { key: "returnDate", label: "Return Date" },
    ],
    memberships: [
      { key: "sno", label: "S.No" },
      { key: "name", label: "Member Name" },
      { key: "membershipId", label: "membershipId" },
      { key: "mobileNumber", label: "Mobile Number" },
    ],
  };

  // 4️⃣ Fields to ignore per type
  const ignoreMap = {
    books: ["__typename", "id"],
    book_lending: ["__typename", "id"],
    inventory: ["__typename", "id"],
    inventory_lending: ["__typename", "id"],
    memberships: ["__typename", "id"],
  };

  // 5️⃣ Select raw rows based on type
  const rawRows =
    type === "books"
      ? data?.books
      : type === "book_lending"
      ? data?.bookLending
      : type === "inventory"
      ? data?.inventories
      : type === "inventory_lending"
      ? data?.inventoryLending
      : type === "memberships"
      ? data?.memberships
      : null;

  const ignoreFields = ignoreMap[type] ?? [];
  const columns = columnMap[type] ?? [];

  const rows = (rawRows ?? []).map((row, index) => {
    let flatRow = { ...row };

    // Flatten nested fields
    if ((type === "book_lending" || type === "inventory_lending") && row.book) {
      flatRow.Book = row.book.name;
      delete flatRow.book;
    }

    if (
      (type === "book_lending" || type === "inventory_lending") &&
      row.member
    ) {
      flatRow.Member = row.member.name;
      delete flatRow.member;
    }

    if (
      (type === "inventory" || type === "inventory_lending") &&
      row.inventory
    ) {
      flatRow.Inventory = row.inventory.name;
      delete flatRow.category;
    }

    // Serial number
    flatRow.sno = index + 1;

    // Remove ignored fields
    flatRow = Object.fromEntries(
      Object.entries(flatRow).filter(([key]) => !ignoreFields.includes(key))
    );

    return flatRow;
  });

  console.log(data);
  console.log(rows);
  return (
    <div className="flex justify-center">
      <div className="relative w-[210mm] h-screen  text-[poppins]">
        <div className="header fixed top-0 w-[210mm]  h-[60mm] bg-[#f8f8f8]  flex flex-col px-[10mm]">
          <div className="top-sec h-[35mm] flex items-center justify-between border-b-1 ">
            <img src={redstar_full} alt="RedStar_logo" className="h-[20mm] " />
            <h1 className="text-[24px] font-[poppins] font-semibold uppercase text-[#e01514]">
              {head}
            </h1>
          </div>
          <div className="h-[30mm] flex items-center justify-between text-[14px] py-1">
            <div className="address flex flex-col ">
              <p>Reg No:</p>
              <p>Mukkilapeedika,</p>
              <p>Punnathala, Malappuram </p>
              <p>Kerala, 676552</p>
            </div>
            <div className="date h-full flex items-center">
              <p className="text-[14px]">
                Date:{new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="footer fixed bottom-0 w-[210mm] h-[10mm] bg-[#e01514] flex items-center justify-center gap-1  text-white">
          <p className="text-[13px] leading-none">
            - 6282260244 - 8157886888 - 9846080265 -
          </p>
        </div>

        <table className="w-full">
          <thead>
            <tr>
              <td>
                <div className="h-[65mm] "></div>
              </td>
            </tr>
          </thead>
          <tbody className="w-full">
            <tr className="w-full">
              <td className=" w-full">
                <table className="text-black w-[190mm] border-collapse border border-gray-300 text-[14px] mx-auto">
                  <thead className="bg-[#e01514]">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="border border-gray-300 px-3 py-2 uppercase text-white"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-100">
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="border border-gray-300 px-4 py-2"
                          >
                            {row[col.key] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                <div className="h-[10mm] "></div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PdfTemplate;
