//import React from "react";
import ReactDOM from "react-dom/client";
import SDash from "./sdash.tsx";
import "./sass/main.scss";
import { Eva } from "@eva-ics/webengine";
import { set_engine, LoginProps, HMIApp } from "@eva-ics/webengine-react";
import { DEFAULT_TITLE } from "./types/index.tsx";
import React from "react";

const eva = new Eva();
eva.register_legacy_globals();
set_engine(eva);
document.title = DEFAULT_TITLE;

const login_props: LoginProps = {
  cache_login: true,
  cache_auth: true
};

eva.load_config().then((_config: any) => {
  eva.state_updates = false;
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <HMIApp Dashboard={SDash} login_props={login_props} />
    </React.StrictMode>
  );
});
