import React, { useState, useEffect } from "react";
import Sidebar_ from "./Sidebar";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import InventoryLending from "./pages/Inventory_lending";
import Book from "./pages/Book";
import BookLending from "./pages/Book_lending";
import Membership from "./pages/Membership";
import redstar_logo from "../../assets/redstar_logo.svg";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { useNavigate } from "react-router-dom";
import { Dialog } from "primereact/dialog";
import { useMutation } from "@apollo/client/react";
import {
  DELETE_REFRESH_TOKEN_COOKIE_MUTATION,
  DELETE_TOKEN_COOKIE_MUTATION,
  REVOKE_TOKEN_MUTATION,
} from "../graphql/mutations";

const Home = () => {
  const [selectedMenu, setselectedMenu] = useState("HOME");
  const [confirmVisible, setconfirmVisible] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

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

  const components = {
    HOME: <Dashboard />,
    INVENTORY: <Inventory />,
    INVENTORY_LENDING: <InventoryLending />,
    BOOK: <Book />,
    BOOK_LENDING: <BookLending />,
    MEMBERSHIP: <Membership />,
  };

  return (
    <section className="w-full h-screen flex flex-col md:flex-row overflow-hidden font-[Poppins]">
      {/* Mobile topbar */}
      <div className="md:hidden bg-white shadow-sm mx-4 flex items-center justify-between w-[95%] p-3 z-10">
        <img src={redstar_logo} alt="logo" className="w-[8%]" />
        <Button
          icon="pi pi-bars"
          className="p-button-text"
          onClick={() => setVisible(true)}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-[15%]">
        <Sidebar_
          selectedMenu={selectedMenu}
          onMenuChange={(menu) => setselectedMenu(menu)}
          onLogout={() => setconfirmVisible(true)}
        />
      </div>

      {/* Main Content */}
      <div className="md:w-[85%] w-full flex-1 overflow-auto">
        {components[selectedMenu] || <Dashboard />}
      </div>

      {/* Mobile Sidebar Overlay */}
      <Sidebar
        visible={visible}
        onHide={() => setVisible(false)}
        position="right"
        style={{ width: "250px", padding: 0 }}
      >
        <Sidebar_
          selectedMenu={selectedMenu}
          onMenuChange={(menu) => {
            setselectedMenu(menu);
            setVisible(false);
          }}
          onLogout={() => setconfirmVisible(true)}
        />
      </Sidebar>

      <Dialog
        className="w-[90%] md:w-[25%]"
        visible={confirmVisible}
        onHide={() => setconfirmVisible(false)}
        draggable={false}
        header="Logout!"
        headerClassName="font-[poppins]"
      >
        <div className="w-full flex">
          <label className="block text-md font-[poppins] font-medium">
            Are you sure want to Logout!
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button
            className="bg-gray-500 text-white p-1.5 rounded-md hover:bg-gray-600 cursor-pointer"
            onClick={() => setconfirmVisible(false)}
          >
            Cancel
          </button>
          <button
            className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 cursor-pointer"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </Dialog>
    </section>
  );
};

export default Home;
