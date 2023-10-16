import { useEvaAPICall, get_engine } from "@eva-ics/webengine-react";
import { useEffect, useRef } from "react";
import { Eva } from "@eva-ics/webengine";
import { formatUptime } from "../common.tsx";
import { DashTable, TableData } from "../components/DashTable.tsx";

const DashboardCloud = () => {
  const eva = get_engine() as Eva;

  const node_info_xtra = useRef(new Map());

  const node_list = useEvaAPICall({
    method: `bus::eva.core::node.list`,
    update: 1
  });

  useEffect(() => {
    if (Array.isArray(node_list.data)) {
      let repl_svcs = new Set();
      node_list.data.forEach((v) => {
        if (v.svc) {
          repl_svcs.add(v.svc);
        }
      });
      repl_svcs.forEach((svc) => {
        eva.call(`bus::${svc}::node.list`).then((nodes) => {
          nodes.forEach((node: any) => {
            node_info_xtra.current.set(node.name, node);
          });
        });
      });
    }
  }, [node_list]);

  const node_item_summary = useEvaAPICall({
    method: `bus::eva.core::item.summary`,
    update: 5
  });

  const data: TableData = node_list?.data?.map((node: any) => {
    const xtra = node_info_xtra.current.get(node.name);

    let managed;
    let trusted;
    if (node.svc) {
      if (xtra) {
      managed = xtra.managed ? "YES" : "NO";
      trusted = xtra.trusted ? "YES" : "NO";
    }} else {
    }
    return {
      data: [
        { value: node.name },
        {
          value: node.online ? "YES" : "NO", sort_value: node.online,
          className: node.online ? "data-active" : "data-inactive"
        },
        { value: managed, className: xtra?.managed ? "" : "data-inactive" },
        { value: trusted, className: xtra?.trusted ? "" : "data-inactive" },
        {
          value: formatUptime(xtra?.link_uptime),
          sort_value: xtra?.link_uptime
        },
        {
          value:
            node_item_summary?.data?.sources?.[node.svc ? node.name : ".local"]
        },
        { value: node.svc },
        { value: node.info?.version },
        { value: node.info?.build }
      ]
    };
  });

  return (
    <div>
      <div className="dashboard-main-wrapper dashboard-main-wrapper-big">
        <div className="dashboard-main-wrapper-content">
          <div className="dashboard-main-wrapper-content__side-left">
            <DashTable
              title="Cloud status"
              cols={[
                "node",
                "online",
                "managed",
                "trusted",
                "link uptime",
                "items",
                "svc",
                "version",
                "build"
              ]}
              data={data}
              className="content-longtable"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCloud;
