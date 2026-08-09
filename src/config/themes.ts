/**
 * Registry of user-selectable color themes.
 *
 * This list is the single extension point for themes. The ThemeProvider in
 * src/app/layout.tsx hands these ids to next-themes, which writes the active
 * one as the data-theme attribute on <html>. src/app/globals.css then scopes
 * each palette as a [data-theme="<id>"] block. Every picker (dashboard
 * preferences page, quick settings menu, toaster styling) reads from this
 * list, so adding a theme never touches those components.
 *
 * To add a theme:
 * 1. Add an entry below. The id becomes the data-theme attribute value.
 * 2. Add a palette block in src/app/globals.css that overrides
 *    every color and shadow token from the :root block. Theme-independent
 *    constants (--font-*, --radius, --spacing, --tracking-normal) stay inherited:
 *      :root[data-theme="ocean"], [data-theme="ocean"] { --background: ...; }
 * 3. If the theme is a dark palette, also append its selector to the
 *    @custom-variant dark line at the top of globals.css so dark: utilities
 *    resolve inside it.
 *
 * Selection is persisted to localStorage by next-themes (storageKey "theme"
 * in src/app/layout.tsx). Syncing the choice to a per-user preference row so
 * it follows the account across devices is a future step, not part of this
 * registry.
 */

export interface AppTheme {
  /** Value next-themes writes to the data-theme attribute on <html>. Unique. */
  id: string;
  /** Label shown in theme pickers. */
  label: string;
  /** True for dark palettes. Surfaces that only accept light or dark, such as
   *  sonner toasts, use this flag to map the active theme. */
  dark: boolean;
  /** Short description for pickers that show one. */
  description?: string;
}

export const APP_THEMES: AppTheme[] = [
  {
    id: "light",
    label: "Light",
    dark: false,
    description: "Clean and bright interface",
  },
  {
    id: "dark",
    label: "Dark",
    dark: true,
    description: "Easy on the eyes in low light",
  },
];

/** Theme ids for the next-themes `themes` prop. */
export const THEME_IDS: string[] = APP_THEMES.map((theme) => theme.id);

/** Fast light/dark switch surfaces (header toggle) flip between these two. */
export const PRIMARY_LIGHT_THEME_ID = APP_THEMES.find((theme) => !theme.dark)?.id ?? "light";
export const PRIMARY_DARK_THEME_ID = APP_THEMES.find((theme) => theme.dark)?.id ?? "dark";

/** Whether a theme id resolves to a dark palette. Unknown ids count as light. */
export function isDarkTheme(themeId: string | undefined): boolean {
  if (!themeId) return false;
  return APP_THEMES.find((theme) => theme.id === themeId)?.dark ?? false;
}
