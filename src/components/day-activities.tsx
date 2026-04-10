"use client";
import React, { useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Trash2, PlusCircle, Plane, Train, BedDouble, UtensilsCrossed, Camera, Ticket, Mountain, Building, Edit } from "lucide-react";
import { Label } from "./ui/label";
import type { Activity, ActivityOptions } from "@/lib/types";

interface DayActivitiesProps {
  dayUuid: string;
  activities: Activity[];
  activityOptions: ActivityOptions[];
  onAddActivity: (activity: Activity) => void;
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
  dayUuid,
  activities,
  activityOptions,
  onAddActivity,
  onDeleteActivity,
  onActivityChange,
}: DayActivitiesProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [activityFormData, setActivityFormData] = useState<Partial<Activity>>({});

  // Sort activities by time
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      const timeA = a.time || "00:00";
      const timeB = b.time || "00:00";
      return timeA.localeCompare(timeB);
    });
  }, [activities]);

  const handleEditClick = (activity: Activity) => {
    setCurrentActivity(activity);
    setActivityFormData({ ...activity });
    setIsDialogOpen(true);
  };

  const handleAddClick = () => {
    setCurrentActivity(null);
    setActivityFormData({});
    setIsDialogOpen(true);
  };

  const handleCancelDialog = () => {
    setIsDialogOpen(false);
    setCurrentActivity(null);
    setActivityFormData({});
  };

  const handleSaveActivity = () => {
    if (!activityFormData.name?.trim()) {
      return;
    }

    if (currentActivity) {
      // Edit mode: update all fields
      onActivityChange(currentActivity.activity_uuid, "activity_type", activityFormData.activity_type || "Sightseeing");
      onActivityChange(currentActivity.activity_uuid, "time", activityFormData.time || "00:00");
      onActivityChange(currentActivity.activity_uuid, "name", activityFormData.name || "");
      onActivityChange(currentActivity.activity_uuid, "description", activityFormData.description || "");
      onActivityChange(currentActivity.activity_uuid, "address", activityFormData.address || "");
    } else {
      // Add mode: create new activity
      const newActivity: Activity = {
        activity_uuid: uuidv4(),
        day_uuid: dayUuid,
        name: activityFormData.name || "",
        time: activityFormData.time || "00:00",
        description: activityFormData.description || "",
        address: activityFormData.address || null,
        activity_type: activityFormData.activity_type || "Sightseeing",
      };
      onAddActivity(newActivity);
    }

    handleCancelDialog();
  };

  const handleDeleteActivity = () => {
    if (currentActivity) {
      onDeleteActivity(currentActivity.activity_uuid);
      handleCancelDialog();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activities</h3>
        <Button variant="ghost" size="sm" onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {/* Activity List - Compact View */}
      <div className="space-y-2">
        {sortedActivities.map((act) => {
          const iconName = getIconText(act.activity_type, activityOptions);
          const IconComponent = iconMap[iconName];

          return (
            <div
              key={act.activity_uuid}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card/50 hover:bg-card/70 transition-colors"
            >
              {IconComponent && (
                <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-grow min-w-0">
                <p className="text-sm font-semibold truncate">{act.name || "(No name)"}</p>
                <p className="text-xs text-muted-foreground">
                  {act.time} • {act.activity_type}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => handleEditClick(act)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Unified Add/Edit Dialog */}
      {isDialogOpen && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              handleCancelDialog();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {currentActivity ? "Edit Activity" : "Add New Activity"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="act-type">Activity Type</Label>
                <Select
                  value={activityFormData.activity_type || "Sightseeing"}
                  onValueChange={(val) =>
                    setActivityFormData({ ...activityFormData, activity_type: val })
                  }
                >
                  <SelectTrigger id="act-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityOptions.map((opt) => (
                      <SelectItem key={opt.icon_text} value={opt.activity_type}>
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="act-time">Time</Label>
                <Input
                  id="act-time"
                  type="time"
                  value={activityFormData.time || "00:00"}
                  onChange={(e) =>
                    setActivityFormData({ ...activityFormData, time: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="act-name">Activity Name *</Label>
                <Input
                  id="act-name"
                  value={activityFormData.name || ""}
                  onChange={(e) =>
                    setActivityFormData({ ...activityFormData, name: e.target.value })
                  }
                  placeholder="e.g. Visit Museum"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="act-desc">Description</Label>
                <Input
                  id="act-desc"
                  value={activityFormData.description || ""}
                  onChange={(e) =>
                    setActivityFormData({
                      ...activityFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Activity details"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="act-addr">Address</Label>
                <Input
                  id="act-addr"
                  value={activityFormData.address || ""}
                  onChange={(e) =>
                    setActivityFormData({
                      ...activityFormData,
                      address: e.target.value,
                    })
                  }
                  placeholder="Location"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:justify-between">
              <Button variant="outline" onClick={handleCancelDialog}>
                Cancel
              </Button>
              {currentActivity && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this activity. This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteActivity}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button onClick={handleSaveActivity} className="w-full">
                {currentActivity ? "Save Changes" : "Add Activity"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};