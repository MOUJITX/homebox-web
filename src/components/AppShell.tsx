import { Outlet } from "react-router";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

const AppShell = () => (
  <div className="flex h-svh overflow-hidden bg-background">
    <Sidebar />
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AppShell;
