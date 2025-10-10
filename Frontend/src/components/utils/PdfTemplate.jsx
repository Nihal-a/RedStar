import React, { useState, useEffect } from "react";
import redstar_full from "../../assets/redstar_full.svg";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import "./pdf.css";
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

  // Select query based on type
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

  // Set header title
  useEffect(() => {
    switch (type) {
      case "books":
        setHead("Books Report");
        break;
      case "book_lending":
        setHead("Book Lending Report");
        break;
      case "inventory":
        setHead("Inventory Report");
        break;
      case "inventory_lending":
        setHead("Inventory Lending Report");
        break;
      case "memberships":
        setHead("Memberships Report");
        break;
      default:
        setHead("");
    }
  }, [type]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // Column definitions
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
      { key: "Member", label: "Member Name (MembershipId)" },
      { key: "lendedDate", label: "Lended Date" },
      { key: "returnDate", label: "Return Date" },
      { key: "status", label: "Status" },
    ],
    inventory: [
      { key: "sno", label: "S.No" },
      { key: "category", label: "Category" },
      { key: "totalInCategory", label: "Total" },
    ],
    inventory_lending: [
      { key: "sno", label: "S.No" },
      { key: "name", label: "Lender Name" },
      { key: "mobileNumber", label: "Mobile Number" },
      { key: "Inventory", label: "Inventory" },
      { key: "address", label: "Address" },
      { key: "lendedDate", label: "Lended Date" },
      { key: "returnDate", label: "Return Date" },
    ],
    memberships: [
      { key: "sno", label: "S.No" },
      { key: "name", label: "Member Name" },
      { key: "membershipId", label: "Membership Id" },
      { key: "dob", label: "DOB" },
      { key: "age", label: "Age" },
      { key: "mobileNumber", label: "Mobile Number" },
      { key: "address", label: "Address" },
    ],
  };

  const ignoreMap = {
    books: ["__typename", "id"],
    book_lending: ["__typename", "id"],
    inventory: ["__typename", "id", "category"],
    inventory_lending: ["__typename", "id"],
    memberships: ["__typename", "id"],
  };

  // Raw rows
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
      : [];

  const ignoreFields = ignoreMap[type] ?? [];
  const columns = columnMap[type] ?? [];

  // Function to calculate age from dob
  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Process rows
  let rows = [];

  if (type === "inventory") {
    const categories = {};
    (rawRows ?? []).forEach((inv) => {
      const catName = inv.category?.name || "Uncategorized";
      if (!categories[catName]) categories[catName] = [];
      categories[catName].push(inv);
    });

    let sno = 1;
    for (const [catName, items] of Object.entries(categories)) {
      items.forEach((item) => {
        rows.push({
          sno: sno++,
          category: catName,
          inventoryName: item.name,
          totalInCategory: items.length,
        });
      });
    }
  } else {
    rows = (rawRows ?? []).map((row, index) => {
      let flatRow = { ...row };

      // Book Lending: Member name + membershipId
      if (type === "book_lending" && row.member) {
        const memberName = row.member.name || "";
        const membershipId = row.member.membershipId || "";
        flatRow.Member = (
          <>
            {memberName}
            {membershipId && <br />}
            {membershipId && `(${membershipId})`}
          </>
        );
        delete flatRow.member;
      }

      // Memberships: calculate age, display dob and address
      if (type === "memberships") {
        flatRow.age = calculateAge(row.dob);
        flatRow.dob = row.dob ? new Date(row.dob).toLocaleDateString() : "";
        flatRow.address = row.address || "";
      }

      if (
        (type === "book_lending" || type === "inventory_lending") &&
        row.book
      ) {
        flatRow.Book = row.book.name;
        delete flatRow.book;
      }

      if (
        (type === "inventory" || type === "inventory_lending") &&
        row.inventory
      ) {
        flatRow.Inventory = row.inventory.name;
        delete flatRow.inventory;
      }

      flatRow.sno = index + 1;

      // Remove ignored fields
      flatRow = Object.fromEntries(
        Object.entries(flatRow).filter(([key]) => !ignoreFields.includes(key))
      );

      return flatRow;
    });
  }

  return (
    <div className="flex justify-center pdf-wrapper">
      <div className="relative w-[210mm] h-screen text-[poppins]">
        <div className="header fixed top-0 w-[210mm] h-[60mm] bg-[#f8f8f8] flex flex-col ">
          <div className="top-sec h-[35mm] flex items-center justify-between border-b-1">
            <img src={redstar_full} alt="RedStar_logo" className="h-[20mm]" />
            <h1 className="text-[24px] font-[poppins] font-semibold uppercase text-[#e01514]">
              {head}
            </h1>
          </div>
          <div className="h-[30mm] flex items-center justify-between text-[14px] py-1">
            <div className="address flex flex-col">
              <p>Reg No:</p>
              <p>Mukkilapeedika,</p>
              <p>Punnathala, Malappuram</p>
              <p>Kerala, 676552</p>
            </div>
            <div className="date h-full flex items-center">
              <p className="text-[14px]">
                Date: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer fixed bottom-0 w-[210mm] h-[10mm] bg-[#e01514] flex items-center justify-center gap-1 text-white">
          <p className="text-[13px] leading-none">
            - 6282260244 - 8157886888 - 9846080265 -
          </p>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr>
              <td>
                <div className="h-[65mm]"></div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
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
                <div className="h-[10mm]"></div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PdfTemplate;
