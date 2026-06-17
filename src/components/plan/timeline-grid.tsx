"use client";

import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Image,
  Modal,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { Search, X } from "lucide-react";
import type { TimestampEntry, ValidationIssue } from "@/types";
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
  events: Array<{
    id: string;
    timestampIndex: number;
    time: number;
    abilityId: string;
    note: string | null;
  }>;
};

interface TimelineGridProps {
  characters: Character[];
  timestamps: TimestampEntry[];
  validation: ValidationIssue[];
  onAssign: (charId: string, time: number, abilityId: string) => void;
  onRemove: (charId: string, eventId: string) => void;
  onMoveAbility: (
    sourceCharId: string,
    sourceEventId: string,
    targetCharId: string,
    targetTime: number,
    abilityId: string,
  ) => void;
}

const pixelsPerSecond = 4;
const columnWidth = 156;
const mechanicsWidth = 230;
const headerHeight = 58;

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

const categoryColors: Record<string, string> = {
  MITIGATION: "#60a5fa",
  HEALING: "#4ade80",
  SHIELD: "#facc15",
  INVULN: "#f87171",
  PERSONAL: "#9ca3af",
};

export function TimelineGrid({
  characters,
  timestamps,
  validation,
  onAssign,
  onRemove,
  onMoveAbility,
}: TimelineGridProps) {
  const [selectedPlacement, setSelectedPlacement] = useState<{
    charId: string;
    time: number;
  } | null>(null);
  const [dragSource, setDragSource] = useState<{
    charId: string;
    eventId: string;
    abilityId: string;
  } | null>(null);

  const lastTimestampTime = Math.max(...timestamps.map((ts) => ts.time), 0);
  const lastEventTime = Math.max(
    ...characters.flatMap((char) =>
      char.events.map((event) => {
        const ability = char.abilities.find((a) => a.id === event.abilityId);
        return event.time + (ability?.duration ?? 0);
      }),
    ),
    0,
  );
  const totalSeconds = Math.max(300, lastTimestampTime, lastEventTime) + 20;
  const chartHeight = totalSeconds * pixelsPerSecond;
  const tickSeconds = Array.from({ length: Math.floor(totalSeconds / 30) + 1 }, (_, i) => i * 30);

  const timeFromPointer = (event: React.PointerEvent | React.DragEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.round((event.clientY - rect.top) / pixelsPerSecond));
  };

  const openSelector = (charId: string, time: number) => {
    setSelectedPlacement({ charId, time });
  };

  return (
    <Box
      style={{
        border: "1px solid var(--mantine-color-gray-3)",
        borderRadius: "var(--mantine-radius-md)",
        overflow: "auto",
        maxHeight: "72vh",
        background: "var(--mantine-color-body)",
      }}
    >
      <Box style={{ display: "flex", minWidth: mechanicsWidth + characters.length * columnWidth }}>
        <Box
          style={{
            position: "sticky",
            left: 0,
            zIndex: 20,
            width: mechanicsWidth,
            minWidth: mechanicsWidth,
            background: "var(--mantine-color-body)",
            borderRight: "1px solid var(--mantine-color-gray-3)",
          }}
        >
          <Box
            style={{
              position: "sticky",
              top: 0,
              zIndex: 30,
              height: headerHeight,
              padding: "10px 12px",
              background: "var(--mantine-color-body)",
              borderBottom: "1px solid var(--mantine-color-gray-3)",
            }}
          >
            <Text fw={700} size="sm">
              Fight Timeline
            </Text>
            <Text size="xs" c="dimmed">
              Boss abilities and mechanics
            </Text>
          </Box>

          <Box style={{ position: "relative", height: chartHeight }}>
            {tickSeconds.map((time) => (
              <Text
                key={time}
                size="xs"
                c="dimmed"
                style={{
                  position: "absolute",
                  top: time * pixelsPerSecond - 8,
                  left: 8,
                  width: 42,
                  textAlign: "right",
                }}
              >
                {formatTime(time)}
              </Text>
            ))}

            {timestamps.map((timestamp, index) => (
              <Box
                key={`${timestamp.time}-${index}`}
                style={{
                  position: "absolute",
                  top: timestamp.time * pixelsPerSecond - 15,
                  left: 58,
                  right: 10,
                  padding: "5px 7px",
                  borderRadius: "var(--mantine-radius-sm)",
                  background: "var(--mantine-color-gray-0)",
                  border: "1px solid var(--mantine-color-gray-2)",
                }}
              >
                <Group gap={6} wrap="nowrap">
                  <Badge
                    size="xs"
                    variant="light"
                    color={eventTypeColors[timestamp.type] ?? eventTypeColors.OTHER}
                  >
                    {timestamp.type}
                  </Badge>
                  <Text size="xs" fw={600} truncate>
                    {timestamp.label}
                  </Text>
                </Group>
              </Box>
            ))}
          </Box>
        </Box>

        {characters.map((char) => (
          <CharacterColumn
            key={char.id}
            character={char}
            chartHeight={chartHeight}
            tickSeconds={tickSeconds}
            validation={validation}
            dragSource={dragSource}
            setDragSource={setDragSource}
            timeFromPointer={timeFromPointer}
            onOpenSelector={openSelector}
            onRemove={onRemove}
            onMoveAbility={onMoveAbility}
          />
        ))}
      </Box>

      <AbilitySelectorDialog
        opened={selectedPlacement !== null}
        onClose={() => setSelectedPlacement(null)}
        character={
          selectedPlacement
            ? (characters.find((c) => c.id === selectedPlacement.charId) ?? null)
            : null
        }
        onSelect={(abilityId) => {
          if (selectedPlacement) {
            onAssign(selectedPlacement.charId, selectedPlacement.time, abilityId);
            setSelectedPlacement(null);
          }
        }}
      />
    </Box>
  );
}

function CharacterColumn({
  character,
  chartHeight,
  tickSeconds,
  validation,
  dragSource,
  setDragSource,
  timeFromPointer,
  onOpenSelector,
  onRemove,
  onMoveAbility,
}: {
  character: Character;
  chartHeight: number;
  tickSeconds: number[];
  validation: ValidationIssue[];
  dragSource: { charId: string; eventId: string; abilityId: string } | null;
  setDragSource: (source: { charId: string; eventId: string; abilityId: string } | null) => void;
  timeFromPointer: (event: React.PointerEvent | React.DragEvent) => number;
  onOpenSelector: (charId: string, time: number) => void;
  onRemove: (charId: string, eventId: string) => void;
  onMoveAbility: (
    sourceCharId: string,
    sourceEventId: string,
    targetCharId: string,
    targetTime: number,
    abilityId: string,
  ) => void;
}) {
  return (
    <Box
      style={{
        width: columnWidth,
        minWidth: columnWidth,
        borderRight: "1px solid var(--mantine-color-gray-3)",
      }}
    >
      <Box
        style={{
          position: "sticky",
          top: 0,
          zIndex: 15,
          height: headerHeight,
          padding: "8px 10px",
          background: "var(--mantine-color-body)",
          borderBottom: "1px solid var(--mantine-color-gray-3)",
          textAlign: "center",
        }}
      >
        <Text size="sm" fw={700} truncate>
          {character.label}
        </Text>
        <Text size="xs" c="dimmed" truncate>
          {character.jobName}
        </Text>
      </Box>

      <Box
        onPointerDown={(event) => {
          if (event.button !== 0 || event.target !== event.currentTarget) return;
          onOpenSelector(character.id, timeFromPointer(event));
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (!dragSource) return;
          onMoveAbility(
            dragSource.charId,
            dragSource.eventId,
            character.id,
            timeFromPointer(event),
            dragSource.abilityId,
          );
          setDragSource(null);
        }}
        style={{
          position: "relative",
          height: chartHeight,
          cursor: "crosshair",
          backgroundImage:
            "linear-gradient(to bottom, var(--mantine-color-gray-2) 1px, transparent 1px)",
          backgroundSize: `100% ${30 * pixelsPerSecond}px`,
        }}
      >
        {tickSeconds.map((time) => (
          <Box
            key={time}
            style={{
              position: "absolute",
              top: time * pixelsPerSecond,
              left: 0,
              right: 0,
              height: 1,
              background: "var(--mantine-color-gray-2)",
            }}
          />
        ))}

        {character.events
          .slice()
          .sort((a, b) => a.time - b.time)
          .map((event) => {
            const ability = character.abilities.find((a) => a.id === event.abilityId);
            if (!ability) return null;
            const issues = validation.filter(
              (issue) =>
                issue.character?.id === character.id && Math.round(issue.time) === event.time,
            );
            const height = Math.max((ability.duration ?? 0) * pixelsPerSecond, 34);
            const color = categoryColors[ability.category] ?? "#9ca3af";

            return (
              <Tooltip
                key={event.id}
                label={
                  issues.length > 0
                    ? issues.map((issue) => issue.message).join("\n")
                    : `${ability.name} at ${formatTime(event.time)}${ability.duration ? ` for ${ability.duration}s` : ""}`
                }
                multiline
              >
                <Box
                  draggable
                  onClick={(pointerEvent) => pointerEvent.stopPropagation()}
                  onDragStart={(dragEvent) => {
                    dragEvent.dataTransfer.effectAllowed = "move";
                    dragEvent.dataTransfer.setData("text/plain", event.id);
                    setDragSource({
                      charId: character.id,
                      eventId: event.id,
                      abilityId: ability.id,
                    });
                  }}
                  onDragEnd={() => setDragSource(null)}
                  style={{
                    position: "absolute",
                    top: event.time * pixelsPerSecond,
                    left: 8,
                    right: 8,
                    minHeight: height,
                    padding: "6px 7px",
                    borderRadius: "var(--mantine-radius-sm)",
                    background: issues.length > 0 ? "var(--mantine-color-red-0)" : "white",
                    border: `1px solid ${issues.length > 0 ? "var(--mantine-color-red-5)" : color}`,
                    borderLeft: `5px solid ${color}`,
                    boxShadow: "var(--mantine-shadow-xs)",
                    cursor: "grab",
                    overflow: "hidden",
                  }}
                >
                  <Group gap={5} wrap="nowrap" align="flex-start">
                    {ability.iconUrl && (
                      <Image src={ability.iconUrl} alt={ability.name} h={20} w={20} fit="contain" />
                    )}
                    <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                      <Text size="xs" fw={700} truncate>
                        {ability.name}
                      </Text>
                      <Text size="10px" c="dimmed">
                        {formatTime(event.time)}
                      </Text>
                    </Stack>
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      color="gray"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onRemove(character.id, event.id);
                      }}
                    >
                      <X size={12} />
                    </ActionIcon>
                  </Group>
                </Box>
              </Tooltip>
            );
          })}
      </Box>
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
