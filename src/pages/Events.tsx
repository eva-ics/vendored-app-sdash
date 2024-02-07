import { useEvaAPICall, EvaErrorMessage } from "@eva-ics/webengine-react";
import { useState, useMemo } from "react";
import { Timestamp } from "bmat/time";
import { downloadCSV } from "bmat/dom";
import {
    DashTable,
    DashTableFilter,
    DashTableData,
    DashTableColType,
    DashTableColData,
    ColumnRichInfo,
    DashTableFilterActionKind,
    pushRichColData,
    createRichFilter,
    generateDashTableRichCSV,
} from "bmat/dashtable";
import { useQueryParams } from "bmat/hooks";
import DoubleArrowIcon from "@mui/icons-material/DoubleArrow";
import DateTimePickerSelect from "../components/date_time_picker.tsx";
import { addButton, removeButton } from "../components/common.tsx";

const DEFAULT_FRAME_SEC = 3600;
const SVC_ID = "eva.aaa.accounting";

const DashboardEvents = () => {
    const [filterParams, setFilterParams] = useState({
        t_start: null as number | null,
        t_end: null as number | null,
        node: null as string | null,
        u: null as string | null,
        src: null as string | null,
        svc: null as string | null,
        subj: null as string | null,
        oid: null as string | null,
        note: null as string | null,
        data: null as string | null,
        code: null as number | null,
        err: null as string | null,
    });

    const [cols, setCols] = useState<ColumnRichInfo[]>([
        { id: "node", name: "node", enabled: true, filterInputSize: 6 },
        {
            id: "svc",
            name: "service",
            enabled: true,
            filterInputSize: 14,
            filterActionKind: DashTableFilterActionKind.Like,
        },
        { id: "u", name: "user", enabled: true, filterInputSize: 6 },
        { id: "src", name: "source", enabled: false, filterInputSize: 9 },
        { id: "subj", name: "subject", enabled: true, filterInputSize: 12 },
        {
            id: "code",
            name: "code",
            enabled: true,
            filterInputSize: 5,
            columnType: DashTableColType.Integer,
        },
        { id: "oid", name: "OID", enabled: false, filterInputSize: 30 },
        {
            id: "note",
            name: "note",
            enabled: true,
            filterInputSize: 30,
            filterActionKind: DashTableFilterActionKind.Like,
        },
        {
            id: "data",
            name: "data",
            enabled: false,
            filterInputSize: 30,
            filterActionKind: DashTableFilterActionKind.Like,
            columnType: DashTableColType.JSON,
        },
        {
            id: "err",
            name: "error",
            enabled: true,
            filterInputSize: 30,
            filterActionKind: DashTableFilterActionKind.Like,
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

    const params = useMemo(() => {
        const f = { ...filterParams };
        if (f.t_start === null) {
            f.t_start = new Timestamp().subSec(DEFAULT_FRAME_SEC).toNumber();
        }
        return {
            filter: f,
        };
    }, [filterParams]);

    const updateInterval = useMemo(() => {
        if (
            filterParams.t_end === null ||
            filterParams.t_end > new Timestamp().toNumber()
        ) {
            return 1;
        } else {
            return 5;
        }
    }, [filterParams]);

    const records = useEvaAPICall({
        method: loaded ? `x::${SVC_ID}::query` : undefined,
        params: params,
        update: updateInterval,
    });

    const setLogFilterParams = (p: object) => {
        let np: any = { ...filterParams };
        Object.keys(p).forEach((k) => {
            np[k] = (p as any)[k];
        });
        setFilterParams(np);
    };

    const t_start =
        filterParams.t_start === null
            ? new Timestamp().subSec(DEFAULT_FRAME_SEC)
            : new Timestamp(filterParams.t_start);
    const t_end =
        filterParams.t_end === null ? new Timestamp() : new Timestamp(filterParams.t_end);

    const timeFilter: DashTableFilter = [
        [
            "",
            <>
                <DateTimePickerSelect
                    enabled={filterParams.t_start !== null}
                    element_id="t_start"
                    update_key={filterParams.t_start === null ? records.data : null}
                    current_value={t_start.toDate()}
                    setParam={(d: Date) => {
                        setLogFilterParams({ t_start: new Timestamp(d).toNumber() });
                    }}
                />
            </>,
        ],
        [
            "",
            <>
                <div
                    title="toggle real-time view"
                    className={
                        "bmat-dashtable-filter-label bmat-dashtable-filter-label-button " +
                        (params.filter.t_end ? "" : "filter-label-disabled")
                    }
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                        e.preventDefault();
                        if (params.filter.t_end === null) {
                            setLogFilterParams({
                                t_start: t_start.toNumber(),
                                t_end: t_end.toNumber(),
                            });
                        } else {
                            setLogFilterParams({
                                t_start: null,
                                t_end: null,
                            });
                        }
                    }}
                >
                    <DoubleArrowIcon fontSize="inherit" />
                </div>
                <DateTimePickerSelect
                    enabled={params.filter.t_end !== null}
                    element_id="t_end"
                    update_key={filterParams.t_start === null ? records.data : null}
                    current_value={t_end.toDate()}
                    setParam={(d: Date) => {
                        setLogFilterParams({ t_end: new Timestamp(d).toNumber() });
                    }}
                />
            </>,
        ],
    ];

    const filter: DashTableFilter = timeFilter.concat(
        createRichFilter({
            cols,
            setCols,
            params: params.filter,
            setParams: setLogFilterParams,
            removeButton,
        })
    );

    const data: DashTableData = records?.data?.toReversed().map((record: any) => {
        const t = new Timestamp(record.t);
        const colsData: DashTableColData[] = [
            {
                value: t.toRFC3339(true),
                sort_value: t.toNumber(),
                className: "col-fit",
            },
        ];
        pushRichColData({
            colsData,
            id: "node",
            value: record.node,
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
            addButton,
        });
        pushRichColData({
            colsData,
            id: "svc",
            value: record.svc || "",
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
            addButton,
        });
        pushRichColData({
            colsData,
            id: "u",
            value: record.u || "",
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
            addButton,
        });
        pushRichColData({
            colsData,
            id: "src",
            value: record.src || "",
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
            addButton,
        });
        pushRichColData({
            colsData,
            id: "subj",
            value: record.subj || "",
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
            addButton,
        });
        pushRichColData({
            colsData,
            id: "code",
            value: record.code,
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
            addButton,
        });
        pushRichColData({
            colsData,
            id: "oid",
            value: record.oid || "",
            setParams: setLogFilterParams,
            cols,
            addButton,
        });
        pushRichColData({
            colsData,
            id: "note",
            value: record.note || "",
            setParams: setLogFilterParams,
            cols,
            addButton,
        });
        pushRichColData({
            colsData,
            id: "data",
            value: record.data ? <pre>{JSON.stringify(record.data, null, 2)}</pre> : "",
            cols,
            className: "log-record-message",
        });
        pushRichColData({
            colsData,
            id: "err",
            value: record.err || "",
            setParams: setLogFilterParams,
            cols,
            addButton,
        });
        return {
            data: colsData,
            className: `log-record-${record.code === 0 ? "info" : "error"}`,
        };
    });

    const colsToShow = records.data
        ? ["time"].concat(
              cols.filter((column) => column.enabled).map((column) => column.name)
          )
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
                            href="https://info.bma.ai/en/actual/eva4/svc/eva-aaa-accounting.html"
                        >
                            how to deploy a service instance
                        </a>
                    </div>
                ) : (
                    ""
                )}{" "}
            </div>
            <div className="button_bar">
                <button
                    disabled={records.data === null}
                    onClick={() => {
                        const csvContent = generateDashTableRichCSV({
                            data: records.data,
                            cols,
                            timeCol: "t",
                        });
                        downloadCSV(csvContent, "events.csv");
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
                            id="accev"
                            header={header}
                            title="Event audit trail"
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

export default DashboardEvents;
