import React, { useState, useEffect } from "react";
import redstar_full from "../../assets/redstar_full.svg";
import redstar_logo from "../../assets/redstar_logo.svg";
import SidebarItem from "../utils/SidebarItem";
import { gql } from "@apollo/client";
import { Dialog } from "primereact/dialog";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import {
  DELETE_REFRESH_TOKEN_COOKIE_MUTATION,
  DELETE_TOKEN_COOKIE_MUTATION,
  REFRESH_MUTATION,
  REVOKE_TOKEN_MUTATION,
  VERIFY_MUTATION,
} from "../graphql/mutations";

const Sidebar = ({ selectedMenu, onMenuChange, onLogout }) => {
  const [verifyToken] = useMutation(VERIFY_MUTATION);
  const [refreshToken] = useMutation(REFRESH_MUTATION, {
    context: { fetchOptions: { credentials: "include" } },
  });

  const navigate = useNavigate();

  const handleValidate = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.removeItem("token");
      navigate("/");
      return false;
    }
    try {
      await verifyToken({ variables: { token } });
      return true;
    } catch (err) {
      try {
        const response = await refreshToken();
        const newToken = response?.data?.refreshToken?.token;
        if (newToken) {
          localStorage.setItem("token", newToken);
          return true;
        }
      } catch (refreshErr) {
        console.error("Refresh failed", refreshErr);
      }
      localStorage.removeItem("token");
      navigate("/signin");
      return false;
    }
  };

  const [revokeToken] = useMutation(REVOKE_TOKEN_MUTATION, {
    context: { fetchOptions: { credentials: "include" } },
  });

  const [deleteRefreshTokenCookie] = useMutation(
    DELETE_REFRESH_TOKEN_COOKIE_MUTATION,
    { context: { fetchOptions: { credentials: "include" } } }
  );

  const [deleteTokenCookie] = useMutation(DELETE_TOKEN_COOKIE_MUTATION, {
    context: { fetchOptions: { credentials: "include" } },
  });

  const handleLogout = async () => {
    try {
      await revokeToken({
        context: { fetchOptions: { credentials: "include" } },
      });
      await deleteRefreshTokenCookie({
        context: { fetchOptions: { credentials: "include" } },
      });
      await deleteTokenCookie({
        context: { fetchOptions: { credentials: "include" } },
      });
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      localStorage.removeItem("token");
      navigate("/signin");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      handleLogout();
      navigate("/signin");
    }
  }, [navigate]);

  return (
    <div className="flex flex-col h-full lg:shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center lg:py-4 py-1 cursor-pointer">
        <img
          src={redstar_full}
          alt="full-logo"
          className="w-[120px] hidden lg:block"
          onClick={() => onMenuChange("HOME")}
        />
        {/* <img
          src={redstar_logo}
          alt="mini-logo"
          className="w-[45px] block lg:hidden "
          onClick={() => onMenuChange("HOME")}
        /> */}
      </div>

      {/* Menu items */}
      <div className="flex flex-col items-center justify-start w-full p-2">
        <SidebarItem
          label="HOME"
          icon="bi-house"
          selected={selectedMenu === "HOME"}
          onClick={async () => {
            const ok = await handleValidate();
            if (ok) onMenuChange("HOME");
          }}
        />
        <SidebarItem
          label="INVENTORY"
          icon="bi-bag-plus"
          selected={selectedMenu === "INVENTORY"}
          onClick={async () => {
            const ok = await handleValidate();
            if (ok) onMenuChange("INVENTORY");
          }}
        />
        <SidebarItem
          label="INVENTORY LENDING"
          icon="bi-arrow-left-right"
          selected={selectedMenu === "INVENTORY_LENDING"}
          onClick={async () => {
            const ok = await handleValidate();
            if (ok) onMenuChange("INVENTORY_LENDING");
          }}
        />
        <SidebarItem
          label="BOOK"
          icon="bi-book"
          selected={selectedMenu === "BOOK"}
          onClick={async () => {
            const ok = await handleValidate();
            if (ok) onMenuChange("BOOK");
          }}
        />
        <SidebarItem
          label="BOOK LENDING"
          icon="bi-arrow-left-right"
          selected={selectedMenu === "BOOK_LENDING"}
          onClick={async () => {
            const ok = await handleValidate();
            if (ok) onMenuChange("BOOK_LENDING");
          }}
        />
        <SidebarItem
          label="MEMBERSHIP"
          icon="bi-person"
          selected={selectedMenu === "MEMBERSHIP"}
          onClick={async () => {
            const ok = await handleValidate();
            if (ok) onMenuChange("MEMBERSHIP");
          }}
        />

        {/* Logout */}
        <div
          onClick={onLogout}
          className="w-full flex items-center justify-start p-4 gap-4 cursor-pointer rounded-sm m-1 font-[poppins] hover:border-l-4 border-[#e01514]"
        >
          <i className="bi-box-arrow-left text-[18px]" />
          <p className="font-[poppins] text-[14px]">LOGOUT</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
