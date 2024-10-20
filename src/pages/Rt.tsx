import { useEvaAPICall, EvaErrorMessage } from "@eva-ics/webengine-react";
import { useState, useMemo } from "react";
import {
    DashTable,
    DashTableFilter,
    DashTableData,
    DashTableColType,
    DashTableColData,
    ColumnRichInfo,
    DashTableFilterActionKind,
    DashTableFilterFieldInput,
    pushRichColData,
    createRichFilter,
} from "bmat/dashtable";
import { useQueryParams } from "bmat/hooks";
import { addButton, removeButton } from "../components/common.tsx";

const SVC_ID = "eva.svc.rtmon";

const pStates = ["D", "R", "S", "T", "Z"];

const scheds = ["BATCH", "DEADLINE", "FIFO", "IDLE", "OTHER", "RR"];

const DashboardRealtime = () => {
    const [filterParams, setFilterParams] = useState({
        point: null as string | null,
        svc_id: null as string | null,
        name: null as string | null,
        pid: null as number | null,
        state: null as string | null,
        cpu: null as number | null,
        priority: null as number | null,
        sched: null as string | null,
    });

    const filterMatches = (record: any) => {
        if (filterParams.point && !record.point.includes(filterParams.point)) {
            return false;
        }
        if (filterParams.svc_id && !record.svc_id.includes(filterParams.svc_id)) {
            return false;
        }
        if (filterParams.name && !record.name.includes(filterParams.name)) {
            return false;
        }
        if (filterParams.pid && record.pid !== filterParams.pid) {
            return false;
        }
        if (filterParams.state && record.state !== filterParams.state) {
            return false;
        }
        if (filterParams.cpu && record.cpu !== filterParams.cpu) {
            return false;
        }
        if (filterParams.priority !== null && record.priority < filterParams.priority) {
            return false;
        }
        if (filterParams.sched && record.sched !== filterParams.sched) {
            return false;
        }
        return true;
    };

    const [cols, setCols] = useState<ColumnRichInfo[]>([
        {
            id: "point",
            name: "point",
            enabled: true,
            filterInputSize: 14,
            filterActionKind: DashTableFilterActionKind.Like,
        },
        {
            id: "svc_id",
            name: "svc",
            enabled: true,
            filterInputSize: 20,
            filterActionKind: DashTableFilterActionKind.Like,
        },
        {
            id: "name",
            name: "task",
            enabled: true,
            filterInputSize: 14,
            filterActionKind: DashTableFilterActionKind.Like,
        },
        {
            id: "pid",
            name: "pid",
            enabled: true,
            filterInputSize: 5,
            columnType: DashTableColType.Integer,
        },
        {
            id: "state",
            name: "state",
            enabled: true,
            filterInputSize: 14,
            filterActionKind: DashTableFilterActionKind.Equal,
            filterFieldInput: DashTableFilterFieldInput.SelectWithEmpty,
            filterFieldSelectValues: pStates,
        },
        {
            id: "cpu",
            name: "cpu",
            enabled: true,
            filterInputSize: 4,
            columnType: DashTableColType.Integer,
        },
        {
            id: "sched",
            name: "sched",
            enabled: true,
            filterInputSize: 14,
            filterActionKind: DashTableFilterActionKind.Equal,
            filterFieldInput: DashTableFilterFieldInput.SelectWithEmpty,
            filterFieldSelectValues: scheds,
        },
        {
            id: "priority",
            name: "priority",
            enabled: true,
            filterInputSize: 4,
            columnType: DashTableColType.Integer,
            filterActionKind: DashTableFilterActionKind.GreaterEqual,
        },
    ]);

    const colsEnabled = useMemo<string[]>(() => {
        return cols
            .filter((c: ColumnRichInfo) => c.enabled)
            .map((c: ColumnRichInfo) => c.id);
    }, [cols]);

    const loaded = useQueryParams(
        [
            {
                name: "filter",
                value: filterParams,
                setter: setFilterParams,
                pack_json: true,
            },
            {
                name: "cols",
                value: colsEnabled,
                setter: (ec) => {
                    const nc = [...cols];
                    nc.forEach((column) => {
                        column.enabled = ec.includes(column.id);
                    });
                    setCols(nc);
                },
                pack_json: true,
            },
        ],
        [filterParams, cols]
    );

    const records = useEvaAPICall(
        {
            method: loaded ? `bus::${SVC_ID}::task.list` : undefined,
            update: 1,
        },
        [loaded]
    );

    const setTaskFilterParams = (p: object) => {
        let np: any = { ...filterParams };
        Object.keys(p).forEach((k) => {
            np[k] = (p as any)[k];
        });
        setFilterParams(np);
    };

    const filter: DashTableFilter = createRichFilter({
        cols,
        setCols,
        params: filterParams,
        setParams: setTaskFilterParams,
        removeButton,
    });

    const data: DashTableData = records?.data
        ?.filter(filterMatches)
        .map((record: any) => {
            const colsData: DashTableColData[] = [];
            pushRichColData({
                colsData,
                id: "point",
                value: record.point,
                setParams: setTaskFilterParams,
                cols,
                addButton,
            });
            pushRichColData({
                colsData,
                id: "svc_id",
                value: record.svc_id,
                setParams: setTaskFilterParams,
                cols,
                addButton,
            });
            pushRichColData({
                colsData,
                id: "name",
                value: record.name || "",
                setParams: setTaskFilterParams,
                cols,
                addButton,
            });
            pushRichColData({
                colsData,
                id: "pid",
                value: record.pid,
                setParams: setTaskFilterParams,
                cols,
                className: "col-fit",
                addButton,
            });
            pushRichColData({
                colsData,
                id: "state",
                value: record.state,
                setParams: setTaskFilterParams,
                cols,
                className: "col-fit",
                addButton,
            });
            pushRichColData({
                colsData,
                id: "cpu",
                value: record.cpu,
                setParams: setTaskFilterParams,
                cols,
                className: "col-fit",
                addButton,
            });
            pushRichColData({
                colsData,
                id: "sched",
                value: record.sched,
                setParams: setTaskFilterParams,
                cols,
                className: "col-fit",
                addButton,
            });
            pushRichColData({
                colsData,
                id: "priority",
                value: record.priority,
                setParams: setTaskFilterParams,
                cols,
                className: "col-fit",
                addButton,
            });
            let cpu_usage_class = "";
            if (record.cpu_usage > 80) {
                cpu_usage_class = "cpu-usage-crit";
            } else if (record.cpu_usage > 50) {
                cpu_usage_class = "cpu-usage-warn";
            }
            colsData.push({
                value: record.cpu_usage.toFixed(2),
                sort_value: record.cpu_usage,
                className: "col-fit " + cpu_usage_class,
            });
            colsData.push({
                value: (record.memory_usage / 1024 / 1024).toFixed(3),
                sort_value: record.memory_usage,
                className: "col-fit",
            });
            return {
                data: colsData,
            };
        });

    const colsToShow = records.data
        ? cols
              .filter((column) => column.enabled)
              .map((column) => column.name)
              .concat(["cpu %", "mem MB"])
        : [];

    let header = (
        <>
            <div>
                <EvaErrorMessage error={records.error} />
                {records?.error?.code === -32113 ? (
                    <div className="eva-error">
                        Unable to call {SVC_ID} service. Read{" "}
                        <a
                            target="_blank"
                            href="https://info.bma.ai/en/actual/eva4/svc/eva-rtmon.html"
                        >
                            how to deploy a service instance
                        </a>
                    </div>
                ) : (
                    ""
                )}{" "}
            </div>
        </>
    );
    return (
        <div>
            <div className="dashboard-main-wrapper dashboard-main-wrapper-big">
                <div className="dashboard-main-wrapper-content">
                    <div className="dashboard-main-wrapper-content__side-left">
                        <DashTable
                            id="rt_tasks"
                            header={header}
                            title="Tasks"
                            cols={colsToShow}
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

export default DashboardRealtime;
