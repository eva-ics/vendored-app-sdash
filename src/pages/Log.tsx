import { useEvaAPICall } from "@eva-ics/webengine-react";
import { useState } from "react";
import { DashTable, TableFilter, TableData } from "../components/DashTable.tsx";

const log_levels = ["trace", "debug", "info", "warn", "error"];
const log_limits = [25, 50, 75, 100, 125, 150, 175, 200];

const DashboardLog = () => {
  const [params, setParams] = useState({
    level: "info",
    limit: 50,
    module: null,
    rx: null
  });

  const records = useEvaAPICall({
    method: `bus::eva.core::log.get`,
    params: params,
    update: 1
  });

  const setLogParams = (p: object) => {
    let np: any = { ...params };
    Object.keys(p).forEach((k) => {
      np[k] = (p as any)[k];
    });
    setParams(np);
  };

  const filter: TableFilter = [
    [
      "Level",
      <select
        value={params.level}
        onChange={(e) => setLogParams({ level: e.target.value })}
      >
        {log_levels.map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>
    ],
    [
      "Limit",
      <select
        value={params.limit}
        onChange={(e) => setLogParams({ limit: parseInt(e.target.value) })}
      >
        {log_limits.map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>
    ],
    [
      "Module",
      <input
        size={10}
        value={params.module || ""}
        onChange={(e) => setLogParams({ module: e.target.value || null })}
      />
    ],
    [
      "Message",
      <input
        size={20}
        value={params.rx || ""}
        onChange={(e) => setLogParams({ rx: e.target.value || null })}
      />
    ]
  ];

  const data: TableData = records?.data?.toReversed().map((record: any) => {
    return {
      data: [
        { value: record.dt, sort_value: record.t },
        { value: record.mod },
        { value: record.lvl, sort_value: record.l },
        { value: record.msg, className: "log-record-message" }
      ],
      className: `log-record-${record.lvl}`
    };
  });

  return (
    <div>
      <div className="dashboard-main-wrapper dashboard-main-wrapper-big">
        <div className="dashboard-main-wrapper-content">
          <div className="dashboard-main-wrapper-content__side-left">
            <DashTable
              title="Node log"
              cols={["time", "module", "level", "message"]}
              filter={filter}
              data={data}
              className="content-longtable"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLog;
