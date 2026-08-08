export const APP_ROUTE = {
  home: "home",
  location: "location",
  profile: "profile",
  report: "report",
  saved: "saved"
} as const;

export const NAVIGATION_TAB_IDS = [
  APP_ROUTE.home,
  APP_ROUTE.report,
  APP_ROUTE.saved,
  APP_ROUTE.profile
] as const;

export type AppRoute = (typeof APP_ROUTE)[keyof typeof APP_ROUTE];
export type NavigationTabId = (typeof NAVIGATION_TAB_IDS)[number];
