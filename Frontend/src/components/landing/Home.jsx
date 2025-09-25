import React, { useState, useEffect } from "react";
import Sidebar_ from "./Sidebar";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import InventoryLending from "./pages/Inventory_lending";
import Book from "./pages/Book";
import BookLending from "./pages/Book_lending";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import Bin from "./pages/Bin";
import Membership from "./pages/Membership";
import redstar_logo from "../../assets/redstar_logo.svg";
import SidebarItem from "../utils/SidebarItem";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { VERIFY_MUTATION } from "../graphql/mutations";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";

const Home = () => {
  const [selectedMenu, setselectedMenu] = useState("HOME");
  const [visible, setVisible] = useState(false);
  const [access, setaccess] = useState(null);

  const [verify, { loading: verifyLoading }] = useMutation(VERIFY_MUTATION);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!token || !loggedIn) {
      navigate("/signin");
    } else {
      const token = localStorage.getItem("token");
      setaccess(token);
    }
  }, []);

  const handleVerify = async () => {
    if (!access) {
      console.log(" No access token available");
      navigate("/signin");
      return;
    }

    try {
      const res = await verify({ variables: { token: access } });
      const payload = res.data.verifyToken.payload;

      console.log(
        ` Token is valid! User: ${payload.username}, Expires: ${new Date(
          payload.exp * 1000
        ).toLocaleString()}`
      );
    } catch (err) {
      console.error("Verify error:", err);
      console.log(` Token verification failed: ${err.message}`);
    }
  };

  const components = {
    HOME: <Dashboard />,
    INVENTORY: <Inventory />,
    INVENTORY_LENDING: <InventoryLending />,
    BOOK: <Book />,
    BOOK_LENDING: <BookLending />,
    FINANCE: <Finance />,
    MEMBERSHIP: <Membership />,
    REPORTS: <Reports />,
    BIN: <Bin />,
  };

  return (
    <section className="w-full h-screen flex flex-col md:flex-row  overflow-hidden font-[Poppins] ">
      {/* Sidebar for mobile sized devices */}
      <div className="md:hidden fixed-top bg-white rounded-lg shadow-md mx-4 flex items-center justify-between w-[95%] p-3 z-10">
        <img src={redstar_logo} alt="" className="w-[8%]" />
        <Button
          icon="pi pi-bars"
          className="p-button-text"
          onClick={() => {
            setVisible(true);
            handleVerify();
          }}
        />
      </div>
      {/* Sidebar for larger screens */}
      <div className="md:block hidden md:w-[15%] w-0">
        <Sidebar_
          selectedMenu={selectedMenu}
          onMenuChange={(menu) => setselectedMenu(menu)}
        />
      </div>
      <div className="md:w-[85%] w-full  flex-1 overflow-auto ">
        {components[selectedMenu] || <Dashboard />}
      </div>

      {/* side bar menu for mobile sized devices */}
      <Sidebar
        visible={visible}
        onHide={() => setVisible(false)}
        position="right"
        style={{ width: "250px", padding: 0 }}
      >
        {" "}
        <SidebarItem
          label="HOME"
          icon="bi-house"
          selected={selectedMenu === "HOME"}
          onClick={() => {
            setselectedMenu("HOME");
            setVisible(false);
          }}
        />
        <SidebarItem
          label="INVENTORY"
          icon="bi-bag-plus"
          selected={selectedMenu === "INVENTORY"}
          onClick={() => {
            setselectedMenu("INVENTORY");
            setVisible(false);
          }}
        />
        <SidebarItem
          label="INVENTORY LENDING"
          icon="bi-arrow-left-right"
          selected={selectedMenu === "INVENTORY_LENDING"}
          onClick={() => {
            setselectedMenu("INVENTORY_LENDING");
            setVisible(false);
          }}
        />
        <SidebarItem
          label="BOOK"
          icon="bi-book"
          selected={selectedMenu === "BOOK"}
          onClick={() => {
            setselectedMenu("BOOK");
            setVisible(false);
          }}
        />
        <SidebarItem
          label="BOOK LENDING"
          icon="bi-arrow-left-right"
          selected={selectedMenu === "BOOK_LENDING"}
          onClick={() => {
            setselectedMenu("BOOK_LENDING");
            setVisible(false);
          }}
        />
        <SidebarItem
          label="MEMBERSHIP"
          icon="bi-person"
          selected={selectedMenu === "MEMBERSHIP"}
          onClick={() => {
            setselectedMenu("MEMBERSHIP");
            setVisible(false);
          }}
        />
        {/* <SidebarItem
          label="FINANCE"
          icon="bi-graph-up"
          selected={selectedMenu === "FINANCE"}
          onClick={() => setselectedMenu("FINANCE")}
        />
        <SidebarItem
          label="REPORTS"
          icon="bi-file-earmark-text"
          selected={selectedMenu === "REPORTS"}
          onClick={() => setselectedMenu("REPORTS")}
        />
        <SidebarItem
          label="BIN"
          icon="bi-trash3"
          selected={selectedMenu === "BIN"}
          onClick={() => setselectedMenu("BIN")}
        /> */}
      </Sidebar>
    </section>
  );
};

export default Home;
