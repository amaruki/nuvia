import type { RoleCategoryGroup } from "./types";

export const ROLE_CATEGORY_GROUPS: RoleCategoryGroup[] = [
  {
    category: "administrative",
    title: "Administrative",
    roles: ["superadmin", "admin"],
  },
  {
    category: "leadership",
    title: "Leadership",
    roles: ["treasurer", "chapter_president", "chapter_admin", "committee_chair"],
  },
  { category: "staff", title: "Staff", roles: ["staff", "organizer", "moderator"] },
  {
    category: "membership",
    title: "Membership",
    roles: ["member_corporate", "member_professional", "member_student", "member", "user"],
  },
];
