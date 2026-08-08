import * as React from "react";

export type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  // Dashboard-specific properties
  activeItem?: string;
  setActiveItem?: (item: string) => void;
  isCompact: boolean;
  setIsCompact: (compact: boolean) => void;
};

export const SidebarContext = React.createContext<SidebarContextProps | null>(null);
