"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const cellClass = "px-4 py-4 align-top";
const noteClass = "px-4 py-4 align-top text-sm text-muted-foreground";

function StateRow({ name, children }: { name: string; children: ReactNode }) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <th scope="row" className="px-4 py-4 text-left text-sm font-medium align-top">
        {name}
      </th>
      {children}
    </tr>
  );
}

function RoleSelect({
  label,
  disabled,
  invalid,
  describedBy,
}: {
  label: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <Select defaultValue="member">
      <SelectTrigger
        aria-label={label}
        aria-invalid={invalid ? "true" : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        className="w-44"
      >
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="member">Member</SelectItem>
        <SelectItem value="moderator">Moderator</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function StateMatrixDemo() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="px-4 pt-4 pb-1 text-left text-sm text-muted-foreground">
          State matrix for form primitives and Button. Focus is documented as a note instead of a
          fake instance: tab through any control to see the real focus-visible ring.
        </caption>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium">
              Component
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium">
              Default
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium">
              Disabled
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium">
              Error
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium">
              Pending
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium">
              Focus
            </th>
          </tr>
        </thead>
        <tbody>
          <StateRow name="Input">
            <td className={cellClass}>
              <Input aria-label="Default input" placeholder="name@chapter.org" className="w-44" />
            </td>
            <td className={cellClass}>
              <Input
                aria-label="Disabled input"
                placeholder="name@chapter.org"
                className="w-44"
                disabled
              />
            </td>
            <td className={cellClass}>
              <div className="space-y-1.5">
                <Input
                  aria-label="Input with error"
                  aria-invalid="true"
                  aria-describedby="matrix-input-error"
                  className="w-44"
                  defaultValue="not-an-email"
                />
                <p id="matrix-input-error" className="text-sm text-destructive">
                  Enter a valid email address.
                </p>
              </div>
            </td>
            <td className={noteClass}>Not applicable</td>
            <td className={noteClass}>
              Keyboard focus shows focus-visible:border-ring with a ring-ring/50 ring.
            </td>
          </StateRow>

          <StateRow name="Select">
            <td className={cellClass}>
              <RoleSelect label="Default select" />
            </td>
            <td className={cellClass}>
              <RoleSelect label="Disabled select" disabled />
            </td>
            <td className={cellClass}>
              <div className="space-y-1.5">
                <RoleSelect label="Select with error" invalid describedBy="matrix-select-error" />
                <p id="matrix-select-error" className="text-sm text-destructive">
                  Select a role.
                </p>
              </div>
            </td>
            <td className={noteClass}>Not applicable</td>
            <td className={noteClass}>
              The trigger gets the same focus-visible ring. Open it with Space or Enter.
            </td>
          </StateRow>

          <StateRow name="Textarea">
            <td className={cellClass}>
              <Textarea
                aria-label="Default textarea"
                placeholder="Tell us about yourself"
                className="w-44"
              />
            </td>
            <td className={cellClass}>
              <Textarea
                aria-label="Disabled textarea"
                placeholder="Tell us about yourself"
                className="w-44"
                disabled
              />
            </td>
            <td className={cellClass}>
              <div className="space-y-1.5">
                <Textarea
                  aria-label="Textarea with error"
                  aria-invalid="true"
                  aria-describedby="matrix-textarea-error"
                  className="w-44"
                  defaultValue="This bio is far too long for the field limit."
                />
                <p id="matrix-textarea-error" className="text-sm text-destructive">
                  Bio must be at most 240 characters.
                </p>
              </div>
            </td>
            <td className={noteClass}>Not applicable</td>
            <td className={noteClass}>Same focus-visible ring as Input while typing.</td>
          </StateRow>

          <StateRow name="Checkbox">
            <td className={cellClass}>
              <Checkbox aria-label="Default checkbox" />
            </td>
            <td className={cellClass}>
              <Checkbox aria-label="Disabled checkbox" disabled defaultChecked />
            </td>
            <td className={cellClass}>
              <Checkbox aria-label="Checkbox with error" aria-invalid="true" />
            </td>
            <td className={noteClass}>Not applicable</td>
            <td className={noteClass}>
              Keyboard focus shows the ring-ring/50 ring. Space toggles the box.
            </td>
          </StateRow>

          <StateRow name="Switch">
            <td className={cellClass}>
              <Switch aria-label="Default switch" />
            </td>
            <td className={cellClass}>
              <Switch aria-label="Disabled switch" disabled defaultChecked />
            </td>
            <td className={cellClass}>
              <Switch aria-label="Switch with error" className="border-destructive" />
            </td>
            <td className={noteClass}>Not applicable</td>
            <td className={noteClass}>
              Keyboard focus shows the focus-visible ring. Space toggles the switch.
            </td>
          </StateRow>

          <StateRow name="Button">
            <td className={cellClass}>
              <Button>Save</Button>
            </td>
            <td className={cellClass}>
              <Button disabled>Save</Button>
            </td>
            <td className={cellClass}>
              <Button variant="destructive">Delete</Button>
            </td>
            <td className={cellClass}>
              <Button disabled aria-busy="true">
                <Loader2 aria-hidden="true" className="animate-spin" />
                Saving...
              </Button>
            </td>
            <td className={noteClass}>
              Keyboard focus shows focus-visible:border-ring with a ring-ring/50 ring.
            </td>
          </StateRow>
        </tbody>
      </table>
    </div>
  );
}
