"use client";

import { createContext, useContext } from "react";
import type { ContextType } from "./types";

const Context = createContext<ContextType>({} as ContextType);

export const useCalendar = () => useContext(Context);

export { Context };
