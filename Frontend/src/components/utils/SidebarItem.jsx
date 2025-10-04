export default function SidebarItem({ label, icon, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`w-full flex flex-col lg:flex-row  items-center justify-start p-4 gap-4 cursor-pointer rounded-sm m-1 font-[poppins]  ${
        selected
          ? "bg-[#E01514] text-white"
          : "hover:border-l-4 border-[#e01514]"
      }`}
    >
      <i className={`bi ${icon} text-[18px] `}></i>
      <p className=" font-[poppins] text-[13px] hidden lg:block">{label}</p>
    </div>
  );
}
