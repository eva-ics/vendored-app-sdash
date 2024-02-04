import { useEvaAPICall, EvaErrorMessage, get_engine } from "@eva-ics/webengine-react";
import { useState, useMemo } from "react";
import {
    DashTable,
    DashTableFilter,
    DashTableData,
    DashTableColData,
    ColumnRichInfo,
    createRichFilter,
    DashTableFilterActionKind,
    DashTableFilterFieldInput,
    generateDashTableRichCSV,
    pushRichColData,
} from "bmat/dashtable";
import { downloadCSV } from "bmat/dom";
import { useQueryParams } from "bmat/hooks";
import { timestampRFC3339 } from "bmat/time";

const logLevels = ["debug", "info", "warn", "error"];
const logLimits = [25, 50, 75, 100, 125, 150, 175, 200];

enum TimeKind {
    Server = "node",
    Local = "local",
}

const DashboardLog = () => {
    const [params, setParams] = useState({
        limit: 50,
        lvl: "info",
        mod: null,
        msg: null,
    });

    const [cols, setCols] = useState<ColumnRichInfo[]>([
        { id: "mod", name: "module", enabled: true, filterInputSize: 10 },
        {
            id: "lvl",
            name: "level",
            enabled: true,
            filterInputSize: 6,
            filterActionKind: DashTableFilterActionKind.GreaterEqual,
            filterFieldInput: DashTableFilterFieldInput.Select,
            filterFieldSelectValues: logLevels,
        },
        {
            id: "msg",
            name: "message",
            enabled: true,
            filterInputSize: 30,
            filterActionKind: DashTableFilterActionKind.Like,
        },
    ]);

    const [time_kind, setTimeKind] = useState(TimeKind.Local);

    const loaded = useQueryParams(
        [
            {
                name: "params",
                value: params,
                setter: setParams,
                pack_json: true,
            },
            {
                name: "tk",
                value: time_kind,
                setter: setTimeKind,
            },
        ],
        [params, time_kind]
    );

    const callParams = useMemo(() => {
        return {
            limit: params.limit,
            level: params.lvl,
            mod: params.mod,
            msg: params.msg,
        };
    }, [params]);

    const records = useEvaAPICall({
        method: loaded ? "bus::eva.core::log.get" : undefined,
        params: callParams,
        update: 1,
    });

    const setLogParams = (p: object) => {
        let np: any = { ...params };
        Object.keys(p).forEach((k) => {
            np[k] = (p as any)[k];
        });
        setParams(np);
    };

    const tl_filter: DashTableFilter = [
        [
            "Time: ",
            <select
                value={time_kind}
                onChange={(e) => setTimeKind(e.target.value as TimeKind)}
            >
                <option>{TimeKind.Local}</option>
                <option>{TimeKind.Server}</option>
            </select>,
        ],
        [
            "Limit: ",
            <select
                value={params.limit}
                onChange={(e) => setLogParams({ limit: parseInt(e.target.value) })}
            >
                {logLimits.map((l) => (
                    <option key={l}>{l}</option>
                ))}
            </select>,
        ],
    ];

    const filter: DashTableFilter = tl_filter.concat(
        createRichFilter({ cols, setCols, params, setParams: setLogParams })
    );

    const data: DashTableData = records?.data?.toReversed().map((record: any) => {
        let time;
        switch (time_kind) {
            case TimeKind.Server:
                time = { value: record.dt, sort_value: record.t };
                break;
            case TimeKind.Local:
                time = {
                    value: timestampRFC3339(record.t, true),
                    sort_value: record.t,
                };
                break;
        }
        const colsData: DashTableColData[] = [time];
        pushRichColData({
            colsData,
            id: "mod",
            value: record.mod || "",
            setParams: setLogParams,
            cols,
            className: "col-fit",
        });
        pushRichColData({
            colsData,
            id: "lvl",
            value: record.lvl || "",
            setParams: setLogParams,
            cols,
            className: "col-fit",
        });
        pushRichColData({
            colsData,
            id: "msg",
            value: record.msg || "",
            cols,
            className: "log-record-message",
        });
        return {
            data: colsData,
            className: `log-record-${record.lvl}`,
        };
    });

    let header = (
        <>
            <div>
                <EvaErrorMessage error={records.error} />
            </div>
            <div className="button_bar">
                <button
                    disabled={records.data === null}
                    onClick={() => {
                        const csvContent = generateDashTableRichCSV({
                            data: records.data,
                            cols,
                            timeCol: time_kind === TimeKind.Server ? "dt" : "t",
                        });
                        downloadCSV(
                            csvContent,
                            `log-${get_engine()?.server_info.system_name}.csv`
                        );
                    }}
                >
                    Export as CSV
                </button>
            </div>
        </>
    );
    return (
        <div>
            <div className="dashboard-main-wrapper dashboard-main-wrapper-big">
                <div className="dashboard-main-wrapper-content">
                    <div className="dashboard-main-wrapper-content__side-left">
                        <DashTable
                            id="log"
                            title="Node log"
                            header={header}
                            cols={["time" as any].concat(cols)}
                            filter={filter}
                            data={data}
                            className="content-longtable"
                            rememberQs={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLog;
