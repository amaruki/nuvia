/**
 * Consistent styling and UI patterns for event components
 */

// Event status colors
export const eventStatusColors = {
  draft: "bg-gray-100 text-foreground/80",
  published: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

// Event type colors
export const eventTypeColors = {
  workshop: "bg-indigo-100 text-indigo-800",
  meetup: "bg-blue-100 text-blue-800",
  conference: "bg-purple-100 text-purple-800",
  webinar: "bg-teal-100 text-teal-800",
  social: "bg-pink-100 text-pink-800",
  training: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-foreground/80",
};

// Registration status colors
export const registrationStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  waitlisted: "bg-blue-100 text-blue-800",
  checked_in: "bg-purple-100 text-purple-800",
};

// Common spacing values
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
};

// Common border radius values
export const borderRadius = {
  sm: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  full: "9999px",
};

// Common shadow values
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

// Common transition values
export const transitions = {
  fast: "150ms ease-in-out",
  normal: "300ms ease-in-out",
  slow: "500ms ease-in-out",
};

// Common breakpoints
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Common z-index values
export const zIndex = {
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
};

// Helper functions for consistent styling
export const getEventStatusColor = (status: string) => {
  return eventStatusColors[status as keyof typeof eventStatusColors] || eventStatusColors.draft;
};

export const getEventTypeColor = (type: string) => {
  return eventTypeColors[type as keyof typeof eventTypeColors] || eventTypeColors.other;
};

export const getRegistrationStatusColor = (status: string) => {
  return (
    registrationStatusColors[status as keyof typeof registrationStatusColors] ||
    registrationStatusColors.pending
  );
};

// Common CSS classes
export const cssClasses = {
  card: `rounded-lg border border-gray-200 bg-white shadow-sm ${transitions.normal} hover:shadow-md`,
  button: `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background`,
  input: `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`,
  badge: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`,
  container: `container mx-auto px-4 sm:px-6 lg:px-8`,
  section: `py-12 md:py-16 lg:py-20`,
  heading: `text-2xl font-bold tracking-tight lg:text-3xl`,
  subheading: `text-lg font-semibold text-foreground/90`,
  description: `text-foreground/70 mt-2`,
  link: `text-primary hover:underline underline-offset-4`,
  iconButton: `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 w-10`,
  divider: `my-6 border-t border-gray-200`,
  spinner: `animate-spin rounded-full border-2 border-gray-300 border-t-blue-500`,
  alert: `relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground`,
  alertSuccess: `border-green-200 bg-green-50 text-green-800 [&>svg]:text-green-500`,
  alertError: `border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-500`,
  alertWarning: `border-yellow-200 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-500`,
  alertInfo: `border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-500`,
};

// Responsive utility classes
export const responsive = {
  flexCol: `flex flex-col`,
  flexRow: `flex flex-row`,
  flexColSm: `flex flex-col sm:flex-row`,
  flexColMd: `flex flex-col md:flex-row`,
  flexColLg: `flex flex-col lg:flex-row`,
  textCenter: `text-center`,
  textLeft: `text-left`,
  textRight: `text-right`,
  textCenterSm: `text-left sm:text-center`,
  textCenterMd: `text-left md:text-center`,
  textCenterLg: `text-left lg:text-center`,
  justifyCenter: `justify-center`,
  justifyBetween: `justify-between`,
  justifyAround: `justify-around`,
  itemsCenter: `items-center`,
  itemsStart: `items-start`,
  itemsEnd: `items-end`,
  gapSm: `gap-sm`,
  gapMd: `gap-md`,
  gapLg: `gap-lg`,
  wFull: `w-full`,
  wAuto: `w-auto`,
  wFullSm: `w-full sm:w-auto`,
  wFullMd: `w-full md:w-auto`,
  wFullLg: `w-full lg:w-auto`,
  hFull: `h-full`,
  hAuto: `h-auto`,
  pSm: `p-sm`,
  pMd: `p-md`,
  pLg: `p-lg`,
  mSm: `m-sm`,
  mMd: `m-md`,
  mLg: `m-lg`,
  mtSm: `mt-sm`,
  mtMd: `mt-md`,
  mtLg: `mt-lg`,
  mbSm: `mb-sm`,
  mbMd: `mb-md`,
  mbLg: `mb-lg`,
  mlSm: `ml-sm`,
  mlMd: `ml-md`,
  mlLg: `ml-lg`,
  mrSm: `mr-sm`,
  mrMd: `mr-md`,
  mrLg: `mr-lg`,
  mxSm: `mx-sm`,
  mxMd: `mx-md`,
  mxLg: `mx-lg`,
  mySm: `my-sm`,
  myMd: `my-md`,
  myLg: `my-lg`,
};
