import React from "react";

const Dashboard = () => {
  return (
    <section className="w-full h-full lg:px-5 px-3.5 lg:py-5 py-3 bg-[#f5f5f5] flex flex-col ">
      <div className="w-full bg-white rounded-lg shadow-md p-6 flex items-center justify-between ">
        <p className="font-[poppins] font-bold md:text-[22px] text-[16px]">
          DASHBOARD
        </p>
      </div>
      <div className="w-full   grid grid-cols-1 md:grid-cols-2  xl:grid-cols-3 2xl:grid-cols-4 gap-3 overflow-y-scroll mt-4  ">
        <div className="bg-white rounded-sm shadow-sm flex items-center justify-center p-7">
          <div className="flex-1 flex flex-col justify-center ">
            <p className="font-[poppins] font-semibold lg:text-[16px] text-[14px]">
              BOOKS
            </p>
            <p className="font-[poppins] font-bold lg:text-[33px] text-[27px]">
              576
            </p>
            <p className="font-[poppins] font-light lg:text-[15px] text-[13px] text-gray-600">
              Total number of books.
            </p>
          </div>
          <div className=" bg-[#f5f5f5] rounded-lg flex items-center justify-center p-6">
            <i className="bi bi-collection text-gray-400 text-4xl"></i>
          </div>
        </div>
        <div className="bg-white rounded-sm shadow-sm flex items-center justify-center p-7">
          <div className="flex-1 flex flex-col justify-center gap-0.5">
            <p className="font-[poppins] font-semibold lg:text-[16px] text-[14px]">
              INVENTORY
            </p>
            <p className="font-[poppins] font-bold lg:text-[33px] text-[27px]">
              70
            </p>
            <p className="font-[poppins] font-light text-[14px] text-gray-500">
              Total number of inventory.
            </p>
          </div>
          <div className=" bg-[#f5f5f5] rounded-lg flex items-center justify-center p-6">
            <i className="bi bi-box-seam text-gray-400 text-4xl"></i>
          </div>
        </div>
        <div className="bg-white rounded-sm shadow-sm flex items-center justify-center p-7 ">
          <div className="flex-1 flex flex-col justify-center ">
            <p className="font-[poppins] font-semibold lg:text-[16px] text-[14px]">
              ISSUED BOOKS
            </p>
            <p className="font-[poppins] font-bold lg:text-[33px] text-[27px]">
              53
            </p>
            <p className="font-[poppins] font-light text-[14px] text-gray-500">
              Books currently lented.
            </p>
          </div>
          <div className="bg-[#f5f5f5] rounded-lg flex items-center justify-center p-6">
            {" "}
            <i className="bi bi-journal-check text-gray-400 text-4xl"></i>
          </div>
        </div>
        <div className="bg-white rounded-sm shadow-sm flex items-center justify-center p-7 ">
          <div className="flex-1 flex flex-col justify-center gap-0.5">
            <p className="font-[poppins] font-semibold lg:text-[16px] text-[14px]">
              ISSUED INVENTORY
            </p>
            <p className="font-[poppins] font-bold lg:text-[33px] text-[27px]">
              37
            </p>
            <p className="font-[poppins] font-light text-[14px] text-gray-500">
              Inventory currently lented.
            </p>
          </div>
          <div className=" bg-[#f5f5f5] rounded-lg flex items-center justify-center p-6 ">
            {" "}
            <i className="bi bi-check2-circle text-gray-400 text-4xl"></i>
          </div>
        </div>
        <div className="bg-white rounded-sm shadow-sm flex items-center justify-center p-7 ">
          <div className="flex-1 flex flex-col justify-center gap-0.5">
            <p className="font-[poppins] font-semibold lg:text-[16px] text-[14px]">
              FUND
            </p>
            <p className="font-[poppins] font-bold lg:text-[33px] text-[27px]">
              1000<i className="bi bi-currency-rupee"></i>
            </p>
            <p className="font-[poppins] font-light text-[14px] text-gray-500 ">
              Available fund.
            </p>
          </div>
          <div className=" bg-[#f5f5f5] rounded-lg flex items-center justify-center p-6">
            {" "}
            <i className="bi bi-wallet2 text-gray-400 text-4xl"></i>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
