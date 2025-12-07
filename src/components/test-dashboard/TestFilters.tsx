"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import {
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface TestFilterState {
  search: string;
  status: ("passed" | "failed" | "skipped" | "pending")[];
  suites: string[];
  confidence: "all" | "high" | "medium" | "low";
  flaky: boolean;
  selfHealed: boolean;
  needsReview: boolean;
  dateRange: "all" | "today" | "week" | "month";
}

interface TestFiltersProps {
  filters: TestFilterState;
  onFiltersChange: (filters: TestFilterState) => void;
  availableSuites?: string[];
  className?: string;
  compact?: boolean;
}

const defaultFilters: TestFilterState = {
  search: "",
  status: [],
  suites: [],
  confidence: "all",
  flaky: false,
  selfHealed: false,
  needsReview: false,
  dateRange: "all",
};

export function TestFilters({
  filters,
  onFiltersChange,
  availableSuites = [],
  className,
  compact = false,
}: TestFiltersProps) {
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.status.length +
    filters.suites.length +
    (filters.confidence !== "all" ? 1 : 0) +
    (filters.flaky ? 1 : 0) +
    (filters.selfHealed ? 1 : 0) +
    (filters.needsReview ? 1 : 0) +
    (filters.dateRange !== "all" ? 1 : 0);

  const handleStatusToggle = (status: "passed" | "failed" | "skipped" | "pending") => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleSuiteToggle = (suite: string) => {
    const newSuites = filters.suites.includes(suite)
      ? filters.suites.filter((s) => s !== suite)
      : [...filters.suites, suite];
    onFiltersChange({ ...filters, suites: newSuites });
  };

  const handleReset = () => {
    onFiltersChange(defaultFilters);
  };

  if (compact) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tests..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 h-9"
          />
        </div>

        {/* Status filter dropdown */}
        <Select
          value={filters.status.length === 1 ? filters.status[0] : "all"}
          onValueChange={(value) => {
            if (value === "all") {
              onFiltersChange({ ...filters, status: [] });
            } else {
              onFiltersChange({ ...filters, status: [value as any] });
            }
          }}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        {/* Quick filters */}
        <Button
          variant={filters.flaky ? "default" : "outline"}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, flaky: !filters.flaky })}
          className="h-9 gap-1"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Flaky
        </Button>

        <Button
          variant={filters.selfHealed ? "default" : "outline"}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, selfHealed: !filters.selfHealed })}
          className="h-9 gap-1"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Self-Healed
        </Button>

        <Button
          variant={filters.needsReview ? "default" : "outline"}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, needsReview: !filters.needsReview })}
          className="h-9 gap-1"
        >
          <Clock className="h-3.5 w-3.5" />
          Needs Review
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 gap-1">
            <X className="h-3.5 w-3.5" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("mac-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Tests
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount} active
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 gap-1">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by test name, file path..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.status.includes("passed") ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusToggle("passed")}
              className={cn(
                "gap-1",
                filters.status.includes("passed") && "bg-green-600 hover:bg-green-700"
              )}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Passed
            </Button>
            <Button
              variant={filters.status.includes("failed") ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusToggle("failed")}
              className={cn(
                "gap-1",
                filters.status.includes("failed") && "bg-red-600 hover:bg-red-700"
              )}
            >
              <XCircle className="h-3.5 w-3.5" />
              Failed
            </Button>
            <Button
              variant={filters.status.includes("skipped") ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusToggle("skipped")}
              className={cn(
                "gap-1",
                filters.status.includes("skipped") && "bg-yellow-600 hover:bg-yellow-700"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Skipped
            </Button>
            <Button
              variant={filters.status.includes("pending") ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusToggle("pending")}
              className={cn(
                "gap-1",
                filters.status.includes("pending") && "bg-blue-600 hover:bg-blue-700"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Pending
            </Button>
          </div>
        </div>

        {/* Confidence Level */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Confidence Level</Label>
          <Select
            value={filters.confidence}
            onValueChange={(value: TestFilterState["confidence"]) =>
              onFiltersChange({ ...filters, confidence: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Confidence</SelectItem>
              <SelectItem value="high">High (90%+)</SelectItem>
              <SelectItem value="medium">Medium (70-90%)</SelectItem>
              <SelectItem value="low">Low (&lt;70%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Date Range</Label>
          <Select
            value={filters.dateRange}
            onValueChange={(value: TestFilterState["dateRange"]) =>
              onFiltersChange({ ...filters, dateRange: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Special Filters */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Special Filters</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="flaky"
                checked={filters.flaky}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, flaky: checked === true })
                }
              />
              <label
                htmlFor="flaky"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                Flaky Tests Only
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selfHealed"
                checked={filters.selfHealed}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, selfHealed: checked === true })
                }
              />
              <label
                htmlFor="selfHealed"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                Self-Healed Tests
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="needsReview"
                checked={filters.needsReview}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, needsReview: checked === true })
                }
              />
              <label
                htmlFor="needsReview"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                Needs HITL Review
              </label>
            </div>
          </div>
        </div>

        {/* Test Suites */}
        {availableSuites.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Test Suites</Label>
            <div className="flex flex-wrap gap-2">
              {availableSuites.map((suite) => (
                <Button
                  key={suite}
                  variant={filters.suites.includes(suite) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSuiteToggle(suite)}
                  className="text-xs"
                >
                  {suite}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Presets */}
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs text-muted-foreground">Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  ...defaultFilters,
                  status: ["failed"],
                  dateRange: "week",
                })
              }
              className="text-xs"
            >
              Failed This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  ...defaultFilters,
                  flaky: true,
                })
              }
              className="text-xs"
            >
              All Flaky Tests
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  ...defaultFilters,
                  confidence: "low",
                  needsReview: true,
                })
              }
              className="text-xs"
            >
              Low Confidence
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  ...defaultFilters,
                  selfHealed: true,
                })
              }
              className="text-xs"
            >
              Recently Healed
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { defaultFilters };
