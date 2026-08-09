/**
 * UI-16: Form UX and layout standard.
 *
 * The plan (docs/planning/03-frontend-improvement-plan.md, UI-16) requires
 * every submitting form to use React Hook Form + zodResolver with its schema
 * in lib/validation/, and to surface errors through the shadcn FormMessage
 * wiring instead of hand-written <p> tags that screen readers cannot
 * associate with the field.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (p: string) => Bun.file(join(root, p)).text();

const budgetForm = await read("src/components/finance/budget-form.tsx");
const financeValidation = await read("src/lib/validation/finance.validation.ts");
const registrationForm = await read("src/components/events/event-registration-form.tsx");
const applyForm = await read("src/app/(public)/jobs/[id]/_components/apply-form.tsx");
const basicInfo = await read("src/app/dashboard/events/create/_components/basic-info-section.tsx");
const locationSection = await read(
  "src/app/dashboard/events/create/_components/location-section.tsx",
);

describe("budget category form adopts the form standard", () => {
  test("finance validation exports a budget category schema", () => {
    expect(financeValidation).toMatch(/export const budgetCategorySchema\s*=/);
  });

  test("form uses RHF with zodResolver and the schema", () => {
    expect(budgetForm).toContain("useForm");
    expect(budgetForm).toContain("zodResolver");
    expect(budgetForm).toContain("budgetCategorySchema");
  });

  test("fields render through the shadcn form wrapper", () => {
    expect(budgetForm).toContain("FormField");
    expect(budgetForm).toContain("FormItem");
    expect(budgetForm).toContain("FormLabel");
    expect(budgetForm).toContain("FormControl");
    expect(budgetForm).toContain("FormMessage");
  });

  test("subcategories use a field array, not loose state", () => {
    expect(budgetForm).toContain("useFieldArray");
  });

  test("color picker keeps raw grays out of the tree", () => {
    expect(budgetForm).not.toMatch(/border-gray-\d/);
  });
});

describe("event registration form surfaces errors through FormMessage", () => {
  test("fields are wrapped for ARIA association", () => {
    expect(registrationForm).toContain("FormField");
    expect(registrationForm).toContain("FormItem");
    expect(registrationForm).toContain("FormControl");
    expect(registrationForm).toContain("FormMessage");
  });

  test("no hand-written error paragraphs", () => {
    expect(registrationForm).not.toMatch(/text-destructive">\{errors\./);
  });
});

describe("job application form adopts the form standard", () => {
  test("schema lives in lib/validation", () => {
    expect(existsSync(join(root, "src/lib/validation/job.validation.ts"))).toBe(true);
  });

  test("form uses RHF with zodResolver", () => {
    expect(applyForm).toContain("useForm");
    expect(applyForm).toContain("zodResolver");
    expect(applyForm).toContain("jobApplicationSchema");
    expect(applyForm).toContain("FormMessage");
  });

  test("copy stays em-dash free", () => {
    expect(applyForm).not.toContain("\u2014");
  });
});

describe("event create page uses shadcn controls", () => {
  test("category and type pickers use the Select component", () => {
    expect(basicInfo).not.toMatch(/^\s*<select/m);
    expect(basicInfo).toContain("SelectTrigger");
    expect(basicInfo).toContain("SelectItem");
  });

  test("venue mode uses the Checkbox component", () => {
    expect(locationSection).not.toContain('type="checkbox"');
    expect(locationSection).toContain('from "@/components/ui/checkbox"');
  });
});

describe("job application schema exists", () => {
  test("job.validation.ts exports jobApplicationSchema", async () => {
    const schema = await read("src/lib/validation/job.validation.ts");
    expect(schema).toMatch(/export const jobApplicationSchema\s*=/);
  });
});

describe("job posting form adopts the form standard", () => {
  const jobFormIndex = "src/app/dashboard/jobs/_components/job-form/index.tsx";

  test("job.validation.ts exports a posting schema", async () => {
    const schema = await read("src/lib/validation/job.validation.ts");
    expect(schema).toMatch(/export const jobPostingSchema\s*=/);
  });

  test("the form provider wraps sections in FormField wiring", async () => {
    const src = await read(jobFormIndex);
    expect(src).toContain("useForm");
    expect(src).toContain("zodResolver");
    expect(src).toContain("jobPostingSchema");
    expect(src).not.toMatch(/useState<JobFormState>/);
  });

  test("sections render through the shared Form provider", async () => {
    const sections = [
      "basic-info-section.tsx",
      "classification-section.tsx",
      "description-section.tsx",
      "salary-section.tsx",
      "settings-section.tsx",
      "status-section.tsx",
    ];
    for (const section of sections) {
      const src = await read(`src/app/dashboard/jobs/_components/job-form/${section}`);
      expect(src).toContain("FormField");
      expect(src).toContain("FormMessage");
      expect(src).not.toContain("<select");
    }
  });
});

describe("forum forms adopt the form standard", () => {
  test("forum.validation.ts exports post, comment and report schemas", async () => {
    const schema = await read("src/lib/validation/forum.validation.ts");
    expect(schema).toMatch(/export const forumPostSchema\s*=/);
    expect(schema).toMatch(/export const forumCommentSchema\s*=/);
    expect(schema).toMatch(/export const forumReportSchema\s*=/);
  });

  test.each(["create-post-form.tsx", "comment-form.tsx", "report-button.tsx"])(
    "%s submits through RHF + zod + FormMessage",
    async (file) => {
      const src = await read(`src/app/(public)/forums/_components/${file}`);
      expect(src).toContain("useForm");
      expect(src).toContain("zodResolver");
      expect(src).toContain("FormMessage");
      expect(src).not.toContain("<select");
      expect(src).not.toMatch(/text-destructive">\{/);
    },
  );
});

describe("membership application dialog adopts the form standard", () => {
  test("organization validation exports the application schema", async () => {
    const schema = await read("src/lib/validation/organization.validation.ts");
    expect(schema).toMatch(/export const membershipApplicationSchema\s*=/);
  });

  test("the dialog submits through RHF + zod + FormMessage", async () => {
    const src = await read("src/app/(public)/membership/_components/apply-dialog.tsx");
    expect(src).toContain("useForm");
    expect(src).toContain("zodResolver");
    expect(src).toContain("FormMessage");
    expect(src).not.toMatch(/text-destructive">\{/);
  });
});

describe("learning settings form adopts the form standard", () => {
  test("learning.validation.ts exports the settings schema", async () => {
    const schema = await read("src/lib/validation/learning.validation.ts");
    expect(schema).toMatch(/export const learningSettingsSchema\s*=/);
  });

  test("the page submits through RHF + zod + FormMessage", async () => {
    const src = await read("src/app/dashboard/learning/settings/page.tsx");
    expect(src).toContain("useForm");
    expect(src).toContain("zodResolver");
    expect(src).toContain("FormMessage");
  });
});

describe("native select and checkbox controls are gone", () => {
  const files = [
    "src/app/dashboard/memberships/tiers/_components/tier-edit-dialog.tsx",
    "src/app/dashboard/profile/components/social-links-form/add-link-form.tsx",
    "src/components/content/media-upload/media-upload.tsx",
    "src/app/dashboard/content/media/_components/media-grid.tsx",
    "src/components/content/category-card.tsx",
    "src/components/finance/reports-table/index.tsx",
    "src/components/finance/reports-table/report-row.tsx",
    "src/app/(public)/events/[id]/edit/_components/location-section.tsx",
    "src/app/dashboard/events/[id]/edit/_components/location-section.tsx",
  ];

  test.each(files)("%s uses shadcn controls", async (file) => {
    const src = await read(file);
    expect(src).not.toContain("<select");
    expect(src).not.toContain('type="checkbox"');
  });
});
