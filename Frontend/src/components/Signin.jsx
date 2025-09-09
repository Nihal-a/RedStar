import React from "react";
import redstar_logo from "../assets/redstar_logo.svg";
import redstar_full from "../assets/redstar_full.svg";

const Signin = () => {
  return (
    <section className="w-full h-screen ring-1 py-35 px-80 bg-[#f3f3f3]">
      <div className="main-div w-full h-full flex shadow-xl rounded-xl overflow-hidden bg-white">
        <div className="w-1/2 h-full  flex items-center justify-center ">
          <img src={redstar_full} alt="" className="w-100 " />
        </div>
        <div className="w-1/2 h-full  bg-[#E01514]">
          <form
            action=""
            className="w-full h-full flex flex-col gap-4 items-center justify-center"
          >
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
                  type="text"
                  placeholder="Enter your username "
                  className="bg-white md:placeholder:text-[13px] placeholder:text-[13px] w-full px-2  pl-10 py-[5px] ring-1 ring-gray-200 rounded-md text-[14px] font-[poppins] placeholder:transparent  focus:outline-none focus:ring-1   placeholder:text-gray-400 "
                />
                <i className="bi bi-person absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black"></i>
              </div>

              <div className="w-full relative mt-4">
                <input
                  type="text"
                  placeholder="Enter your password"
                  className="bg-white md:placeholder:text-[13px] placeholder:text-[13px] w-full px-2  pl-10 py-[5px] ring-1 ring-gray-200 rounded-md text-[14px] font-[poppins] placeholder:transparent  focus:outline-none focus:ring-1    placeholder:text-gray-400 "
                />
                <i className="bi bi-person-lock absolute top-[50%] translate-y-[-50%] left-[10px] text-[18px] text-black"></i>
              </div>
              <button
                type="submit"
                className="relative w-full py-1 mt-4 rounded-md ring-1 ring-[#ffffff] focus:outline-0 text-[#E01514] font-bold font-[poppins] active:bg-[#eeeeee] bg-[#ffffff] disabled:opacity-50 disabled:cursor-not-allowed  cursor-pointer"
              >
                <p className="text-[14px] font-[poppins]">LOGIN</p>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Signin;
