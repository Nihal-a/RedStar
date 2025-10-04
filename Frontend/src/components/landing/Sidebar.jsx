import React, { useState, useEffect } from "react";
import redstar_full from "../../assets/redstar_full.svg";
import redstar_logo from "../../assets/redstar_logo.svg";
import SidebarItem from "../utils/SidebarItem";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { useRef } from "react";
import { Toast } from "primereact/toast";
import {
  CHANGE_PASS,
  DELETE_REFRESH_TOKEN_COOKIE_MUTATION,
  DELETE_TOKEN_COOKIE_MUTATION,
  REFRESH_MUTATION,
  REVOKE_TOKEN_MUTATION,
  VERIFY_MUTATION,
} from "../graphql/mutations";

const Sidebar = ({ selectedMenu, onMenuChange, onLogout }) => {
  const [showLogoutOptions, setShowLogoutOptions] = useState(false);
  const [visible, setVisible] = useState(false);
  const toast = useRef(null);
  const [formData, setformData] = useState({
    old: "",
    new: "",
    confirm: "",
  });
  const [isShowPassword, setisShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [verifyToken] = useMutation(VERIFY_MUTATION);
  const [refreshToken] = useMutation(REFRESH_MUTATION, {
    context: { fetchOptions: { credentials: "include" } },
  });

  const [changePassword] = useMutation(CHANGE_PASS);
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

  const changepass = async () => {
    if (!formData.old || !formData.new || !formData.confirm) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please enter all required fields",
      });
      return;
    }

    if (formData.new !== formData.confirm) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "New passwords do not match",
      });
      return;
    }

    try {
      const { data } = await changePassword({
        variables: {
          oldPassword: formData.old,
          newPassword: formData.new,
          confirmPassword: formData.confirm,
        },
        context: { fetchOptions: { credentials: "include" } },
      });

      if (data?.changePassword?.success) {
        toast.current?.show({
          severity: "success",
          summary: "Saved",
          detail:
            data.changePassword.message || "Password changed successfully.",
        });
        setformData({ old: "", new: "", confirm: "" });
        setisShowPassword({ old: false, new: false, confirm: false });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data?.changePassword?.message || "Failed to change password.",
        });
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message || "Unexpected error occurred.",
      });
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
      <div className="flex items-center justify-center lg:py-4 py-1 cursor-pointer">
        <img
          src={redstar_full}
          alt="full-logo"
          className="w-[120px] hidden lg:block"
          onClick={() => onMenuChange("HOME")}
        />
        <img
          src={redstar_logo}
          alt="mini-logo"
          className="w-[45px] block lg:hidden my-3 "
          onClick={() => onMenuChange("HOME")}
        />
      </div>

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

        <div className="w-full">
          <div
            onClick={() => setShowLogoutOptions(!showLogoutOptions)}
            className="w-full flex flex-col lg:flex-row  items-center justify-start p-4 gap-4 cursor-pointer rounded-sm m-1 font-[poppins] hover:border-l-4 border-[#e01514]"
          >
            <i className="bi-person-lock text-[18px]" />
            <p className="text-[14px] font-[poppins] hidden lg:block">ADMIN</p>
            <i
              className={`bi bi-chevron-${
                showLogoutOptions ? "up" : "down"
              } ml-auto text-gray-500 hidden lg:block`}
            />
          </div>

          {showLogoutOptions && (
            <div className="lg:ml-10 ml-0 mt-1 flex flex-col gap-2">
              <div
                onClick={() => setVisible(true)}
                className="text-[13px] cursor-pointer p-1 rounded  hover:text-red-600 flex gap-2 "
              >
                <i className="bi bi-unlock2 hidden lg:block"></i>
                <p className="w-full font-[poppins] lg:text-[12px] text-[10px] text-center lg:text-start">
                  Change Password
                </p>
              </div>
            </div>
          )}
        </div>
        <div
          onClick={onLogout}
          className="w-full flex items-center justify-start p-4 gap-4 cursor-pointer rounded-sm m-1 font-[poppins] hover:border-l-4 border-[#e01514]"
        >
          <i className="bi-box-arrow-left text-[18px]" />
          <p className="font-[poppins] text-[14px]">LOGOUT</p>
        </div>
      </div>
      <Dialog
        header="Change Password"
        visible={visible}
        draggable={false}
        className="w-[90%]  lg:w-[30%]"
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
      >
        <form
          className="flex flex-col gap-2"
          autoComplete="on"
          onSubmit={(e) => {
            e.preventDefault();
            changepass();
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              Old Password*
            </label>
            <div className="relative">
              <InputText
                type={isShowPassword.old ? "text" : "password"}
                value={formData.old}
                onChange={(e) =>
                  setformData({ ...formData, old: e.target.value })
                }
                autoComplete="current-password"
                placeholder="Enter old password..."
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3 pr-10"
              />
              <i
                className={`bi ${
                  isShowPassword.old ? "bi-eye-slash" : "bi-eye"
                } absolute top-1/2 right-3 -translate-y-1/2 text-[18px] text-gray-600 cursor-pointer`}
                onClick={() =>
                  setisShowPassword({
                    ...isShowPassword,
                    old: !isShowPassword.old,
                  })
                }
              ></i>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              New Password*
            </label>
            <div className="relative">
              <InputText
                value={formData.new}
                type={isShowPassword.new ? "text" : "password"}
                onChange={(e) =>
                  setformData({ ...formData, new: e.target.value })
                }
                autoComplete="new-password"
                placeholder="Enter new password..."
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3 pr-10"
              />
              <i
                className={`bi ${
                  isShowPassword.new ? "bi-eye-slash" : "bi-eye"
                } absolute top-1/2 right-3 -translate-y-1/2 text-[18px] text-gray-600 cursor-pointer`}
                onClick={() =>
                  setisShowPassword({
                    ...isShowPassword,
                    new: !isShowPassword.new,
                  })
                }
              ></i>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password*
            </label>
            <div className="relative">
              <InputText
                type={isShowPassword.confirm ? "text" : "password"}
                value={formData.confirm}
                onChange={(e) =>
                  setformData({ ...formData, confirm: e.target.value })
                }
                autoComplete="new-password"
                placeholder="Confirm password..."
                className="w-full placeholder:text-sm !p-1.5 !font-[poppins] !px-3 pr-10"
              />
              <i
                className={`bi ${
                  isShowPassword.confirm ? "bi-eye-slash" : "bi-eye"
                } absolute top-1/2 right-3 -translate-y-1/2 text-[18px] text-gray-600 cursor-pointer`}
                onClick={() =>
                  setisShowPassword({
                    ...isShowPassword,
                    confirm: !isShowPassword.confirm,
                  })
                }
              ></i>
            </div>
          </div>

          <div className="w-full flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="px-2.5 py-2 bg-gray-400 rounded-[7px] text-white text-[14px] font-[poppins] font-semibold cursor-pointer"
              onClick={() => {
                setVisible(false);
                setformData({ old: "", new: "", confirm: "" });
                setisShowPassword({ old: false, new: false, confirm: false });
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-2 bg-green-500 rounded-[7px] text-white text-[14px] font-[poppins] font-semibold cursor-pointer"
            >
              Change Password
            </button>
          </div>
        </form>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
};

export default Sidebar;
