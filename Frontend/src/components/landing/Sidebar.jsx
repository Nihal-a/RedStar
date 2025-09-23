import React from "react";
import redstar_full from "../../assets/redstar_full.svg";
import redstar_logo from "../../assets/redstar_logo.svg";
import SidebarItem from "../utils/SidebarItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";


const Sidebar = ({ selectedMenu, onMenuChange }) => {

  return (
    <section className=" h-full flex flex-col shadow-lg">
      <div
        className="flex items-center justify-center py-4 lg:mt-1.5 mt-4.5 cursor-pointer"
        onClick={() => onMenuChange("HOME")}
      >
        <img src={redstar_full} alt="" className="w-[120px] hidden lg:block" />
        <img src={redstar_logo} alt="" className="w-[45px] block lg:hidden" />
      </div>
      <div className="flex flex-col items-center justify-start  w-full  p-2">
        <SidebarItem
          label="HOME"
          icon="bi-house"
          selected={selectedMenu === "HOME"}
          onClick={() => onMenuChange("HOME")}
        />
        <SidebarItem
          label="INVENTORY"
          icon="bi-bag-plus"
          selected={selectedMenu === "INVENTORY"}
          onClick={() => onMenuChange("INVENTORY")}
        />
        <SidebarItem
          label="INVENTORY LENDING"
          icon="bi-arrow-left-right"
          selected={selectedMenu === "INVENTORY_LENDING"}
          onClick={() => onMenuChange("INVENTORY_LENDING")}
        />
        <SidebarItem
          label="BOOK"
          icon="bi-book"
          selected={selectedMenu === "BOOK"}
          onClick={() => onMenuChange("BOOK")}
        />
        <SidebarItem
          label="BOOK LENDING"
          icon="bi-arrow-left-right"
          selected={selectedMenu === "BOOK_LENDING"}
          onClick={() => onMenuChange("BOOK_LENDING")}
        />
        <SidebarItem
          label="MEMBERSHIP"
          icon="bi-person"
          selected={selectedMenu === "MEMBERSHIP"}
          onClick={() => onMenuChange("MEMBERSHIP")}
        />
        <div
          // onClick={handleLogout}
          className="w-full flex items-center justify-start p-4 gap-4 cursor-pointer rounded-sm m-1 font-[poppins] hover:border-l-4 border-[#e01514] "
        >
          <i className={`bi-box-arrow-left text-[18px] `}></i>
          <p className=" font-[poppins] text-[14px] ">LOGOUT</p>
        </div>
        {/* <SidebarItem
          label="FINANCE"
          icon="bi-graph-up"
          selected={selectedMenu === "FINANCE"}
          onClick={() => onMenuChange("FINANCE")}
        />
        <SidebarItem
          label="REPORTS"
          icon="bi-file-earmark-text"
          selected={selectedMenu === "REPORTS"}
          onClick={() => onMenuChange("REPORTS")}
        />
        <SidebarItem
          label="BIN"
          icon="bi-trash3"
          selected={selectedMenu === "BIN"}
          onClick={() => onMenuChange("BIN")}
        /> */}
      </div>
    </section>
  );
};

export default Sidebar;
