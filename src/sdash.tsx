import { BrowserRouter } from "react-router-dom";
import { FunctionLogout, get_engine } from "@eva-ics/webengine-react";
import { Eva } from "@eva-ics/webengine";
import Layout from "./pages/Layout.tsx";

const SDash = ({ logout }: { logout: FunctionLogout }) => {
    const eva = get_engine() as Eva;

    if (eva?.server_info?.acl?.admin) {
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
