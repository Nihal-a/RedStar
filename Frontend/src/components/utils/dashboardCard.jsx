export default function DashboardCard({ main_head, number, sub_head, icon }) {
  return (
    <div className="bg-white rounded-sm shadow-sm  p-7">
      <p className="font-[poppins] font-semibold lg:text-[16px] text-[14px] uppercase">
        {main_head}
      </p>
      <div className="flex items-center mt-3">
        <div className="flex-1 flex flex-col justify-center gap-0.5">
          <p className="font-[poppins] font-bold lg:text-[33px] text-[27px]">
            {number}
          </p>
        </div>
        <div className=" bg-[#f5f5f5] rounded-lg flex items-center justify-center p-3">
          <i className={`bi bi-${icon} text-gray-400 text-4xl`}></i>
        </div>
      </div>
      <p className="font-[poppins] mt-2 font-light text-[14px] text-gray-500 pr-2">
        {sub_head}
      </p>
    </div>
  );
}
