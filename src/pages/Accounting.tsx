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
        ],
        [params]
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

    const filter: DashTableFilter = [
        [
            format_col("Node", "node") as any,
            <input
                size={6}
                value={params.filter.node || ""}
                onChange={(e) => setLogFilterParams({ node: e.target.value || null })}
            />,
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
                size={12}
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
                size={20}
                value={params.filter.err || ""}
                onChange={(e) => setLogFilterParams({ err: e.target.value || null })}
            />,
        ],
    ];

    const data: DashTableData = records?.data?.toReversed().map((record: any) => {
        const values: DashTableColData[] = [
            {
                value: timestampRFC3339(record.t, true),
                sort_value: record.t,
            },
        ];
        cols.node && values.push({ value: record.node });
        cols.u && values.push({ value: record.u || "" });
        cols.src && values.push({ value: record.src || "" });
        cols.svc && values.push({ value: record.svc || "" });
        cols.subj && values.push({ value: record.subj || "" });
        cols.oid && values.push({ value: record.oid || "" });
        cols.note && values.push({ value: record.note || "" });
        cols.data &&
            values.push({
                value: record.data ? (
                    <pre>{JSON.stringify(record.data, null, 2)}</pre>
                ) : (
                    ""
                ),
                className: "log-record-message",
            });
        cols.code && values.push({ value: record.code });
        cols.err && values.push({ value: record.err || "" });
        return {
            data: values,
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
