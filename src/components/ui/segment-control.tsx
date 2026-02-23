"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentControl<T extends string>({
  value,
  options,
  onValueChange,
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  options: SegmentOption<T>[];
  onValueChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-lg border bg-muted p-0.5",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onValueChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
