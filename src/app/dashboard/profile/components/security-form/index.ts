/**
 * Security form barrel.
 *
 * Keeps "@/app/dashboard/profile/components/security-form" resolving after
 * the old monolithic security-form.tsx was split into this directory:
 *
 *   - security-form.tsx              SecurityForm state, submit and composition
 *   - password-requirements-card.tsx live requirements checklist card
 *   - password-strength.ts           requirement checks + strength label/color helpers
 *   - types.ts                       shared SecurityFormProps
 *
 * The validation schema is the domain changePasswordSchema from
 * "@/lib/validation/auth.validation" (CODING_STANDARD §4.3), not a local copy.
 */
export { SecurityForm } from "./security-form";
