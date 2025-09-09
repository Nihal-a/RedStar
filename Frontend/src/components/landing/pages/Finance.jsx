import React from 'react';

const Finance = () => {
    return (
       <section className="w-full h-screen px-5 py-5 bg-[#f5f5f5]">
      <div className="w-full h-[10%] bg-white rounded-lg shadow-md p-5 flex items-center justify-between">
        <p className="font-[poppins] font-bold text-[22px]">DASHBOARD</p>
      </div>
      <div className="w-full  pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-auto">
        <div className="bg-white rounded-sm shadow-sm flex items-center justify-center p-7 h-[150px]">
          <div className="flex-1 flex flex-col justify-center gap-0.5">
            <p className="font-[poppins] font-bold text-[18px]">BOOKS</p>
            <p className="font-[poppins] font-bold text-[40px]">576</p>
            <p className="font-[poppins] font-light text-[14px] text-gray-500">
              Total number of books.
            </p>
          </div>
          <div className="w-[100px] h-[100px] bg-[#f5f5f5] rounded-lg flex items-center justify-center">
            {" "}
            <i className="bi bi-collection text-gray-400 text-4xl"></i>
          </div>
        </div>
        <div className="bg-white rounded-sm shadow-sm flex items-center justify-center p-7 h-[150px]">
          <div className="flex-1 flex flex-col justify-center gap-0.5">
            <p className="font-[poppins] font-bold text-[18px]">INVENTORY</p>
            <p className="font-[poppins] font-bold text-[40px]">70</p>
            <p className="font-[poppins] font-light text-[14px] text-gray-500">
              Total number of inventory.
            </p>
          </div>
          <div className="w-[100px] h-[100px] bg-[#f5f5f5] rounded-lg flex items-center justify-center ">
            <i className="bi bi-box-seam text-gray-400 text-4xl"></i>
          </div>
        </div>
        <div className="bg-white rounded-sm shadow-sm flex items-center justify-center p-7 h-[150px]">
          <div className="flex-1 flex flex-col justify-center gap-0.5">
            <p className="font-[poppins] font-bold text-[18px]">ISSUED BOOKS</p>
            <p className="font-[poppins] font-bold text-[40px]">53</p>
            <p className="font-[poppins] font-light text-[14px] text-gray-500">
              Books currently lented.
            </p>
          </div>
          <div className="w-[100px] h-[100px] bg-[#f5f5f5] rounded-lg flex items-center justify-center ">
            {" "}
            <i className="bi bi-journal-check text-gray-400 text-4xl"></i>
          </div>
        </div>
        <div className="bg-white rounded-sm shadow-sm flex items-center justify-center p-7 h-[150px]">
          <div className="flex-1 flex flex-col justify-center gap-0.5">
            <p className="font-[poppins] font-bold text-[18px]">
              ISSUED INVENTORY
            </p>
            <p className="font-[poppins] font-bold text-[40px]">37</p>
            <p className="font-[poppins] font-light text-[14px] text-gray-500">
              Inventory currently lented.
            </p>
          </div>
          <div className="w-[100px] h-[100px] bg-[#f5f5f5] rounded-lg flex items-center justify-center ">
            {" "}
            <i className="bi bi-check2-circle text-gray-400 text-4xl"></i>
          </div>
        </div>
        <div className="bg-white rounded-sm shadow-sm flex items-center justify-center p-7 h-[150px]">
          <div className="flex-1 flex flex-col justify-center gap-0.5">
            <p className="font-[poppins] font-bold text-[18px]">FUND</p>
            <p className="font-[poppins] font-bold text-[40px]">
              1000<i class="bi bi-currency-rupee"></i>
            </p>
            <p className="font-[poppins] font-light text-[14px] text-gray-500 ">
              Available fund.
            </p>
          </div>
          <div className="w-[100px] h-[100px] bg-[#f5f5f5] rounded-lg flex items-center justify-center ">
            {" "}
            <i className="bi bi-wallet2 text-gray-400 text-4xl"></i>
          </div>
        </div>
      </div>
    </section>
    );
}

export default Finance;
