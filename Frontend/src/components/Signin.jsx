import React, { useState, useEffect } from "react";
import redstar_full from "../assets/redstar_full.svg";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import {LOGIN_MUTATION } from "./graphql/mutations";

const Signin = () => {
  const [username, setusername] = useState("");
  const [password, setpassword] = useState("");
  const [isShowPassword, setisShowPassword] = useState(false);
  const [error, seterror] = useState("");

  const [login] = useMutation(LOGIN_MUTATION, {
    context: { fetchOptions: { credentials: "include" } },
  });

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await login({ variables: { username, password } });
      const token = response.data.tokenAuth.token;
      localStorage.setItem("token", token);
      navigate("/");
    } catch (err) {
      seterror(err.message + "!");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/");
    }
  }, []);

  return (
    <section className="w-full h-screen ring-1 flex items-center justify-center  bg-[#f3f3f3]">
      <div className="main-div w-[60%] md:h-[60%] h-fit flex md:shadow-xl rounded-xl overflow-hidden bg-white  ">
        <div className="md:w-1/2 w-0 md:h-full h-0  flex items-center justify-center ">
          <img src={redstar_full} alt="" className="w-[50%]" />
        </div>
        <div className="md:w-1/2 w-full h-full  bg-[#E01514] p-[7%]">
          <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
            <div className="w-full relative flex flex-col items-center justify-center  ">
              <div className="w-full  mb-3 text-center">
                <p className="  text-white font-[poppins] text-[24px] font-bold">
                  Admin Login
                </p>
                <p className="text-white font-[poppins] text-[14px] ">
                  Enter your credential to access to your account.
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="w-full relative flex flex-col "
              >
                <div className="w-full relative mt-4">
                  <input
                    value={username}
                    onChange={(e) => {
                      setusername(e.target.value);
                      seterror("");
                    }}
                    type="text"
                    placeholder="Enter your username"
                    autoComplete="username"
                    className="bg-white md:placeholder:text-[13px] placeholder:text-[13px] w-full px-2 pl-10 py-[5px] ring-1 ring-gray-200 rounded-md text-[14px] font-[poppins] placeholder:transparent focus:outline-none focus:ring-1 placeholder:text-gray-400"
                  />

                  <i className="bi bi-person absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black"></i>
                </div>

                <div className="w-full relative mt-4">
                  <input
                    value={password}
                    onChange={(e) => {
                      setpassword(e.target.value);
                      seterror("");
                    }}
                    type={isShowPassword ? "text" : "password"}
                    name="CurrentPass"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="bg-white md:placeholder:text-[13px] placeholder:text-[13px] w-full px-2 pl-10 py-[5px] ring-1 ring-gray-200 rounded-md text-[14px] font-[poppins] placeholder:transparent focus:outline-none focus:ring-1 placeholder:text-gray-400"
                  />
                  <i className="bi bi-person-lock absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black"></i>
                  <i
                    className={`bi ${
                      isShowPassword ? "bi-eye-slash" : "bi-eye"
                    } absolute top-[50%] translate-y-[-50%] right-[10px] text-[18px] text-black`}
                    onClick={() => setisShowPassword(!isShowPassword)}
                  ></i>
                </div>
                <div className="w-full pl-1 h-[10px] flex items-center justify-start mt-2">
                  <p
                    className={`font-[poppins] text-[12px] transition-all duration-200 ${
                      error ? "text-white opacity-100" : "opacity-0"
                    }`}
                  >
                    {error || ""}
                  </p>
                </div>

                <button
                  type="submit"
                  className="relative w-full py-1 mt-3 rounded-md ring-1 ring-[#ffffff] focus:outline-0 text-[#E01514] font-bold font-[poppins] active:bg-[#eeeeee] bg-[#ffffff] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <p className="text-[14px] font-[poppins]">LOGIN</p>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signin;
