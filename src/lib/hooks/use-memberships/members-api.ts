import { z } from "zod";

/** JSON shape of a member row served by GET /api/v1/members — mirrors the
 * member service's `MemberListItem` (dates arrive as ISO strings). */
const memberApiItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  name: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  // The API omits both fields when unset, so accept absence as well as null.
  image: z.string().nullish(),
  bio: z.string().nullish(),
  role: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  memberStatus: z.enum(["active", "trialing", "in_grace", "paused", "expired", "none"]),
  subscription: z
    .object({
      id: z.string(),
      status: z.string(),
      tierId: z.string().nullable(),
      tierName: z.string().nullable(),
      currentPeriodStart: z.string(),
      currentPeriodEnd: z.string().nullable(),
      cancelAtPeriodEnd: z.boolean(),
      createdAt: z.string(),
    })
    .nullable(),
});

export type MemberApiItem = z.infer<typeof memberApiItemSchema>;

const membersPageSchema = z.object({
  data: z.object({ members: z.array(memberApiItemSchema) }),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type MembersPage = z.infer<typeof membersPageSchema>;

const problemSchema = z.object({
  detail: z.string().optional(),
  title: z.string().optional(),
});

/** Fetch and validate one page of the member directory. */
export async function fetchMembersPage(query: URLSearchParams): Promise<MembersPage> {
  const response = await fetch(`/api/v1/members?${query.toString()}`);
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsedProblem = problemSchema.safeParse(body);
    const message =
      (parsedProblem.success && (parsedProblem.data.detail ?? parsedProblem.data.title)) ||
      "Failed to load members";
    throw new Error(message);
  }
  const parsedPage = membersPageSchema.safeParse(body);
  if (!parsedPage.success) {
    // Never leak raw zod issue dumps to the admin; the directory renders
    // whatever message this throws verbatim.
    throw new Error(
      "The user directory returned an unexpected response. Try again, or contact support if this persists.",
    );
  }
  return parsedPage.data;
}
