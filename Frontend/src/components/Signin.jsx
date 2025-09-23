import React, { useState } from "react";
import { gql } from "@apollo/client";
import redstar_full from "../assets/redstar_full.svg";
import { useMutation } from "@apollo/client/react";
import { LOGIN_MUTATION } from "./graphql/mutations";

const Signin = () => {
  const [username, setusername] = useState(null);
  const [password, setpassword] = useState(null);

  const [login, { data, loading, error }] = useMutation(LOGIN_MUTATION);

  const handleLogin = async () => {
    try {
      const response = await login({ variables: { username, password } });
      console.log(response);
      localStorage.setItem("token", response.data.tokenAuth.token);
      localStorage.setItem("isLoggedIn", "true");
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  return (
    <section className="w-full h-screen ring-1 py-35 px-80 bg-[#f3f3f3]">
      <div className="main-div w-full h-full flex shadow-xl rounded-xl overflow-hidden bg-white">
        <div className="w-1/2 h-full  flex items-center justify-center ">
          <img src={redstar_full} alt="" className="w-100 " />
        </div>
        <div className="w-1/2 h-full  bg-[#E01514]">
          <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
            <div className="w-full relative flex flex-col items-center justify-center  px-30">
              <div className="w-full  relative mb-3 text-center">
                <p className="  text-white font-[poppins] text-[24px] font-bold">
                  Admin Login
                </p>
                <p className="text-white font-[poppins] text-[14px] ">
                  Enter your credential to access to your account.
                </p>
              </div>
              <div className="w-full  relative mt-4">
                <input
                  value={username}
                  onChange={(e) => setusername(e.target.value)}
                  type="text"
                  placeholder="Enter your username "
                  className="bg-white md:placeholder:text-[13px] placeholder:text-[13px] w-full px-2  pl-10 py-[5px] ring-1 ring-gray-200 rounded-md text-[14px] font-[poppins] placeholder:transparent  focus:outline-none focus:ring-1   placeholder:text-gray-400 "
                />
                <i className="bi bi-person absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black"></i>
              </div>

              <div className="w-full relative mt-4">
                <input
                  value={password}
                  onChange={(e) => setpassword(e.target.value)}
                  type="password"
                  name="CurrentPass"
                  placeholder="Enter your password"
                  className="bg-white md:placeholder:text-[13px] placeholder:text-[13px] w-full px-2  pl-10 py-[5px] ring-1 ring-gray-200 rounded-md text-[14px] font-[poppins] placeholder:transparent  focus:outline-none focus:ring-1    placeholder:text-gray-400 "
                />
                <i className="bi bi-person-lock absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black"></i>
              </div>
              <button
                onClick={handleLogin}
                className="relative w-full py-1 mt-4 rounded-md ring-1 ring-[#ffffff] focus:outline-0 text-[#E01514] font-bold font-[poppins] active:bg-[#eeeeee] bg-[#ffffff] disabled:opacity-50 disabled:cursor-not-allowed  cursor-pointer"
              >
                <p className="text-[14px] font-[poppins]">LOGIN</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signin;
