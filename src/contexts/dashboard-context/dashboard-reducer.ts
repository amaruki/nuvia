import type { DashboardAction, DashboardState } from "./types";

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload,
      };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) =>
          notif.id === action.payload ? { ...notif, read: true } : notif,
        ),
      };

    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
      };

    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };

    case "SET_THEME":
      return {
        ...state,
        theme: action.payload,
      };

    case "SET_HEADER":
      return {
        ...state,
        header: action.payload,
      };

    case "CLEAR_HEADER":
      return {
        ...state,
        header: {},
      };

    default:
      return state;
  }
}

export const initialState: DashboardState = {
  notifications: [],
  sidebarCollapsed: false,
  theme: "system",
  header: {},
};
