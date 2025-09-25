import React, { useState, useEffect } from "react";
import redstar_full from "../../assets/redstar_full.svg";
import redstar_logo from "../../assets/redstar_logo.svg";
import SidebarItem from "../utils/SidebarItem";
import { Dialog } from "primereact/dialog";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { REVOKE_TOKEN_MUTATION, VERIFY_MUTATION } from "../graphql/mutations";

const Sidebar = ({ selectedMenu, onMenuChange }) => {
  const [access, setaccess] = useState(null);
  const [confirmVisible, setconfirmVisible] = useState(false);
  const navigate = useNavigate();

  const [verify, { loading: verifyLoading }] = useMutation(VERIFY_MUTATION);
  const [revokeToken, { loading: revokeLoading }] = useMutation(
    REVOKE_TOKEN_MUTATION
  );

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

  const handleLogout = async () => {
    try {
      await revokeToken();
    } catch (err) {
      console.log("Error revoking token:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      navigate("/signin");
      console.log("Logged out successfully!");
    }
  };

  return (
    <section className=" h-full flex flex-col shadow-lg">
      <div className="flex items-center justify-center py-4 lg:mt-1.5 mt-4.5 cursor-pointer">
        <img
          src={redstar_full}
          alt=""
          className="w-[120px] hidden lg:block"
          onClick={() => onMenuChange("HOME")}
        />
        <img
          src={redstar_logo}
          alt=""
          className="w-[45px] block lg:hidden"
          onClick={() => onMenuChange("HOME")}
        />
      </div>
      <div className="flex flex-col items-center justify-start  w-full  p-2">
        <SidebarItem
          label="HOME"
          icon="bi-house"
          selected={selectedMenu === "HOME"}
          onClick={() => {
            handleVerify();
            onMenuChange("HOME");
          }}
        />
        <SidebarItem
          label="INVENTORY"
          icon="bi-bag-plus"
          selected={selectedMenu === "INVENTORY"}
          onClick={() => {
            handleVerify();
            onMenuChange("INVENTORY");
          }}
        />
        <SidebarItem
          label="INVENTORY LENDING"
          icon="bi-arrow-left-right"
          selected={selectedMenu === "INVENTORY_LENDING"}
          onClick={() => {
            handleVerify();
            onMenuChange("INVENTORY_LENDING");
          }}
        />
        <SidebarItem
          label="BOOK"
          icon="bi-book"
          selected={selectedMenu === "BOOK"}
          onClick={() => {
            handleVerify();
            onMenuChange("BOOK");
          }}
        />
        <SidebarItem
          label="BOOK LENDING"
          icon="bi-arrow-left-right"
          selected={selectedMenu === "BOOK_LENDING"}
          onClick={() => {
            handleVerify();
            onMenuChange("BOOK_LENDING");
          }}
        />
        <SidebarItem
          label="MEMBERSHIP"
          icon="bi-person"
          selected={selectedMenu === "MEMBERSHIP"}
          onClick={() => {
            handleVerify();
            onMenuChange("MEMBERSHIP");
          }}
        />
        <div
          onClick={() => setconfirmVisible(true)}
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
      <Dialog
        className="w-[90%] md:w-[25%]"
        visible={confirmVisible}
        onHide={() => setconfirmVisible(false)}
        draggable={false}
        header="Logout!"
        headerClassName="font-[poppins]"
      >
        <div className="w-full flex ">
          <label className="block text-md font-[poppins] font-medium">
            Are you sure want to Logout!
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button
            className="!font-[poppins] !text-[14px] p-1.5 font-semibold !text-white bg-gray-500 rounded-md cursor-pointer hover:bg-gray-600"
            onClick={() => {
              setconfirmVisible(false);
            }}
          >
            Cancel
          </button>
          <button
            className="!font-[poppins] !text-[14px] p-1.5 font-semibold !text-white bg-red-500 rounded-md cursor-pointer hover:bg-red-600"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </Dialog>
    </section>
  );
};

export default Sidebar;
