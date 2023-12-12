import { useState } from "react";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import { LayoutProps } from "../types";
import { useSearchParams } from "react-router-dom";
import DashboardOverview from "../pages/Overview.tsx";
import DashboardCloud from "../pages/Cloud.tsx";
import DashboardServices from "../pages/Services.tsx";
import DashboardLog from "../pages/Log.tsx";

const Layout = ({ logout }: LayoutProps) => {
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
        case "navigate":
            content = <DashboardOverview />;
            current_page = "Navigate";
            break;
        case "main_app":
            content = <DashboardOverview />;
            current_page = "Main app";
            break;
        default:
            current_page = "Overview";
            content = <DashboardOverview />;
    }

    const nav = [
        { value: "Overview", to: "?" },
        { value: "Services", to: "?d=services" },
        { value: "Cloud", to: "?d=cloud" },
        { value: "Log", to: "?d=log" },
        {
            value: "Navigate",

            submenus: [
                { value: "Main app", to: "/" },
                { value: "Vendored apps", to: "/va/" },
                { value: "Logout", to: "logout" },
            ],
        },
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
                current_page={current_page}
            />
            {content}
        </div>
    );
};

export default Layout;
