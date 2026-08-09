/**
 * Re-export shim — the UI-33 join-funnel service lives in
 * ./membership-join/. This file keeps the flat
 * `@/lib/services/membership-join.service` specifier resolving, matching
 * the subscription/payment service convention.
 */

export * from "./membership-join";
