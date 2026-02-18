//import React from "react";
import ReactDOM from "react-dom/client";
import SDash from "./sdash.tsx";
import "./sass/main.scss";
import { Eva, IntervalKind, disableTabFreeze } from "@eva-ics/webengine";
import { set_engine, LoginProps, HMIApp } from "@eva-ics/webengine-react";
import { DEFAULT_TITLE } from "./types/index.tsx";
import React from "react";
import ToasterProvider from "./components/ToastsProvider.tsx";

disableTabFreeze();

const eva = new Eva();
set_engine(eva);
document.title = DEFAULT_TITLE;

const login_props: LoginProps = {
    cache_login: true,
    cache_auth: true,
    register_globals: true,
    use_gateryx_api: true,
};

eva.load_config().then((_config: any) => {
    eva.state_updates = false;
    eva.set_interval(IntervalKind.Heartbeat, 1);
    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <ToasterProvider />
            <HMIApp Dashboard={SDash} login_props={login_props} />
        </React.StrictMode>
    );
});
