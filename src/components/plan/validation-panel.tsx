import { Text, Group, Stack, Alert } from "@mantine/core";
import { AlertTriangle, XCircle, Info } from "lucide-react";
import { formatTime } from "@/lib/utils";
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
      <Alert color="green" title="Validation" radius="md">
        No validation issues found.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Group>
        <AlertTriangle size={16} />
        <Text fw={600} size="sm">
          Validation ({issues.length})
        </Text>
      </Group>
      {Object.entries(grouped).map(([tsIndexStr, groupIssues]) => {
        const tsIndex = parseInt(tsIndexStr);
        const ts = timestamps[tsIndex];
        return (
          <Stack key={tsIndex} gap={4}>
            <Text size="xs" fw={500} c="dimmed">
              {formatTime(ts?.time ?? 0)} - {ts?.label ?? "Unknown"}
            </Text>
            {groupIssues.map((issue, i) => (
              <Alert
                key={i}
                icon={issue.severity === "ERROR" ? <XCircle size={14} /> : <Info size={14} />}
                color={issue.severity === "ERROR" ? "red" : "yellow"}
                radius="md"
                styles={{ body: { padding: "8px 12px" } }}
              >
                <Stack gap={2}>
                  <Text size="xs" fw={500}>
                    {issue.character?.label ?? "Unknown"} - {issue.ability?.name ?? ""}
                  </Text>
                  <Text size="xs">{issue.message}</Text>
                </Stack>
              </Alert>
            ))}
          </Stack>
        );
      })}
    </Stack>
  );
}
