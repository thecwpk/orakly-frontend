/**
 * Centralized devtools naming convention so every domain store shows up under
 * a single "orakly" namespace in Redux DevTools. Disable in production to keep
 * the prod bundle tree-shaken.
 */
const isDev =
  typeof process !== "undefined" && process.env.NODE_ENV !== "production";

export const DEVTOOLS_PREFIX = "orakly";

/** `dt("auth") → { name: "orakly/auth", enabled: <dev> }` */
export function devtoolsConfig(name: string) {
  return {
    name: `${DEVTOOLS_PREFIX}/${name}`,
    enabled: isDev,
  } as const;
}
