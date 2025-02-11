import { useEvaAPICall, get_engine } from "@eva-ics/webengine-react";
import { useEffect, useRef } from "react";
import { Eva } from "@eva-ics/webengine";
import { DashTable, DashTableData } from "bmat/dashtable";
import { formatUptime } from "bmat/time";
import { formatNumber } from "bmat/numbers";

export interface RemoteNode {
    node: string;
    svc: string;
}

const DashboardCloud = ({
    openTerminal,
}: {
    openTerminal: (node?: RemoteNode) => void;
}) => {
    const eva = get_engine() as Eva;

    const node_info_xtra = useRef(new Map());

    const node_list = useEvaAPICall(
        {
            method: `bus::eva.core::node.list`,
            update: 1,
        },
        []
    );

    useEffect(() => {
        if (Array.isArray(node_list.data)) {
            let repl_svcs = new Set();
            node_list.data.forEach((v) => {
                if (v.svc) {
                    repl_svcs.add(v.svc);
                }
            });
            repl_svcs.forEach((svc) => {
                eva.call(`bus::${svc}::node.list`).then((nodes) => {
                    nodes.forEach((node: any) => {
                        node_info_xtra.current.set(node.name, node);
                    });
                });
            });
        }
    }, [node_list]);

    const node_item_summary = useEvaAPICall(
        {
            method: "bus::eva.core::item.summary",
            update: 5,
        },
        []
    );

    const data: DashTableData = node_list?.data?.map((node: any) => {
        const xtra = node_info_xtra.current.get(node.name);

        let managed;
        let trusted;
        if (node.svc) {
            if (xtra) {
                managed = xtra.managed ? "YES" : "NO";
                trusted = xtra.trusted ? "YES" : "NO";
            }
        }

        const item_count =
            node_item_summary?.data?.sources?.[node.svc ? node.name : ".local"];
        const data = [{ value: node.name }] as any;
        if ((xtra?.managed && xtra?.online) || !node.svc) {
            data.push({
                value: (
                    <div className="print-hidden">
                        <button
                            onClick={() => {
                                if (node.svc) {
                                    openTerminal({ node: node.name, svc: node.svc });
                                } else {
                                    openTerminal();
                                }
                            }}
                        >
                            console
                        </button>
                    </div>
                ),
                className: "col-fit",
            });
        } else {
            data.push({ value: "", className: "col-fit" });
        }
        return {
            data: data.concat([
                {
                    value: node.online ? "YES" : "NO",
                    sort_value: node.online,
                    className:
                        (node.online ? "data-active" : "data-inactive") + " col-fit",
                },
                {
                    value: managed,
                    className: (xtra?.managed ? "" : "data-inactive") + " col-fit",
                },
                {
                    value: trusted,
                    className: (xtra?.trusted ? "" : "data-inactive") + " col-fit",
                },
                {
                    value: formatUptime(xtra?.link_uptime),
                    sort_value: xtra?.link_uptime,
                    className: "col-uptime",
                },
                {
                    value: formatNumber(item_count, "_"),
                    sort_value: item_count,
                },
                { value: node.svc, className: "col-fit" },
                { value: node.info?.version, className: "col-fit" },
                { value: node.info?.build },
            ]),
        };
    });

    return (
        <div>
            <div className="dashboard-main-wrapper dashboard-main-wrapper-big">
                <div className="dashboard-main-wrapper-content">
                    <div className="dashboard-main-wrapper-content__side-left">
                        <DashTable
                            id="cloud"
                            title="Cloud status"
                            cols={[
                                "node",
                                "",
                                "online",
                                "managed",
                                "trusted",
                                "link uptime",
                                "items",
                                "svc",
                                "version",
                                "build",
                            ]}
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

export default DashboardCloud;
