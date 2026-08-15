import { SelectField, TextField } from "@/components/dashboard/form-sheet";

import { timezoneOptions } from "./options";

export function LocationSection() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          name="location.address"
          label="Street address"
          required
          placeholder="123 Main Street"
          autoComplete="off"
        />
        <TextField
          name="location.city"
          label="City"
          required
          placeholder="New York"
          autoComplete="off"
        />
        <TextField
          name="location.state"
          label="State/Province"
          required
          placeholder="NY"
          autoComplete="off"
        />
        <TextField
          name="location.country"
          label="Country"
          required
          placeholder="United States"
          autoComplete="off"
        />
        <TextField
          name="location.postalCode"
          label="Postal code"
          required
          placeholder="10001"
          autoComplete="off"
        />
        <TextField
          name="location.region"
          label="Region"
          required
          placeholder="Northeast"
          autoComplete="off"
        />
      </div>

      <SelectField
        name="location.timezone"
        label="Timezone"
        required
        placeholder="Select timezone"
        options={timezoneOptions}
      />
    </div>
  );
}
