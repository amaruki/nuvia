/**
 * Schema barrel. Import from "@/db/schema" everywhere — never reach into
 * an individual domain file directly, so the whole schema object is always
 * available for both `db.query.*` relational queries and the better-auth
 * drizzleAdapter (src/lib/auth.ts), which needs the complete schema map.
 */

export * from "./enums";
export * from "./organization";
export * from "./users";
export * from "./auth";
export * from "./membership";
export * from "./events";
export * from "./forum";
export * from "./content";
export * from "./jobs";
export * from "./committees";
export * from "./chapters";
export * from "./awards";
export * from "./relations";
