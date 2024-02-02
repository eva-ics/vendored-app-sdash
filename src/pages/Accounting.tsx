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

interface Column {
    id: string;
    name: string;
    enabled: boolean;
    filterInputSize?: number;
    filterFieldKind?: FilterFieldKind;
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
            </span>
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

const DashboardAccounting = () => {
    const [params, setParams] = useState({
        filter: {
            t_start: Date.now() / 1000 - 3600,
            t_end: null,
            node: null,
            u: null,
            src: null,
            svc: null,
            subj: null,
            oid: null,
            note: null,
            data: null,
            code: null,
            err: null,
        },
    });

    const [lastStartSelected, setLastStartSelected] = useState(
        new Date(Date.now() - 3_600_000)
    );
    const [lastEndSelected, setLastEndSelected] = useState(new Date());

    const [cols, setCols] = useState<Column[]>([
        { id: "node", name: "Node", enabled: true, filterInputSize: 6 },
        { id: "svc", name: "Service", enabled: true, filterInputSize: 14 },
        { id: "u", name: "User", enabled: true, filterInputSize: 6 },
        { id: "src", name: "Source", enabled: false, filterInputSize: 9 },
        { id: "subj", name: "Subject", enabled: true, filterInputSize: 12 },
        {
            id: "code",
            name: "Code",
            enabled: true,
            filterInputSize: 5,
            filterFieldKind: FilterFieldKind.Integer,
        },
        { id: "oid", name: "OID", enabled: false, filterInputSize: 30 },
        { id: "note", name: "Note", enabled: true, filterInputSize: 30 },
        { id: "data", name: "Data", enabled: false, filterInputSize: 30 },
        { id: "err", name: "Error", enabled: true, filterInputSize: 30 },
    ]);

    const colsEnabled = useMemo<string[]>(() => {
        return cols.filter((c: Column) => c.enabled).map((c: Column) => c.id);
    }, [cols]);

    const loaded = useQueryParams(
        [
            {
                name: "params",
                value: params,
                setter: setParams,
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
        [params, cols]
    );

    const records = useEvaAPICall({
        method: loaded ? "x::eva.aaa.accounting::query" : undefined,
        params: params,
        update: 1,
    });

    const setLogFilterParams = (p: object) => {
        let np: any = { ...params.filter };
        Object.keys(p).forEach((k) => {
            np[k] = (p as any)[k];
        });
        setParams({ filter: np });
    };

    const timeFilter: DashTableFilter = [
        [
            "",
            <>
                <DateTimePickerSelect
                    enabled={params.filter.t_end !== null}
                    element_id="t_start"
                    current_value={lastStartSelected}
                    setParam={(d: Date) => {
                        setLastStartSelected(d);
                        setLogFilterParams({ t_start: d.getTime() / 1000 });
                    }}
                />
            </>,
        ],
        [
            "",
            <>
                <span
                    title="toggle real-time view"
                    className={params.filter.t_end ? "" : "filter-label-disabled"}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                        e.preventDefault();
                        if (params.filter.t_end === null) {
                            setLogFilterParams({
                                t_end: lastEndSelected.getTime() / 1000,
                            });
                        } else {
                            setLogFilterParams({
                                t_start: Date.now() / 1000 - 3600,
                                t_end: null,
                            });
                        }
                    }}
                >
                    <DoubleArrowIcon fontSize="inherit" />
                </span>
                <DateTimePickerSelect
                    enabled={params.filter.t_end !== null}
                    element_id="t_end"
                    current_value={lastEndSelected}
                    setParam={(d: Date) => {
                        setLastEndSelected(d);
                        setLogFilterParams({ t_end: d.getTime() / 1000 });
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

    const header = <ErrorMessage error={records.error} className="api-error" />;

    return (
        <div>
            <div className="dashboard-main-wrapper dashboard-main-wrapper-big">
                <div className="dashboard-main-wrapper-content">
                    <div className="dashboard-main-wrapper-content__side-left">
                        <DashTable
                            id="accev"
                            header={header}
                            title="Event accounting"
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

export default DashboardAccounting;
