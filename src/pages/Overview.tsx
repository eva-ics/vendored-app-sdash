import { useMemo } from "react";
import {
  Gauge,
  GaugeType,
  get_engine,
  useEvaAPICall
} from "@eva-ics/webengine-react";
import { Eva } from "@eva-ics/webengine";
import {
  timeFromTimestamp,
  formatUptime,
  onSuccess,
  onEvaError
} from "../common.tsx";
import { DashTable, TableData } from "../components/DashTable.tsx";

const CoreInfoRow = ({
  n,
  value,
  description
}: {
  n: number;
  value: any;
  description: string;
}) => {
  return (
    <tr
      style={{
        backgroundColor: n % 2 === 0 ? "#191D22" : "#121721"
      }}
    >
      <td>{description}</td>
      <td>{value}</td>
    </tr>
  );
};

const DashboardOverview = () => {
  const eva = useMemo(() => {
    return get_engine() as Eva;
  }, []);

  const server_info = useEvaAPICall({
    method: "test",
    update: 1
  });

  const core_sys_info = useEvaAPICall({
    method: "bus::eva.core::core.sysinfo",
    update: 2
  });

  const hmi_sessions = useEvaAPICall({
    method: `bus::${eva?.server_info?.hmi_svc_id}::session.list`,
    update: 1
  });

  const node_item_summary = useEvaAPICall({
    method: `bus::eva.core::item.summary`,
    update: 5
  });

  const server_info_data = [
    ["Name", eva?.system_name()],
    ["Binary architecture", server_info?.data?.system_arch],
    ["Server time", timeFromTimestamp(server_info?.data?.time)],
    ["Uptime", formatUptime(server_info?.data?.uptime)],
    [
      "Items",
      node_item_summary?.data?.items?.toLocaleString("en").replaceAll(",", " ")
    ],
    ["Version/build", `${eva?.server_info?.version} ${eva?.server_info?.build}`]
  ];

  const killSession = (id: string) => {
    eva
      .call(`bus::${eva?.server_info?.hmi_svc_id}::session.destroy`, { i: id })
      .then(() => onSuccess())
      .catch((e) => onEvaError(e));
  };

  const session_data: TableData = hmi_sessions?.data?.map((sess: any) => {
    return {
      data: [
        { value: sess.user },
        { value: sess.source },
        {
          value: sess.mode,
          className: sess.mode == "normal" ? "data-active" : "data-inactive"
        },
        {
          value: (
            <>
              {sess.expires_in}
              <button onClick={() => killSession(sess.id)}>kill</button>
            </>
          ),
          sort_value: sess.expires_in,
          className: "table-action"
        }
      ]
    };
  });

  return (
    <div>
      <div className="dashboard-main-wrapper dashboard-main-wrapper-small">
        <div className="dashboard-main-wrapper-content">
          <div className="dashboard-main-wrapper-content__side-left">
            <div className="dashboard-main-content-block_table">
              <div className="heading-h2">System info</div>
              <div className="dashboard-main-content-block__content content-info">
                <table className="info-table">
                  <tbody>
                    {server_info_data.map(([d, v], n) => {
                      return (
                        <CoreInfoRow key={n} n={n} description={d} value={v} />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <DashTable
              cols={["user", "source", "mode", "expires"]}
              data={session_data}
              title="HMI sessions"
              className="session-info"
            />
          </div>
          <div className="dashboard-main-wrapper-content__side-right">
            <div className="dashboard-main-content-gauges">
              <Gauge
                type={GaugeType.Light}
                diameter={200}
                numTicks={5}
                minValue={0}
                maxValue={10}
                warnValue={5}
                critValue={8}
                label={"CPU LA1:"}
                showValue
                state={{ value: core_sys_info?.data?.la1 }}
              />
              <Gauge
                type={GaugeType.Light}
                diameter={200}
                numTicks={5}
                minValue={0}
                maxValue={10}
                warnValue={5}
                critValue={8}
                label={"CPU LA5:"}
                showValue
                state={{ value: core_sys_info?.data?.la5 }}
              />
            </div>
            <div className="dashboard-main-content-gauges">
              <Gauge
                type={GaugeType.Light}
                diameter={200}
                numTicks={5}
                minValue={0}
                units=" %"
                digits={2}
                maxValue={100}
                warnValue={85}
                critValue={95}
                label={"Disk usage:"}
                showValue
                state={{ value: core_sys_info?.data?.disk_usage }}
              />
              <Gauge
                type={GaugeType.Light}
                diameter={200}
                numTicks={5}
                minValue={0}
                units=" %"
                digits={2}
                maxValue={100}
                warnValue={85}
                critValue={95}
                label={"Memory usage:"}
                showValue
                state={{ value: core_sys_info?.data?.ram_usage }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
