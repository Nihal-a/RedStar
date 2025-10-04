import React, { useEffect, useState } from "react";
import { COUNT } from "../../graphql/queries";
import { useQuery } from "@apollo/client/react";
import DashboardCard from "../../utils/dashboardCard";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(COUNT);

  return (
    <section className="w-full h-full lg:px-5 px-3.5 lg:py-5 py-3 bg-[#f5f5f5] flex flex-col ">
      <div className="w-full bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
        <p className="font-[poppins] font-bold md:text-[22px] text-[16px]">
          DASHBOARD
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className=" rounded-lg w-full grid grid-cols md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:-cols-4 gap-3  mt-4">
        {loading || error ? (
          loading ? (
            <p>Loading dashboard...</p>
          ) : (
            <p>Error: {error.message} </p>
          )
        ) : (
          <>
            <DashboardCard
              main_head="INVENTORY"
              number={data?.counts?.inventories}
              sub_head="Total inventory."
              icon="box-seam"
            />
            <DashboardCard
              main_head="ISSUED INVENTORY"
              number={data?.counts?.issuedInvTill}
              sub_head="Total isssued."
              icon="check2-circle"
            />
            <DashboardCard
              main_head="ISSUED INVENTORIES TILL"
              number={data?.counts?.issuedInvCurrently}
              sub_head="issued currently."
              icon="check2-circle"
            />
            <DashboardCard
              main_head="BOOKS"
              number={data?.counts?.books}
              sub_head="Total Books."
              icon="collection"
            />
            <DashboardCard
              main_head="ISSUED BOOKS"
              number={data?.counts?.issuedBooksTill}
              sub_head="Total isssued books."
              icon="check2-circle"
            />
            <DashboardCard
              main_head="ISSUED BOOKS CURRENTLY"
              number={data?.counts?.issuedBooksCurrently}
              sub_head="Total issued books currently."
              icon="journal-check"
            />
            <DashboardCard
              main_head="MEMBERSHIPS"
              number={data?.counts?.memberships}
              sub_head="Total number of memberships."
              icon="journal-check"
            />
            
          </>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
