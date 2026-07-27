# Nuvia

An Association Management System (AMS): the software a professional
association or similar member organization runs to manage its members,
events, content, and communications. Single context, single Next.js
application — no `CONTEXT-MAP.md` split, because every module below
shares one `Organization` row and one permission model.

## Language

### Tenancy & Identity

**Organization**:
The single association a deployed instance of Nuvia serves — its
branding, locale, currency, and settings. Today this is always the one
singleton row (`id = "default"`); nothing in the domain model implies
more than one per deployment yet.
_Avoid_: Association, tenant. ("Association Management System" is the
product category name and stays; "association" as a name for this
specific entity is prose drift toward the code's actual term,
`Organization`, and should be corrected in docs over time, not treated as
a synonym to keep.)

**User**:
An authenticated person in the system: an account with credentials, a
`Role`, and optionally a `MembershipSubscription`. Distinct from
`Member` — every Member is a User, not every User is a Member (staff,
admins, and moderators are Users without necessarily holding a paid
membership).

**Role**:
The fixed vocabulary a User's access is checked against today: one of 14
predefined values (`superadmin`, `admin`, `staff`, `treasurer`,
`chapter_president`, `chapter_admin`, `committee_chair`, `organizer`,
`member_corporate`, `member_professional`, `member_student`, `member`,
`moderator`, `user`), or a `CustomRole` name. A User has exactly one
Role at a time.

**Permission**:
A `module:action` pair (for example `events:publish`) that a Role
resolves to. This is the vocabulary that server-side authorization
actually checks; Role is the assignable unit, Permission is the checked
unit.

**CustomRole**:
An organization-defined Role beyond the 14 predefined ones, with its own
resolved Permission set. Distinct from a predefined Role in that it is
data (a database row), not a fixed union member.

**Module**:
A bounded product area (Members, Events, Content, Forums, Jobs, Finance,
Awards, Learning, Chapters, Committees, Workspaces). Every Module has a
Maturity Tier that determines whether it is shown to a deployer at all.
_Avoid_: "domain" when the meaning is a Module — this repo already uses
"domain" loosely for both.

**Maturity Tier**:
One of four states a Module occupies: Mock (UI only, no real data),
Backed (real schema and API exist, coverage is incomplete), Tested
(coverage exists, docs do not), or Promoted (schema, API, authorization,
tests, and docs all exist — the only tier a Module ships enabled by
default in). A Module does not skip a tier.

### People & Membership

**Member**:
A User whose Role is one of the membership tiers (`member`,
`member_student`, `member_professional`, `member_corporate`). Note: this
is currently a fixed Role value, not the same thing as holding an active
`MembershipSubscription` to a `MembershipTier` — the two membership
concepts (a Role someone is assigned, and a paid subscription record)
exist separately in the schema today and are not yet reconciled. Flagging
this rather than picking one, since resolving it is a real modeling
decision, not a naming preference.

**MembershipTier**:
A purchasable tier an Organization defines (name, price, billing cycle,
features, benefits). Distinct from the Role values above — a
MembershipTier is configurable data an association sets up; a Role's
membership values are a fixed set baked into the codebase.

**MembershipSubscription**:
A User's subscription to a MembershipTier over a billing period, with a
status (active, trialing, canceled, past due, unpaid, paused). This is
the Finance Module's core record and is unwired today — no service code
queries it yet.

### Events Module

**Event**:
A scheduled activity an Organization holds (conference, meetup, workshop,
webinar, and similar formats), with a status (draft through completed),
a visibility (public through invite-only), and a format (in person,
virtual, hybrid).

**Registration**:
A User's signup for an Event, with its own status (pending, confirmed,
waitlisted, canceled, attended, no-show) independent of the Event's own
status.

### Content Module

**Content**:
A published piece of writing an Organization puts out (article, blog
post, page, news item, tutorial, or similar), with its own status and
visibility, independent of Event or Forum status vocab even though the
words overlap (draft/published/archived appears in more than one Module;
each Module's status enum is separate and not shared).

### Forums Module

**ForumPost**:
A top-level discussion item a User starts in a forum category
(discussion, question, announcement, poll, resource, job posting, or
event promotion).

**ForumComment**:
A reply to a ForumPost or to another ForumComment.

### Jobs Module

**JobPosting**:
A position a Company advertises through the Organization's job board,
with an employment type, experience level, and status.

**JobApplication**:
A User's application to a JobPosting, with its own status (pending
through hired/withdrawn), independent of the JobPosting's own status.
