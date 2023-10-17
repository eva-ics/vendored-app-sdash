import { useState } from "react";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import { LayoutProps } from "../types";
import { useSearchParams } from "react-router-dom";
import DashboardOverview from "../pages/Overview.tsx";
import DashboardCloud from "../pages/Cloud.tsx";
import DashboardServices from "../pages/Services.tsx";
import DashboardLog from "../pages/Log.tsx";

const Layout = ({ logout, children }: LayoutProps) => {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [searchParams, _] = useSearchParams();

  const toggleMenu = () => {
    setIsOpenMenu(!isOpenMenu);
  };

  let content;
  let current_page;

  switch (searchParams.get("d")) {
    case "cloud":
      content = <DashboardCloud />;
      current_page = "Cloud";
      break;
    case "services":
      content = <DashboardServices />;
      current_page = "Services";
      break;
    case "log":
      content = <DashboardLog />;
      current_page = "Log";
      break;
    default:
      current_page = "Overview";
      content = <DashboardOverview />;
  }

  const nav = [
    { value: "Overview", to: "?" },
    { value: "Services", to: "?d=services" },
    { value: "Cloud", to: "?d=cloud" },
    { value: "Log", to: "?d=log" }
  ];

  return (
    <div className="root-container">
      <Header
        toggleMenu={toggleMenu}
        nav={nav}
        logout={logout}
        current_page={current_page}
      />
      <SideMenu
        nav={nav}
        isOpen={isOpenMenu}
        toggleMenu={toggleMenu}
        logout={logout}
      />
      {content}
      {children}
    </div>
  );
};

export default Layout;