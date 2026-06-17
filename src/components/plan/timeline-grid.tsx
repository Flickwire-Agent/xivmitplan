"use client";

import { useState } from "react";
import {
  Table,
  Badge,
  Group,
  Text,
  Tooltip,
  Modal,
  Tabs,
  TextInput,
  ActionIcon,
  Stack,
  ScrollArea,
  Image,
  Box,
} from "@mantine/core";
import { X, Search } from "lucide-react";
import type { ValidationIssue, TimestampEntry } from "@/types";
import { formatTime } from "@/lib/utils";

type Ability = {
  id: string;
  name: string;
  cooldown: number;
  duration: number | null;
  category: string;
  sharedSlot: string | null;
  iconUrl?: string | null;
};

type Character = {
  id: string;
  jobId: string;
  jobName: string;
  label: string;
  slotIndex: number;
  abilities: Ability[];
  events: Array<{ id: string; timestampIndex: number; abilityId: string; note: string | null }>;
};

interface TimelineGridProps {
  characters: Character[];
  timestamps: TimestampEntry[];
  validation: ValidationIssue[];
  onAssign: (charId: string, timestampIndex: number, abilityId: string) => void;
  onRemove: (charId: string, timestampIndex: number) => void;
  onMoveAbility: (
    sourceCharId: string,
    sourceTimestampIndex: number,
    targetCharId: string,
    targetTimestampIndex: number,
    abilityId: string,
  ) => void;
}

const eventTypeColors: Record<string, string> = {
  RAID_DAMAGE: "red",
  TANK_DAMAGE: "orange",
  POSITIONING_REQUIRED: "yellow",
  AVOIDABLE_AOE: "green",
  DEBUFFS: "cyan",
  TARGETED_AOE: "sky",
  MECHANICS: "violet",
  OTHER: "gray",
};

export function TimelineGrid({
  characters,
  timestamps,
  validation,
  onAssign,
  onRemove,
  onMoveAbility,
}: TimelineGridProps) {
  const [selectedCell, setSelectedCell] = useState<{
    charId: string;
    timestampIndex: number;
  } | null>(null);

  const [dragSource, setDragSource] = useState<{
    charId: string;
    timestampIndex: number;
    abilityId: string;
  } | null>(null);

  const categoryColors: Record<string, string> = {
    MITIGATION: "blue",
    HEALING: "green",
    SHIELD: "yellow",
    INVULN: "red",
    PERSONAL: "gray",
  };

  const categoryBarColors: Record<string, string> = {
    MITIGATION: "#60a5fa",
    HEALING: "#4ade80",
    SHIELD: "#facc15",
    INVULN: "#f87171",
    PERSONAL: "#9ca3af",
  };

  function getDurationCoverage(): Map<
    string,
    Map<number, { ability: Ability; startIndex: number; endIndex: number }>
  > {
    const coverage = new Map<
      string,
      Map<number, { ability: Ability; startIndex: number; endIndex: number }>
    >();
    for (const char of characters) {
      const charCoverage = new Map<
        number,
        { ability: Ability; startIndex: number; endIndex: number }
      >();
      for (const event of char.events) {
        const ability = char.abilities.find((a) => a.id === event.abilityId);
        if (!ability || !ability.duration) continue;
        const startTime = timestamps[event.timestampIndex]?.time;
        if (startTime === undefined) continue;
        const endTime = startTime + ability.duration;
        const startIdx = event.timestampIndex;
        let endIdx = startIdx;
        for (let i = startIdx; i < timestamps.length; i++) {
          if (timestamps[i].time < endTime) {
            endIdx = i;
          } else {
            break;
          }
        }
        for (let i = startIdx; i <= endIdx; i++) {
          const existing = charCoverage.get(i);
          if (!existing || endIdx - startIdx > existing.endIndex - existing.startIndex) {
            charCoverage.set(i, { ability, startIndex: startIdx, endIndex: endIdx });
          }
        }
      }
      coverage.set(char.id, charCoverage);
    }
    return coverage;
  }

  const durationCoverage = getDurationCoverage();

  const getCellStatus = (charId: string, tsIndex: number) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return "empty";
    const event = char.events.find((e) => e.timestampIndex === tsIndex);
    if (!event) return "empty";
    const issue = validation.find(
      (v) => v.timestampIndex === tsIndex && v.character?.id === charId,
    );
    if (issue) return issue.type === "MISSING" ? "warning" : "error";
    return "assigned";
  };

  const cellBg = (status: string) => {
    switch (status) {
      case "assigned":
        return "var(--mantine-color-green-0)";
      case "error":
        return "var(--mantine-color-red-0)";
      case "warning":
        return "var(--mantine-color-yellow-0)";
      default:
        return "var(--mantine-color-gray-0)";
    }
  };

  const headers = (
    <Table.Thead>
      <Table.Tr>
        <Table.Th style={{ position: "sticky", left: 0, zIndex: 10, minWidth: 60, width: 60 }}>
          Time
        </Table.Th>
        <Table.Th
          style={{ position: "sticky", left: 60, zIndex: 10, minWidth: 130, maxWidth: 150 }}
        >
          Boss Ability
        </Table.Th>
        {characters.map((char) => (
          <Table.Th key={char.id} style={{ textAlign: "center", minWidth: 100, maxWidth: 120 }}>
            <Stack gap={0}>
              <Text size="xs">{char.label}</Text>
              <Text size="xs" c="dimmed">
                {char.jobName}
              </Text>
            </Stack>
          </Table.Th>
        ))}
      </Table.Tr>
    </Table.Thead>
  );

  const body = (
    <Table.Tbody>
      {timestamps.map((ts, i) => (
        <Table.Tr key={i}>
          <Table.Td
            style={{
              position: "sticky",
              left: 0,
              zIndex: 10,
              background: "var(--mantine-color-body)",
            }}
          >
            <Text size="xs" c="dimmed">
              {formatTime(ts.time)}
            </Text>
          </Table.Td>
          <Table.Td
            style={{
              position: "sticky",
              left: 60,
              zIndex: 10,
              background: "var(--mantine-color-body)",
            }}
          >
            <Stack gap={2}>
              <Text size="xs" fw={500}>
                {ts.label}
              </Text>
              <Badge
                variant="outline"
                size="xs"
                color={eventTypeColors[ts.type] ?? eventTypeColors.OTHER}
              >
                {ts.type}
              </Badge>
            </Stack>
          </Table.Td>
          {characters.map((char) => {
            const event = char.events.find((e) => e.timestampIndex === i);
            const ability = event ? char.abilities.find((a) => a.id === event.abilityId) : null;
            const status = getCellStatus(char.id, i);
            const cellIssues = validation.filter(
              (v) => v.timestampIndex === i && v.character?.id === char.id,
            );

            const charCoverage = durationCoverage.get(char.id);
            const coverage = charCoverage?.get(i);
            const isCovered = coverage && coverage.startIndex !== i;
            const isStart = coverage && coverage.startIndex === i;

            const barColor = ability
              ? (categoryBarColors[ability.category] ?? "#9ca3af")
              : coverage
                ? (categoryBarColors[coverage.ability.category] ?? "#9ca3af")
                : null;

            const handleDragStart = (e: React.DragEvent) => {
              if (!ability) return;
              e.dataTransfer.setData(
                "text/plain",
                JSON.stringify({ charId: char.id, timestampIndex: i, abilityId: ability.id }),
              );
              e.dataTransfer.effectAllowed = "move";
              setDragSource({ charId: char.id, timestampIndex: i, abilityId: ability.id });
            };

            const handleDragOver = (e: React.DragEvent) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            };

            const handleDrop = (e: React.DragEvent) => {
              e.preventDefault();
              if (!dragSource) return;
              if (dragSource.charId === char.id && dragSource.timestampIndex === i) return;

              onMoveAbility(
                dragSource.charId,
                dragSource.timestampIndex,
                char.id,
                i,
                dragSource.abilityId,
              );
              setDragSource(null);
            };

            const handleDragEnd = () => {
              setDragSource(null);
            };

            return (
              <Table.Td
                key={char.id}
                style={{
                  position: "relative",
                  background: ability ? undefined : cellBg(status),
                  cursor: ability ? "grab" : "pointer",
                  transition: "background 0.1s",
                  paddingLeft: 8,
                  paddingRight: 8,
                  textAlign: "center",
                }}
                onClick={() =>
                  setSelectedCell({
                    charId: char.id,
                    timestampIndex: i,
                  })
                }
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                draggable={!!ability}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {(isStart || isCovered) && barColor && (
                  <Box
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      backgroundColor: barColor,
                      opacity: isCovered && !isStart ? 0.6 : 1,
                    }}
                  />
                )}

                {isStart && barColor && (
                  <Box
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 3,
                      height: 6,
                      borderTopLeftRadius: 4,
                      backgroundColor: barColor,
                    }}
                  />
                )}

                {ability ? (
                  <Group justify="center" gap={4}>
                    {ability.iconUrl && (
                      <Image src={ability.iconUrl} alt={ability.name} h={20} w={20} fit="contain" />
                    )}
                    <Box
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: categoryColors[ability.category] ?? "#9ca3af",
                      }}
                    />
                    <Tooltip
                      label={
                        cellIssues.length > 0
                          ? cellIssues.map((issue) => issue.message).join("\n")
                          : ability.name
                      }
                      disabled={cellIssues.length === 0}
                    >
                      <Text
                        size="xs"
                        style={{
                          maxWidth: 50,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ability.name}
                      </Text>
                    </Tooltip>
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      color="gray"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(char.id, i);
                      }}
                    >
                      <X size={12} />
                    </ActionIcon>
                  </Group>
                ) : isCovered ? (
                  <Tooltip
                    label={`${coverage.ability.name} — placed at ${timestamps[coverage.startIndex]?.label ?? `row ${coverage.startIndex + 1}`}`}
                  >
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 32,
                      }}
                    >
                      <Box
                        style={{
                          height: 10,
                          width: 10,
                          borderRadius: "50%",
                          backgroundColor: barColor ?? "#9ca3af",
                          opacity: 0.4,
                        }}
                      />
                    </Box>
                  </Tooltip>
                ) : (
                  <Text size="xs" c="dimmed" fs="italic">
                    +
                  </Text>
                )}
              </Table.Td>
            );
          })}
        </Table.Tr>
      ))}
    </Table.Tbody>
  );

  return (
    <Box
      style={{
        overflowX: "auto",
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-gray-3)",
      }}
    >
      <Table striped withTableBorder={false}>
        {headers}
        {body}
      </Table>

      <AbilitySelectorDialog
        opened={selectedCell !== null}
        onClose={() => setSelectedCell(null)}
        character={
          selectedCell ? (characters.find((c) => c.id === selectedCell.charId) ?? null) : null
        }
        onSelect={(abilityId) => {
          if (selectedCell) {
            onAssign(selectedCell.charId, selectedCell.timestampIndex, abilityId);
            setSelectedCell(null);
          }
        }}
      />
    </Box>
  );
}

function AbilitySelectorDialog({
  opened,
  onClose,
  character,
  onSelect,
}: {
  opened: boolean;
  onClose: () => void;
  character: Character | null;
  onSelect: (abilityId: string) => void;
}) {
  const [search, setSearch] = useState("");

  if (!character) return null;

  const categories = Array.from(new Set(character.abilities.map((a) => a.category)));

  const filtered = (cat: string) =>
    character.abilities.filter(
      (a) => a.category === cat && (!search || a.name.toLowerCase().includes(search.toLowerCase())),
    );

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setSearch("");
        onClose();
      }}
      title={`${character.label} (${character.jobName})`}
      size="lg"
      styles={{ body: { maxHeight: "70vh", display: "flex", flexDirection: "column" } }}
    >
      <TextInput
        placeholder="Search abilities..."
        leftSection={<Search size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
      />

      <Tabs defaultValue={categories[0]} flex={1}>
        <Tabs.List style={{ flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <Tabs.Tab key={cat} value={cat}>
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
              {!search && (
                <Text component="span" size="xs" c="dimmed" ml={4}>
                  ({character.abilities.filter((a) => a.category === cat).length})
                </Text>
              )}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <ScrollArea.Autosize mah={400} mt="md">
          {categories.map((cat) => (
            <Tabs.Panel key={cat} value={cat}>
              {filtered(cat).length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No abilities match your search.
                </Text>
              ) : (
                <Stack gap={2}>
                  {filtered(cat).map((ability) => (
                    <Box
                      key={ability.id}
                      p="xs"
                      style={{ borderRadius: "var(--mantine-radius-sm)", cursor: "pointer" }}
                      onClick={() => {
                        onSelect(ability.id);
                        setSearch("");
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--mantine-color-gray-1)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <Group gap="sm">
                        {ability.iconUrl && (
                          <Image
                            src={ability.iconUrl}
                            alt={ability.name}
                            h={24}
                            w={24}
                            fit="contain"
                          />
                        )}
                        <Text fw={500}>{ability.name}</Text>
                      </Group>
                      <Text size="xs" c="dimmed" ml={32}>
                        CD: {ability.cooldown}s
                        {ability.duration ? ` | Dur: ${ability.duration}s` : ""}
                        {ability.sharedSlot ? ` | Slot: ${ability.sharedSlot}` : ""}
                      </Text>
                    </Box>
                  ))}
                </Stack>
              )}
            </Tabs.Panel>
          ))}
        </ScrollArea.Autosize>
      </Tabs>
    </Modal>
  );
}
