import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import { LayoutProps } from "../types";
import { useSearchParams } from "react-router-dom";
import { useXTerm } from "react-xtermjs";
import DashboardOverview from "../pages/Overview.tsx";
import DashboardCloud from "../pages/Cloud.tsx";
import DashboardServices from "../pages/Services.tsx";
import DashboardLog from "../pages/Log.tsx";
import DashboardEvents from "../pages/Events.tsx";
import DashboardRealtime from "../pages/Rt.tsx";
import { get_engine } from "@eva-ics/webengine-react";
import { onEvaError, onError } from "../common";

const Layout = ({ logout }: LayoutProps) => {
    const [isOpenMenu, setIsOpenMenu] = useState(false);
    const [searchParams, _] = useSearchParams();

    const [terminalVisible, setTerminalVisibile] = useState(false);

    const toggleMenu = () => {
        setIsOpenMenu(!isOpenMenu);
    };

    useEffect(() => {
        document.addEventListener("keydown", (e) => {
            if (e.key === "`" && e.altKey) {
                e.preventDefault();
                setTerminalVisibile(true);
            }
        });
    }, []);

    let content;
    let current_page;

    switch (searchParams.get("d")) {
        case "cloud":
            content = <DashboardCloud />;
            current_page = "Cloud";
            break;
        case "services":
            content = <DashboardServices />;
            current_page = "Services";
            break;
        case "log":
            content = <DashboardLog />;
            current_page = "Log";
            break;
        case "events":
            content = <DashboardEvents />;
            current_page = "Events";
            break;
        case "rt":
            content = <DashboardRealtime />;
            current_page = "Realtime";
            break;
        case "navigate":
            content = <DashboardOverview />;
            current_page = "Navigate";
            break;
        case "main_app":
            content = <DashboardOverview />;
            current_page = "Main app";
            break;
        default:
            current_page = "Overview";
            content = <DashboardOverview />;
    }

    const nav = [
        { value: "Overview", to: "?" },
        { value: "Services", to: "?d=services" },
        { value: "Realtime", to: "?d=rt" },
        { value: "Cloud", to: "?d=cloud" },
        { value: "Events", to: "?d=events" },
        { value: "Log", to: "?d=log" },
        {
            value: "Navigate",

            submenus: [
                { value: "Main app", to: "/" },
                { value: "Vendored apps", to: "/va/" },
                { value: "Logout", to: "logout" },
            ],
        },
    ];

    if (terminalVisible) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "auto";
    }

    return (
        <div className="root-container">
            <Header
                toggleMenu={toggleMenu}
                nav={nav}
                logout={logout}
                current_page={current_page}
                setTerminalVisibile={setTerminalVisibile}
            />
            <SideMenu
                nav={nav}
                isOpen={isOpenMenu}
                toggleMenu={toggleMenu}
                logout={logout}
                current_page={current_page}
            />
            {terminalVisible ? <Terminal setVisible={setTerminalVisibile} /> : null}
            {content}
        </div>
    );
};

const FILEMGR_SVC = "eva.filemgr.main";

const TERM_DEFAULT_COLS = 80;
const TERM_DEFAULT_ROWS = 24;

const terminal_parameters = () => {
    return {
        options: {
            cols: TERM_DEFAULT_COLS,
            rows: TERM_DEFAULT_ROWS,
            fontSize: 14,
            cursorStyle: "block",
        },
        listeners: {},
    };
};

const terminalDimensions = (): [number, number] => {
    let el = document.getElementById("tdcalc");
    if (!el) {
        el = document.createElement("span");
        el.id = "tdcalc";
        el.style.visibility = "hidden";
        let s = "";
        for (let i = 0; i < 36; i++) {
            s += "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            if (i < 35) {
                s += "<br />";
            }
        }
        el.innerHTML = s;

        document.body.appendChild(el);
    }
    let char_width = el.offsetWidth / 36;
    let char_height = el.offsetHeight / 36;
    let cols = Math.floor(((window.innerWidth / char_width) * 95) / 100 - 1);
    let rows = Math.floor(((window.innerHeight / char_height) * 90) / 100 - 1);
    return [cols, rows];
};

const Terminal = ({ setVisible }: { setVisible: (v: boolean) => void }) => {
    const terminalId = useRef<string | null>(null);

    const term_params = useMemo(() => {
        const [cols, rows] = terminalDimensions();
        const p = terminal_parameters();
        p.options.cols = cols;
        p.options.rows = rows;
        (p.listeners as any).onKey = (event: {
            key: string;
            domEvent: KeyboardEvent;
        }) => {
            if (event.domEvent.key == "`" && event.domEvent.altKey) {
                setVisible(false);
            }
        };
        return p;
    }, []);

    const { instance, ref } = useXTerm(term_params as any);

    useEffect(() => {
        const engine = get_engine()!;
        engine
            .call(`bus::${FILEMGR_SVC}::terminal.create`, {
                dimensions: [term_params.options.cols, term_params.options.rows],
            })
            .then((res: any) => {
                terminalId.current = res.i;
            })
            .catch((e) => {
                onEvaError(e);
                setVisible(false);
            });
        return () => {
            if (terminalId.current) {
                engine.call(`bus::${FILEMGR_SVC}::terminal.kill`, {
                    i: terminalId.current,
                });
            }
        };
    }, []);

    useLayoutEffect(() => {
        const updateSize = () => {
            const [cols, rows] = terminalDimensions();
            const engine = get_engine()!;
            if (!terminalId.current) {
                instance?.resize(cols, rows);
                return;
            }
            engine
                .call(`bus::${FILEMGR_SVC}::terminal.resize`, {
                    i: terminalId.current,
                    dimensions: [cols, rows],
                })
                .then(() => {
                    instance?.resize(cols, rows);
                })
                .catch((e) => {
                    onEvaError(e);
                });
        };
        window.addEventListener("resize", updateSize);
        updateSize();
        return () => window.removeEventListener("resize", updateSize);
    }, [instance]);

    const input = useRef("");
    const action_in_progress = useRef(false);

    const stdio_worker = () => {
        if (!terminalId.current) {
            return;
        }
        const engine = get_engine()!;
        if (action_in_progress.current) {
            return;
        }
        action_in_progress.current = true;
        engine
            .call(`bus::${FILEMGR_SVC}::terminal.sync`, {
                i: terminalId.current,
                input: input.current,
            })
            .then((data) => {
                if (Array.isArray(data?.output)) {
                    data.output.forEach((v: any) => {
                        let stdout = v.stdout;
                        if (stdout) {
                            instance?.write(stdout);
                        }
                        let stderr = v.stderr;
                        if (stderr) {
                            instance?.write(stderr);
                        }
                        let code = v.terminated;
                        if (code !== undefined) {
                            setVisible(false);
                            if (code !== 0 && code !== null) {
                                onError(`Terminal session terminated with code ${code}`);
                            }
                        }
                    });
                }
            })
            .finally(() => {
                action_in_progress.current = false;
            })
            .catch((e) => {
                onEvaError(e);
                setVisible(false);
            });
        input.current = "";
    };

    useEffect(() => {
        const w = setInterval(stdio_worker, 100);
        return () => clearInterval(w);
    }, [instance, terminalId]);

    instance?.onData((data: string) => {
        input.current += data;
    });

    return (
        <>
            <div className="web-terminal-dim-content"></div>
            <div className="web-terminal">
                <div ref={ref}></div>
            </div>
        </>
    );
};

export default Layout;
