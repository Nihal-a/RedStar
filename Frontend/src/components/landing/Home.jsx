import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import InventoryLending from "./pages/Inventory_lending";
import Book from "./pages/Book";
import BookLending from "./pages/Book_lending";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import Bin from "./pages/Bin";
import Membership from "./pages/Membership";

const Home = () => {
  const [selectedMenu, setselectedMenu] = useState("HOME");
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
    <div className="w-full h-screen flex overflow-hidden font-[Poppins]  ">
      <div className="md:block  hidden  ">
        <Sidebar
          selectedMenu={selectedMenu}
          onMenuChange={(menu) => setselectedMenu(menu)}
        />
      </div>
      <div className="md::w-[85%] w-full">
        {components[selectedMenu] || <Dashboard />}
      </div>
    </div>
  );
};

export default Home;
