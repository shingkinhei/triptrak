"use client";
import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Trash2, PlusCircle, Plane, Train, BedDouble, UtensilsCrossed, Camera, Ticket, Mountain, Building } from "lucide-react";
import type { Activity, ActivityOptions } from "@/lib/types";

interface DayActivitiesProps {
  activities: Activity[];
  activityOptions: ActivityOptions[];
  onAddActivity: () => void;
  onDeleteActivity: (id: string) => void;
  onActivityChange: (id: string, field: keyof Activity, value: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Plane,
  Train,
  BedDouble,
  UtensilsCrossed,
  Camera,
  Ticket,
  Mountain,
  Building,
};

function getIconText(
  activityType: string,
  options: ActivityOptions[],
  fallback: string = "❓"
): string {
  const match = options.find((opt) => opt.activity_type === activityType);
  return match ? match.icon_text : fallback;
}

export const DayActivities = ({
  activities,
  activityOptions,
  onAddActivity,
  onDeleteActivity,
  onActivityChange,
}: DayActivitiesProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activities</h3>
        <Button variant="ghost" size="sm" onClick={onAddActivity}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      </div>
      <div className="space-y-4">
        {activities.map((act) => (
          <div
            key={act.activity_uuid}
            className="flex items-center gap-2 p-2 border rounded-lg"
          >
            <div className="grid gap-2 flex-grow">
              <div className="flex items-center gap-2">
                <Select
                  value={act.activity_type}
                  onValueChange={(val) =>
                    onActivityChange(act.activity_uuid, "activity_type", val)
                  }
                >
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue>
                      {(() => {
                        const iconName = getIconText(
                          act.activity_type,
                          activityOptions
                        );
                        const IconComponent = iconMap[iconName];
                        return IconComponent ? (
                          <IconComponent className="h-4 w-4" />
                        ) : null;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="shadow-lg">
                    {activityOptions.map((opt) => (
                      <SelectItem
                        key={opt.icon_text}
                        value={opt.activity_type}
                      >
                        <div className="flex items-center gap-2">
                          {(() => {
                            const IconComponent = iconMap[opt.icon_text];
                            return IconComponent ? (
                              <IconComponent className="h-4 w-4" />
                            ) : null;
                          })()}
                          <span>{opt.activity_type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  value={act.time}
                  onChange={(e) =>
                    onActivityChange(act.activity_uuid, "time", e.target.value)
                  }
                  className="w-24 h-8"
                />
              </div>
              <Input
                value={act.name}
                onChange={(e) =>
                  onActivityChange(act.activity_uuid, "name", e.target.value)
                }
                placeholder="Name"
                className="h-8"
              />
              <Input
                value={act.description}
                onChange={(e) =>
                  onActivityChange(
                    act.activity_uuid,
                    "description",
                    e.target.value
                  )
                }
                placeholder="Description"
                className="h-8"
              />
              <Input
                value={act.address || ""}
                onChange={(e) =>
                  onActivityChange(act.activity_uuid, "address", e.target.value)
                }
                placeholder="Address"
                className="h-8"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDeleteActivity(act.activity_uuid)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};