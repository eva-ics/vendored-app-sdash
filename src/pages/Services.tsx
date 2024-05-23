import { useEvaAPICall, get_engine } from "@eva-ics/webengine-react";
import { Eva } from "@eva-ics/webengine";
import { useState } from "react";
import { onSuccess, onEvaError } from "../common.tsx";
import { DashTable, DashTableData, DashTableFilter } from "bmat/dashtable";
import { useQueryParams } from "bmat/hooks";

const DashboardServices = () => {
    const eva = get_engine() as Eva;

    const [params, setParams] = useState({
        filter: null,
    });

    const setSvcParams = (p: object) => {
        let np: any = { ...params };
        Object.keys(p).forEach((k) => {
            np[k] = (p as any)[k];
        });
        setParams(np);
    };

    const loaded = useQueryParams(
        [
            {
                name: "filter",
                value: params.filter || "",
                setter: (s: string) => {
                    setSvcParams({ filter: s || null });
                },
            },
        ],
        [params.filter]
    );

    const svc_list = useEvaAPICall(
        {
            method: loaded ? `bus::eva.core::svc.list` : undefined,
            params,
            update: 1,
        },
        [loaded, params]
    );

    const restartService = (id: string) => {
        eva.call(`bus::eva.core::svc.restart`, { i: id })
            .then(() => onSuccess())
            .catch((e) => onEvaError(e));
    };

    const filter: DashTableFilter = [
        [
            "Filter",
            <input
                size={20}
                value={params.filter || ""}
                onChange={(e) => setSvcParams({ filter: e.target.value || null })}
            />,
        ],
    ];

    const data: DashTableData = svc_list?.data?.map((svc: any) => {
        return {
            data: [
                { value: svc.id },
                {
                    value: svc.status,
                    className:
                        "col-fit " +
                        (svc.status == "online" ? "data-active" : "data-inactive"),
                },
                { value: svc.pid, className: "col-fit" },
                {
                    value: svc.pid ? (
                        <div className="print-hidden">
                            <button onClick={() => restartService(svc.id)}>
                                restart
                            </button>
                        </div>
                    ) : null,
                    className: "col-fit",
                },
                { value: svc.launcher },
            ],
        };
    });

    return (
        <div>
            <div className="dashboard-main-wrapper dashboard-main-wrapper-big">
                <div className="dashboard-main-wrapper-content">
                    <div className="dashboard-main-wrapper-content__side-left">
                        <DashTable
                            id="svcs"
                            title="Services"
                            filter={filter}
                            cols={["id", "status", "pid", "", "launcher"]}
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

export default DashboardServices;
