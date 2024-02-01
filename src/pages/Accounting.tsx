import { useEvaAPICall } from "@eva-ics/webengine-react";
import { EvaError } from "@eva-ics/webengine";
import { useState } from "react";
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

const formatError = (err: EvaError | undefined): string => {
    if (err) {
        return err.message || "Error" + ` (${err.code})`;
    }
    return "";
};

const DashboardAccounting = () => {
    const [params, setParams] = useState({
        filter: {
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

    const [cols, setCols] = useState({
        node: true,
        u: true,
        src: false,
        svc: true,
        subj: true,
        oid: false,
        note: true,
        data: false,
        code: true,
        err: true,
    });

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
                value: cols,
                setter: setCols,
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

    const toggleCol = (id: string) => {
        let nc: any = { ...cols };
        nc[id] = !nc[id];
        setCols(nc);
    };

    const format_col = (name: string, id: string) => {
        const className =
            "filter-label " + ((cols as any)[id] === true ? "" : "filter-label-off");
        return (
            <span className={className} onClick={() => toggleCol(id)}>
                {name}
            </span>
        );
    };

    const pushColData = ({
        colsData,
        id,
        value,
        sort_value,
        disable_filter_by,
        className,
        cols,
    }: {
        colsData: DashTableColData[];
        id: string;
        value: any;
        sort_value?: any;
        disable_filter_by?: boolean;
        className?: string;
        cols?: { [key: string]: boolean };
    }) => {
        if (cols && !(cols as any)[id]) {
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
                            className="filter-button-add"
                            style={{
                                display: "inline-block",
                                width: "5px",
                                marginLeft: "2px",
                                color: "#117711",
                                cursor: "pointer",
                            }}
                            onClick={() => setLogFilterParams({ [id]: value })}
                        >
                            &nbsp;
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

    const filter: DashTableFilter = [
        [
            format_col("Node", "node") as any,
            <>
                <input
                    size={6}
                    value={params.filter.node || ""}
                    onChange={(e) => setLogFilterParams({ node: e.target.value || null })}
                />
                {params.filter.node ? (
                    <div
                        style={{
                            display: "inline-block",
                            color: "red",
                            cursor: "pointer",
                        }}
                        onClick={() => setLogFilterParams({ node: null })}
                    >
                        &nbsp;
                        <RemoveCircleOutlineIcon fontSize="inherit" />
                    </div>
                ) : (
                    ""
                )}
            </>,
        ],
        [
            format_col("User", "u"),
            <input
                size={6}
                value={params.filter.u || ""}
                onChange={(e) => setLogFilterParams({ u: e.target.value || null })}
            />,
        ],
        [
            format_col("Source", "src"),
            <input
                size={9}
                value={params.filter.src || ""}
                onChange={(e) => setLogFilterParams({ src: e.target.value || null })}
            />,
        ],
        [
            format_col("Service", "svc"),
            <input
                size={14}
                value={params.filter.svc || ""}
                onChange={(e) => setLogFilterParams({ svc: e.target.value || null })}
            />,
        ],
        [
            format_col("Subject", "subj"),
            <input
                size={12}
                value={params.filter.subj || ""}
                onChange={(e) => setLogFilterParams({ subj: e.target.value || null })}
            />,
        ],
        [
            format_col("OID", "oid"),
            <input
                size={30}
                value={params.filter.oid || ""}
                onChange={(e) => setLogFilterParams({ oid: e.target.value || null })}
            />,
        ],
        [
            format_col("Note", "note"),
            <input
                size={30}
                value={params.filter.note || ""}
                onChange={(e) => setLogFilterParams({ note: e.target.value || null })}
            />,
        ],
        [
            format_col("Data", "data"),
            <input
                size={30}
                value={params.filter.data || ""}
                onChange={(e) => setLogFilterParams({ data: e.target.value || null })}
            />,
        ],
        [
            format_col("Code", "code"),
            <input
                size={5}
                value={params.filter.code === null ? "" : params.filter.code}
                onChange={(e) => {
                    let code: string | number | null =
                        e.target.value === "" ? null : parseInt(e.target.value);
                    if (code !== null && isNaN(code)) {
                        code = e.target.value;
                    }
                    setLogFilterParams({
                        code: code,
                    });
                }}
            />,
        ],
        [
            format_col("Error", "err"),
            <input
                size={30}
                value={params.filter.err || ""}
                onChange={(e) => setLogFilterParams({ err: e.target.value || null })}
            />,
        ],
    ];

    const data: DashTableData = records?.data?.toReversed().map((record: any) => {
        const colsData: DashTableColData[] = [
            {
                value: timestampRFC3339(record.t, true),
                sort_value: record.t,
            },
        ];
        pushColData({ colsData, id: "node", value: record.node, cols });
        pushColData({ colsData, id: "u", value: record.u || "", cols });
        pushColData({ colsData, id: "src", value: record.src || "", cols });
        pushColData({ colsData, id: "svc", value: record.svc || "", cols });
        pushColData({ colsData, id: "subj", value: record.subj || "", cols });
        pushColData({ colsData, id: "oid", value: record.oid || "", cols });
        pushColData({ colsData, id: "note", value: record.note || "", cols });
        pushColData({
            colsData,
            id: "data",
            value: record.data ? <pre>{JSON.stringify(record.data, null, 2)}</pre> : "",
            cols,
            disable_filter_by: true,
            className: "log-record-message",
        });
        pushColData({ colsData, id: "code", value: record.code, cols });
        pushColData({
            colsData,
            id: "err",
            value: record.err || "",
            cols,
        });
        return {
            data: colsData,
            className: `log-record-${record.code === 0 ? "info" : "error"}`,
        };
    });

    const colsToShow = ["time"].concat(
        Object.keys(cols).filter((key) => (cols as any)[key] === true)
    );

    const header = <div className="api-error">{formatError(records.error)}</div>;

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
