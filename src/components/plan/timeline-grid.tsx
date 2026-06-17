"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import type { ValidationIssue, TimestampEntry } from "@/types";

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
  RAIDWIDE: "bg-orange-100 text-orange-800 border-orange-300",
  TANKBUSTER: "bg-red-100 text-red-800 border-red-300",
  STACK: "bg-blue-100 text-blue-800 border-blue-300",
  SPREAD: "bg-purple-100 text-purple-800 border-purple-300",
  KNOCKBACK: "bg-yellow-100 text-yellow-800 border-yellow-300",
  ADD_PHASE: "bg-gray-100 text-gray-800 border-gray-300",
  ENRAGE: "bg-rose-100 text-rose-800 border-rose-300",
  OTHER: "bg-zinc-100 text-zinc-800 border-zinc-300",
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
    MITIGATION: "bg-blue-500",
    HEALING: "bg-green-500",
    SHIELD: "bg-yellow-500",
    INVULN: "bg-red-500",
    PERSONAL: "bg-gray-500",
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

  const cellStyle = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-green-100 border-green-300";
      case "error":
        return "bg-red-100 border-red-300";
      case "warning":
        return "bg-yellow-100 border-yellow-300";
      default:
        return "bg-gray-50 border-gray-200 hover:bg-gray-100";
    }
  };

  const isDragging = dragSource !== null;

  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-2 py-2 text-left font-medium min-w-[60px] w-[60px]">
                Time
              </th>
              <th className="sticky left-[60px] z-10 bg-muted/50 px-2 py-2 text-left font-medium min-w-[130px] max-w-[150px]">
                Boss Ability
              </th>
              {characters.map((char) => (
                <th
                  key={char.id}
                  className="px-2 py-2 text-center font-medium min-w-[100px] max-w-[120px]"
                >
                  <div className="text-xs">{char.label}</div>
                  <div className="text-[10px] text-muted-foreground">{char.jobName}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timestamps.map((ts, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="sticky left-0 z-10 bg-background px-2 py-2 text-xs text-muted-foreground whitespace-nowrap w-[60px]">
                  {formatTime(ts.time)}
                </td>
                <td className="sticky left-[60px] z-10 bg-background px-2 py-2 min-w-[130px] max-w-[150px]">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-xs leading-tight font-medium">{ts.label}</div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "w-fit text-[10px] px-1 py-0",
                        eventTypeColors[ts.type] ?? eventTypeColors.OTHER,
                      )}
                    >
                      {ts.type}
                    </Badge>
                  </div>
                </td>
                {characters.map((char) => {
                  const event = char.events.find((e) => e.timestampIndex === i);
                  const ability = event
                    ? char.abilities.find((a) => a.id === event.abilityId)
                    : null;
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
                    <td
                      key={char.id}
                      className={cn(
                        "px-2 py-2 text-center border-l last:border-r transition-colors relative",
                        ability ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                        cellStyle(status),
                        isDragging && !ability && "bg-blue-50/40",
                      )}
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
                      {/* Duration vertical bar — full height when both start and covered are handled */}
                      {(isStart || isCovered) && barColor && (
                        <div
                          className={cn(
                            "absolute left-0 top-0 bottom-0 w-[3px]",
                            isCovered && !isStart ? "opacity-60" : "",
                          )}
                          style={{ backgroundColor: barColor }}
                        />
                      )}

                      {/* Top cap for start cells (rounded top) */}
                      {isStart && barColor && (
                        <div
                          className="absolute left-0 top-0 w-[3px] h-1.5 rounded-t"
                          style={{ backgroundColor: barColor }}
                        />
                      )}

                      {/* Cell content */}
                      {ability ? (
                        <div className="flex items-center justify-center gap-1 pl-1">
                          {ability.iconUrl && (
                            <img
                              src={ability.iconUrl}
                              alt={ability.name}
                              className="h-5 w-5 object-contain shrink-0"
                            />
                          )}
                          <span
                            className={cn(
                              "inline-block w-2 h-2 rounded-full shrink-0",
                              categoryColors[ability.category] ?? "bg-gray-500",
                            )}
                          />
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-xs truncate max-w-[50px] block">
                                {ability.name}
                              </span>
                            </TooltipTrigger>
                            {cellIssues.length > 0 && (
                              <TooltipContent>
                                {cellIssues.map((issue, j) => (
                                  <p key={j} className="text-xs max-w-[200px]">
                                    {issue.message}
                                  </p>
                                ))}
                              </TooltipContent>
                            )}
                          </Tooltip>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(char.id, i);
                            }}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : isCovered ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center justify-center h-full min-h-[32px] pl-1">
                              <div
                                className="h-2.5 w-2.5 rounded-full opacity-40"
                                style={{ backgroundColor: barColor ?? "#9ca3af" }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {coverage.ability.name} — placed at{" "}
                              {timestamps[coverage.startIndex]?.label ??
                                `row ${coverage.startIndex + 1}`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic pl-1">+</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AbilitySelectorDialog
        open={selectedCell !== null}
        onOpenChange={() => setSelectedCell(null)}
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
    </TooltipProvider>
  );
}

function AbilitySelectorDialog({
  open,
  onOpenChange,
  character,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSearch("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {character.label} ({character.jobName})
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search abilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm"
          />
        </div>

        <Tabs defaultValue={categories[0]} className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex flex-wrap h-auto shrink-0">
            {categories.map((cat) => {
              const count = filtered(cat).length;
              return (
                <TabsTrigger key={cat} value={cat} className="text-xs">
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  {!search && (
                    <span className="ml-1 text-muted-foreground">
                      ({character.abilities.filter((a) => a.category === cat).length})
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className="flex-1 overflow-y-auto min-h-0">
            {categories.map((cat) => (
              <TabsContent key={cat} value={cat} className="space-y-1">
                {filtered(cat).length === 0 ? (
                  <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                    No abilities match your search.
                  </p>
                ) : (
                  filtered(cat).map((ability) => (
                    <button
                      key={ability.id}
                      onClick={() => {
                        onSelect(ability.id);
                        setSearch("");
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        {ability.iconUrl && (
                          <img
                            src={ability.iconUrl}
                            alt={ability.name}
                            className="h-6 w-6 object-contain shrink-0"
                          />
                        )}
                        <span>{ability.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-8">
                        CD: {ability.cooldown}s
                        {ability.duration ? ` | Dur: ${ability.duration}s` : ""}
                        {ability.sharedSlot ? ` | Slot: ${ability.sharedSlot}` : ""}
                      </div>
                    </button>
                  ))
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
