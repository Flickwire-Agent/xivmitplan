import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { AlertTriangle, XCircle, Info } from "lucide-react";
import type { ValidationIssue, TimestampEntry } from "@/types";

interface ValidationPanelProps {
  issues: ValidationIssue[];
  timestamps: TimestampEntry[];
}

export function ValidationPanel({ issues, timestamps }: ValidationPanelProps) {
  const grouped = issues.reduce(
    (acc, issue) => {
      const key = issue.timestampIndex;
      if (!acc[key]) acc[key] = [];
      acc[key].push(issue);
      return acc;
    },
    {} as Record<number, ValidationIssue[]>,
  );

  if (issues.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
        No validation issues found.
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        Validation ({issues.length})
      </h3>
      {Object.entries(grouped).map(([tsIndexStr, groupIssues]) => {
        const tsIndex = parseInt(tsIndexStr);
        const ts = timestamps[tsIndex];
        return (
          <div key={tsIndex} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {formatTime(ts?.time ?? 0)} - {ts?.label ?? "Unknown"}
            </p>
            {groupIssues.map((issue, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-md p-2 text-xs",
                  issue.severity === "ERROR"
                    ? "bg-red-50 text-red-700"
                    : "bg-yellow-50 text-yellow-700",
                )}
              >
                {issue.severity === "ERROR" ? (
                  <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                ) : (
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-medium">
                    {issue.character?.label ?? "Unknown"} - {issue.ability?.name ?? ""}
                  </p>
                  <p>{issue.message}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
