"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Search, X, Filter, RotateCcw } from "lucide-react";
import { GatewayFilterOptions } from "@/types/finance.types";

interface GatewaysFiltersProps {
  filters: GatewayFilterOptions;
  onFiltersChange: (filters: Partial<GatewayFilterOptions>) => void;
  onClearFilters: () => void;
}

const PROVIDER_OPTIONS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "square", label: "Square" },
  { value: "adyen", label: "Adyen" },
  { value: "razorpay", label: "Razorpay" },
  { value: "mollie", label: "Mollie" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "testing", label: "Testing" },
  { value: "error", label: "Error" },
];

const ENVIRONMENT_OPTIONS = [
  { value: "production", label: "Production" },
  { value: "sandbox", label: "Sandbox" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
];

export function GatewaysFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: GatewaysFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = !!(
    filters.search ||
    filters.status?.length ||
    filters.provider?.length ||
    filters.environment?.length ||
    filters.currency?.length
  );

  const handleStatusChange = (value: string, checked: boolean) => {
    const currentStatus = filters.status || [];
    const newStatus = checked
      ? [...currentStatus, value]
      : currentStatus.filter((s) => s !== value);
    onFiltersChange({ status: newStatus });
  };

  const handleProviderChange = (value: string, checked: boolean) => {
    const currentProviders = filters.provider || [];
    const newProviders = checked
      ? [...currentProviders, value]
      : currentProviders.filter((p) => p !== value);
    onFiltersChange({ provider: newProviders });
  };

  const handleEnvironmentChange = (value: string, checked: boolean) => {
    const currentEnvironments = filters.environment || [];
    const newEnvironments = checked
      ? [...currentEnvironments, value]
      : currentEnvironments.filter((e) => e !== value);
    onFiltersChange({ environment: newEnvironments });
  };

  const handleCurrencyChange = (value: string, checked: boolean) => {
    const currentCurrencies = filters.currency || [];
    const newCurrencies = checked
      ? [...currentCurrencies, value]
      : currentCurrencies.filter((c) => c !== value);
    onFiltersChange({ currency: newCurrencies });
  };

  const clearFilter = (filterType: keyof GatewayFilterOptions) => {
    onFiltersChange({ [filterType]: undefined });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status?.length) count++;
    if (filters.provider?.length) count++;
    if (filters.environment?.length) count++;
    if (filters.currency?.length) count++;
    return count;
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Filters</CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    {getActiveFilterCount()} active
                  </Badge>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, provider, or description..."
                  value={filters.search || ""}
                  onChange={(e) => onFiltersChange({ search: e.target.value })}
                  className="pl-10"
                />
                {filters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => clearFilter("search")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Status Filter */}
              <div className="space-y-3">
                <Label>Status</Label>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={filters.status?.includes(option.value) || false}
                        onCheckedChange={(checked) =>
                          handleStatusChange(option.value, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`status-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {filters.status && filters.status.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter("status")}
                    className="text-xs"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear Status
                  </Button>
                )}
              </div>

              {/* Provider Filter */}
              <div className="space-y-3">
                <Label>Provider</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {PROVIDER_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`provider-${option.value}`}
                        checked={filters.provider?.includes(option.value) || false}
                        onCheckedChange={(checked) =>
                          handleProviderChange(option.value, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`provider-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {filters.provider && filters.provider.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter("provider")}
                    className="text-xs"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear Provider
                  </Button>
                )}
              </div>

              {/* Environment Filter */}
              <div className="space-y-3">
                <Label>Environment</Label>
                <div className="space-y-2">
                  {ENVIRONMENT_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`environment-${option.value}`}
                        checked={filters.environment?.includes(option.value) || false}
                        onCheckedChange={(checked) =>
                          handleEnvironmentChange(option.value, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`environment-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {filters.environment && filters.environment.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter("environment")}
                    className="text-xs"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear Environment
                  </Button>
                )}
              </div>
            </div>

            {/* Currency Filter */}
            <div className="space-y-3">
              <Label>Currencies</Label>
              <div className="flex flex-wrap gap-2">
                {CURRENCY_OPTIONS.map((option) => (
                  <Badge
                    key={option.value}
                    variant={filters.currency?.includes(option.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      handleCurrencyChange(option.value, !filters.currency?.includes(option.value))
                    }
                  >
                    {option.value}
                  </Badge>
                ))}
              </div>
              {filters.currency && filters.currency.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilter("currency")}
                  className="text-xs mt-2"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear Currencies
                </Button>
              )}
            </div>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <div className="flex justify-center pt-2 border-t">
                <Button variant="outline" onClick={onClearFilters} className="text-sm">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
