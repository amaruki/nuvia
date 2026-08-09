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
