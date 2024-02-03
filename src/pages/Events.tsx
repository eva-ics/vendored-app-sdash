import { useEvaAPICall } from "@eva-ics/webengine-react";
import { EvaError } from "@eva-ics/webengine";
import { useState, useMemo } from "react";
import {
    DashTable,
    DashTableFilter,
    DashTableData,
    DashTableColData,
} from "bmat/dashtable";
import { useQueryParams } from "bmat/hooks";
import { timestampRFC3339 } from "bmat/time";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import DoubleArrowIcon from "@mui/icons-material/DoubleArrow";
import DateTimePickerSelect from "../components/date_time_picker.tsx";

const DEFAULT_FRAME_SEC = 3600;

const downloadCSV = (csvContent: any, filename = "events.csv") => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const generateCSV = (data: any, cols: Column[]) => {
    const enabledCols = cols.filter((col) => col.enabled);
    const colIds = enabledCols.map((col) => col.id);
    const escapeCSV = (s: any, col_id?: string): string | number => {
        if (col_id === "data") {
            return escapeCSV(JSON.stringify(s));
        }
        if (s === null || s === undefined) return "";
        if (typeof s === "number") return s;
        let escapedStr = s.replace(/"/g, '""');
        return `"${escapedStr}"`;
    };
    let csvContent = "time,t";
    if (colIds.length > 0) {
        csvContent += "," + colIds.join(",") + "\n";
    }
    data.forEach((row: any) => {
        const rowArray = [timestampRFC3339(row.t), row.t].concat(
            colIds.map((key) => {
                const cellValue = row[key];
                return escapeCSV(cellValue, key);
            })
        );
        csvContent += rowArray.join(",") + "\n";
    });
    return csvContent;
};

class Timestamp {
    t: number;
    constructor(src?: Date | number) {
        if (src === null || src === undefined) {
            this.t = Date.now() / 1000;
        } else if (typeof src === "number") {
            this.t = src;
        } else {
            this.t = src.getTime() / 1000;
        }
    }
    addSec(sec: number): Timestamp {
        this.t += sec;
        return this;
    }
    subSec(sec: number): Timestamp {
        this.t -= sec;
        return this;
    }
    toDate(): Date {
        return new Date(this.t * 1000);
    }
    toNumber(): number {
        return this.t;
    }
}

const ErrorMessage = ({ error, className }: { error?: EvaError; className?: string }) => {
    return (
        <div className={className || ""}>
            {error ? error.message || "Error" + ` (${error.code})` : ""}
        </div>
    );
};

enum FilterFieldKind {
    String = "string",
    Integer = "integer",
}

enum FilterActionKind {
    Equal = "=",
    Like = "~",
}

interface Column {
    id: string;
    name: string;
    enabled: boolean;
    filterInputSize?: number;
    filterFieldKind?: FilterFieldKind;
    filterActionKind?: FilterActionKind;
}

const formatValue = (value: string, kind: FilterFieldKind): any => {
    switch (kind) {
        case FilterFieldKind.String:
            return value || null;
            break;
        case FilterFieldKind.Integer:
            let n: string | number | null = value === "" ? null : parseInt(value);
            if (n !== null && isNaN(n)) {
                n = null;
            }
            return n;
            break;
    }
};

const createRichFilter = ({
    cols,
    setCols,
    params,
    setParams,
    className,
}: {
    cols: Column[];
    setCols: (cols: Column[]) => void;
    params: { [key: string]: any };
    setParams: (o: { [key: string]: any }) => void;
    className?: string;
}): DashTableFilter =>
    cols.map((col) => {
        let labelClassName = "filter-label";
        labelClassName +=
            (col?.enabled === true ? " " : " filter-label-off ") + (className || "");
        const label = (
            <div style={{ display: "inline-block" }}>
                <span
                    title={`toggle ${col.name} column display`}
                    className={labelClassName}
                    onClick={() => {
                        col.enabled = !col.enabled;
                        const nc: Column[] = [...cols];
                        setCols(nc);
                    }}
                >
                    {col.name}
                </span>{" "}
                {col.filterActionKind || "="}
            </div>
        );
        const input = (
            <>
                <input
                    size={col.filterInputSize || 10}
                    value={params[col.id] === null ? "" : params[col.id]}
                    onChange={(e) =>
                        setParams({
                            [col.id]: formatValue(
                                e.target.value,
                                col.filterFieldKind || FilterFieldKind.String
                            ),
                        })
                    }
                />
                <div
                    title={`clear ${col.name} filter`}
                    className="filter-button-remove"
                    onClick={() => setParams({ [col.id]: null })}
                >
                    {params[col.id] !== null ? (
                        <>
                            <RemoveCircleOutlineIcon fontSize="inherit" />
                        </>
                    ) : (
                        <div style={{ display: "inline-block", width: 14 }}></div>
                    )}
                </div>
            </>
        );
        return [label, input];
    });

const pushColData = ({
    colsData,
    id,
    value,
    setParams,
    sort_value,
    disable_filter_by,
    className,
    cols,
}: {
    colsData: DashTableColData[];
    id: string;
    value: any;
    setParams: (o: { [key: string]: any }) => void;
    sort_value?: any;
    disable_filter_by?: boolean;
    className?: string;
    cols: Column[];
}) => {
    const column = cols.find((column) => column.id === id);
    if (!column?.enabled) {
        return;
    }
    const data = {
        value: (
            <>
                {value}
                {value === null || value === "" || disable_filter_by ? (
                    ""
                ) : (
                    <div
                        title={`use the value as ${column.name} filter`}
                        className="filter-button-add"
                        onClick={() => setParams({ [id]: value })}
                    >
                        <AddCircleOutlineIcon fontSize="inherit" />
                    </div>
                )}
            </>
        ),
        sort_value: sort_value === undefined ? value : sort_value,
        className: className,
    };
    colsData.push(data);
};

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

    const [cols, setCols] = useState<Column[]>([
        { id: "node", name: "node", enabled: true, filterInputSize: 6 },
        {
            id: "svc",
            name: "service",
            enabled: true,
            filterInputSize: 14,
            filterActionKind: FilterActionKind.Like,
        },
        { id: "u", name: "user", enabled: true, filterInputSize: 6 },
        { id: "src", name: "source", enabled: false, filterInputSize: 9 },
        { id: "subj", name: "subject", enabled: true, filterInputSize: 12 },
        {
            id: "code",
            name: "code",
            enabled: true,
            filterInputSize: 5,
            filterFieldKind: FilterFieldKind.Integer,
        },
        { id: "oid", name: "OID", enabled: false, filterInputSize: 30 },
        {
            id: "note",
            name: "note",
            enabled: true,
            filterInputSize: 30,
            filterActionKind: FilterActionKind.Like,
        },
        {
            id: "data",
            name: "data",
            enabled: false,
            filterInputSize: 30,
            filterActionKind: FilterActionKind.Like,
        },
        {
            id: "err",
            name: "error",
            enabled: true,
            filterInputSize: 30,
            filterActionKind: FilterActionKind.Like,
        },
    ]);

    const colsEnabled = useMemo<string[]>(() => {
        return cols.filter((c: Column) => c.enabled).map((c: Column) => c.id);
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
        method: loaded ? "x::eva.aaa.accounting::query" : undefined,
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
                        "filter-label filter-label-button " +
                        (params.filter.t_end ? "filter-label " : "filter-label-disabled")
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
        })
    );

    const data: DashTableData = records?.data?.toReversed().map((record: any) => {
        const colsData: DashTableColData[] = [
            {
                value: timestampRFC3339(record.t, true),
                sort_value: record.t,
                className: "col-fit",
            },
        ];
        pushColData({
            colsData,
            id: "node",
            value: record.node,
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
        });
        pushColData({
            colsData,
            id: "svc",
            value: record.svc || "",
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
        });
        pushColData({
            colsData,
            id: "u",
            value: record.u || "",
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
        });
        pushColData({
            colsData,
            id: "src",
            value: record.src || "",
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
        });
        pushColData({
            colsData,
            id: "subj",
            value: record.subj || "",
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
        });
        pushColData({
            colsData,
            id: "code",
            value: record.code,
            setParams: setLogFilterParams,
            cols,
            className: "col-fit",
        });
        pushColData({
            colsData,
            id: "oid",
            value: record.oid || "",
            setParams: setLogFilterParams,
            cols,
        });
        pushColData({
            colsData,
            id: "note",
            value: record.note || "",
            setParams: setLogFilterParams,
            cols,
        });
        pushColData({
            colsData,
            id: "data",
            value: record.data ? <pre>{JSON.stringify(record.data, null, 2)}</pre> : "",
            setParams: setLogFilterParams,
            cols,
            disable_filter_by: true,
            className: "log-record-message",
        });
        pushColData({
            colsData,
            id: "err",
            value: record.err || "",
            setParams: setLogFilterParams,
            cols,
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
                <ErrorMessage error={records.error} className="api-error" />
                {records?.error?.code === -32113 ? (
                    <div className="api-error">
                        Unable to find eva.aaa.accounting service. Read{" "}
                        <a href="https://info.bma.ai/en/actual/eva4/svc/eva-aaa-accounting.html">
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
                        const csvContent = generateCSV(records.data, cols);
                        downloadCSV(csvContent);
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
