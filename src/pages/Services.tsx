import { useEvaAPICall, get_engine } from "@eva-ics/webengine-react";
import { Eva } from "@eva-ics/webengine";
import { useState, useMemo } from "react";
import { onSuccess, onEvaError } from "../common.tsx";
import { DashTable, TableData, TableFilter } from "../components/DashTable.tsx";

const DashboardServices = () => {
  const eva = useMemo(() => {
    return get_engine() as Eva;
  }, []);

  const [params, setParams] = useState({
    filter: null
  });

  const svc_list = useEvaAPICall({
    method: `bus::eva.core::svc.list`,
    params: params,
    update: 1
  });

  const restartService = (id: string) => {
    eva
      .call(`bus::eva.core::svc.restart`, { i: id })
      .then(() => onSuccess())
      .catch((e) => onEvaError(e));
  };

  const setSvcParams = (p: object) => {
    let np: any = { ...params };
    Object.keys(p).forEach((k) => {
      np[k] = (p as any)[k];
    });
    setParams(np);
  };

  const filter: TableFilter = [
    [
      "Filter",
      <input
        size={20}
        value={params.filter || ""}
        onChange={(e) => setSvcParams({ filter: e.target.value || null })}
      />
    ]
  ];

  const data: TableData = svc_list?.data?.map((svc: any) => {
    return {
      data: [
        { value: svc.id },
        {
          value: svc.status,
          className: svc.status == "online" ? "data-active" : "data-inactive"
        },
        { value: svc.pid },
        {
          value: svc.pid ? (
            <button onClick={() => restartService(svc.id)}>restart</button>
          ) : null,
          className: "table-action"
        },
        { value: svc.launcher }
      ]
    };
  });

  return (
    <div>
      <div className="dashboard-main-wrapper dashboard-main-wrapper-big">
        <div className="dashboard-main-wrapper-content">
          <div className="dashboard-main-wrapper-content__side-left">
            <DashTable
              title="Services"
              filter={filter}
              cols={["id", "status", "pid", "", "launcher"]}
              data={data}
              className="content-longtable"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardServices;
