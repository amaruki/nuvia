/**
 * Registration writes — self-register (status derivation + seat counters),
 * cancel (seat release + waitlist promotion), and admin check-in. Each
 * operation runs in a single transaction so `registeredCount` /
 * `waitlistCount` stay consistent with the registration rows.
 *
 * The implementations live one concern per file (mutations-create.ts,
 * mutations-cancel.ts, mutations-check-in.ts); this barrel keeps the
 * historical `./mutations` specifier resolving.
 */

export { createRegistration } from "./mutations-create";
export { cancelRegistration } from "./mutations-cancel";
export { checkInRegistration } from "./mutations-check-in";
export { approveRegistration } from "./mutations-approve";
export { markNoShowRegistration } from "./mutations-no-show";
