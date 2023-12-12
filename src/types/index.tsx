import { FunctionLogout } from "@eva-ics/webengine-react";

export interface SideMenuProps {
    isOpen: boolean;
    toggleMenu: () => void;
    logout: FunctionLogout;
    nav: Array<NavElement>;
    current_page: string;
    submenus?: SubmenuItem[];
}

export interface LayoutProps {
    logout: FunctionLogout;
}

export interface HeaderProps {
    toggleMenu: () => void;
    logout: FunctionLogout;
    current_page: string;
    nav: Array<NavElement>;
}

type SubmenuItem = {
    value: string;
    to: string;
};

export interface NavElement {
    value: any;
    to?: string;
    submenus?: SubmenuItem[];
}

export const DEFAULT_TITLE = "Node system dashboard";
