import Layout from "./pages/Layout.tsx";
import { BrowserRouter } from "react-router-dom";
import { FunctionLogout, get_engine } from "@eva-ics/webengine-react";
import { useEffect } from "react";
import { DEFAULT_TITLE } from "./types/index.tsx";
import { Eva } from "@eva-ics/webengine";

const SDash = ({ logout }: { logout: FunctionLogout }) => {
    const eva = get_engine() as Eva;

    useEffect(() => {
        const system_name = eva.system_name();
        document.title = `${system_name} system dashboard`;
        return () => {
            document.title = DEFAULT_TITLE;
        };
    }, []);

    if (eva.server_info.acl.admin) {
        return (
            <BrowserRouter>
                <Layout logout={logout}></Layout>
            </BrowserRouter>
        );
    } else {
        return (
            <div className="admin-required-container">
                <div className="admin-required">Admin access required</div>
                <div className="admin-required-info">
                    To use this application, please logout and re-login as an admin user
                </div>
                <div className="admin-required-links">
                    <a href="/va/">Vendored apps</a>
                    <a href="#" onClick={logout}>
                        Logout
                    </a>
                </div>
            </div>
        );
    }
};

export default SDash;
