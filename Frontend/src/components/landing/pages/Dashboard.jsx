import React, { useEffect, useState } from "react";
import { COUNT } from "../../graphql/queries";
import { useQuery } from "@apollo/client/react";
import DashboardCard from "../../utils/dashboardCard";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import CustomSidebar from "../Sidebar";
import SidebarItem from "../../utils/SidebarItem";

const Dashboard = ({ selectedMenu, onMenuChange }) => {
  const { data, loading, error, refetch } = useQuery(COUNT);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <section className="w-full h-full lg:px-5 px-3.5 lg:py-5 py-3 bg-[#f5f5f5] flex flex-col">
      {/* Top Bar */}
      <div className="w-full bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
        <p className="font-[poppins] font-bold md:text-[22px] text-[16px]">
          DASHBOARD
        </p>

        <div className="md:hidden">
          <Button
            icon="pi pi-bars"
            className="p-button-text"
            onClick={() => setVisible(true)}
          />
        </div>
      </div>

      <Sidebar
        visible={visible}
        onHide={() => setVisible(false)}
        position="left"
        style={{ width: "250px", padding: 0 }}
      >
        <CustomSidebar
          selectedMenu={selectedMenu}
          onMenuChange={onMenuChange}
        />
      </Sidebar>

      {/* Dashboard Cards */}
      <div className="bg-white rounded-lg shadow-md p-4 w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mt-4">
        {loading || error ? (
          loading ? (
            <p>Loading dashboard...</p>
          ) : (
            <p>Error: {error.message}</p>
          )
        ) : (
          <>
            <DashboardCard
              main_head="INVENTORY"
              number={data?.counts?.inventories}
              sub_head="Total number of inventory."
              icon="box-seam"
            />
            <DashboardCard
              main_head="TOTAL ISSUED INVENTORY"
              number={data?.counts?.issuedInvTill}
              sub_head="Total number of people helped by our inventories so far."
              icon="check2-circle"
            />
            <DashboardCard
              main_head="ISSUED INVENTORIES CURRENTLY"
              number={data?.counts?.issuedInvCurrently}
              sub_head="Total number of inventories actively helping people"
              icon="check2-circle"
            />
            <DashboardCard
              main_head="BOOKS"
              number={data?.counts?.books}
              sub_head="Total number of books."
              icon="collection"
            />
            <DashboardCard
              main_head="TOTAL ISSUED BOOKS"
              number={data?.counts?.issuedBooksTill}
              sub_head="Total number of books lent out up to today."
              icon="check2-circle"
            />
            <DashboardCard
              main_head="ISSUED BOOKS CURRENTLY"
              number={data?.counts?.issuedBooksCurrently}
              sub_head="Total number of books lent out currently."
              icon="journal-check"
            />
            <DashboardCard
              main_head="MEMBERSHIPS"
              number={data?.counts?.memberships}
              sub_head="Total number of memberships."
              icon="journal-check"
            />
            <DashboardCard
              main_head="FUND"
              number="1000"
              sub_head="Available fund."
              icon="wallet2"
            />
          </>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
