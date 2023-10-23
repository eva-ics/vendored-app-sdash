import { ReactNode } from "react";
import { FunctionLogout } from "@eva-ics/webengine-react";

export interface SideMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
  logout: FunctionLogout;
  nav: Array<NavElement>
}

export interface LayoutProps {
  children: ReactNode;
  logout: FunctionLogout;
}

export interface HeaderProps {
  toggleMenu: () => void;
  logout: FunctionLogout;
  current_page: string;
  nav: Array<NavElement>
}

type SubmenuItem = {
  value: string;
  to: string;
};


type NavElement = {
  value: string;
  to: string;
  submenus?: SubmenuItem[];
};

export const DEFAULT_TITLE = "Node system dashboard";
