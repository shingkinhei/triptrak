"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ItineraryItem,
  Activity,
  TripDayPhotos,
  ChecklistItem,
  Trip,
} from "@/lib/types";
import {
  BedDouble,
  Camera,
  ChevronDown,
  Plane,
  Train,
  UtensilsCrossed,
  MoreVertical,
  PlusCircle,
  Trash2,
  Upload,
  X,
  type LucideIcon,
  Ticket,
  Mountain,
  Building,
  ArrowLeft,
  CheckCircle2,
  Edit,
  GripVertical,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { WeatherCard } from "./weather-card";
import { Textarea } from "./ui/textarea";
import { useRouter } from "next/navigation";
import { Checkbox } from "./ui/checkbox";
import { cn } from "@/lib/utils";
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
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Compressor from "compressorjs";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";

const iconMap: Record<string, LucideIcon> = {
  Plane,
  Train,
  BedDouble,
  UtensilsCrossed,
  Camera,
  Ticket,
  Mountain,
  Building,
};

interface TripPlannerProps {
  trip: Trip;
}

type EditableTripDayPhoto = TripDayPhotos;
// & {
//   trip_day_photo?: File | null;
//   trip_day_photo_preview?: string | null;
// }

type EditableItineraryItem = ItineraryItem & {
  cover_image_file?: File | null;
  cover_image_preview?: string | null;
  isNew?: boolean;
};

type ActivityOptions = {
  activity_type: string;
  icon_text: string;
  color_code: string;
  description: string;
};

function getIconText(
  activityType: string,
  options: ActivityOptions[],
  fallback: string = "❓" // default fallback icon
): string {
  const match = options.find((opt) => opt.activity_type === activityType);
  return match ? match.icon_text : fallback;
}

const formatMMDD = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
};
const timeToMinutes = (time?: string | null) => {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const t = time.toString().trim();
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return Number.MAX_SAFE_INTEGER;
  return hh * 60 + mm;
};

const PreTripChecklist = ({
  checklist: initialChecklist,
  tripId,
}: {
  checklist: ChecklistItem[];
  tripId: string;
}) => {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState("");
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    setChecklist(initialChecklist.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0)));
  }, [initialChecklist]);

  const handleCheckChange = async (item: ChecklistItem, checked: boolean) => {
    const originalState = [...checklist];
    setChecklist((prev) =>
      prev.map((i) =>
        i.checklist_uuid === item.checklist_uuid ? { ...i, checked } : i
      )
    );

    const { error } = await supabase
      .from("pre_trip_checklist")
      .update({ checked: checked })
      .eq("checklist_uuid", item.checklist_uuid);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update checklist item.",
        variant: "destructive",
      });
      setChecklist(originalState);
    }
  };


  const handleEditClick = () => {
    setEditingChecklist(
      [...checklist].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
    );
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    const originalChecklist = [...checklist];
    setChecklist(editingChecklist);
    setIsEditDialogOpen(false);

    const itemsToUpsert = editingChecklist.map((item, index) => ({
      ...item,
      seq: index,
    }));

    for (const item of itemsToUpsert) {
      const { checklist_uuid, trip_uuid, ...rest } = item;

      const { error } = await supabase
        .from("pre_trip_checklist")
        .update({
          ...rest,
          trip_uuid: tripId, // keep trip reference consistent
        })
        .eq("checklist_uuid", checklist_uuid); // WHERE clause

      if (error) {
        toast({
          title: "Error Updating Checklist",
          description: error.message,
          variant: "destructive",
        });
        setChecklist(originalChecklist);
        return;
      }
    }

    const deletedItems = originalChecklist.filter(
      (item) =>
        !editingChecklist.some((i) => i.checklist_uuid === item.checklist_uuid)
    );
    if (deletedItems.length > 0) {
      const { error: deleteError } = await supabase
        .from("pre_trip_checklist")
        .delete()
        .in(
          "checklist_uuid",
          deletedItems.map((i) => i.checklist_uuid)
        );
      if (deleteError)
        toast({
          title: "Error Deleting Items",
          description: deleteError.message,
          variant: "destructive",
        });
    }

    const { data, error: fetchError } = await supabase
      .from("pre_trip_checklist")
      .select("*")
      .eq("trip_uuid", tripId)
      .order("seq", { ascending: true });
    if (!fetchError && data) {
      setChecklist(data as ChecklistItem[]);
    } else {
      toast({
        title: "Error",
        description: "Failed to refresh checklist.",
        variant: "destructive",
      });
    }
  };

  const handleItemLabelChange = (id: string, label: string) => {
    setEditingChecklist((prev) =>
      prev.map((item) =>
        item.checklist_uuid === id ? { ...item, label } : item
      )
    );
  };



  const handleAddItem = async () => {
    if (newItemLabel.trim()) {
      // const maxId = (checkListIdCount ?? 0) + 1;
      const maxSeq = editingChecklist.reduce(
        (max, item) => Math.max(item.seq ?? 0, max),
        0
      );

      // Get current user from Supabase auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const newItem: ChecklistItem = {
        checklist_uuid: uuidv4(),
        // checklist_id: null,
        trip_uuid: tripId,
        label: newItemLabel.trim(),
        checked: false,
        seq: maxSeq + 1,
        created_at: new Date().toISOString(), // explicitly set timestamp
        user_id: user?.id ?? null, // set to current user
      };

      // Update local state
      setEditingChecklist((prev) => [...prev, newItem]);
      setNewItemLabel("");

      // Insert into Supabase
      const { error } = await supabase
        .from("pre_trip_checklist")
        .insert(newItem);

      if (error) {
        console.error("Error inserting checklist item:", error.message);
      }
    }
  };

  const handleDeleteItem = (id: string) => {
    setEditingChecklist((prev) =>
      prev.filter((item) => item.checklist_uuid !== id)
    );
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(editingChecklist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setEditingChecklist(items);
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-headline text-card-foreground">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Pre-Trip Checklist
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-card-foreground"
            onClick={handleEditClick}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit Checklist</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checklist.map((item) => (
            <div key={item.checklist_uuid} className="flex items-center gap-3">
              <Checkbox
                id={item.checklist_uuid}
                onCheckedChange={(checked) =>
                  handleCheckChange(item, !!checked)
                }
                checked={item.checked}
              />
              <Label
                htmlFor={item.checklist_uuid}
                className={cn(
                  "text-sm font-normal text-card-foreground transition-colors",
                  item.checked && "text-muted-foreground line-through"
                )}
              >
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit Pre-Trip Checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto py-4 pr-2">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="checklist">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {editingChecklist.map((item, index) => (
                      <Draggable
                        key={item.checklist_uuid}
                        draggableId={item.checklist_uuid}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-2 mb-2 p-2 bg-background rounded-md"
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab"
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <Input
                              value={item.label}
                              onChange={(e) =>
                                handleItemLabelChange(
                                  item.checklist_uuid,
                                  e.target.value
                                )
                              }
                              className="flex-grow"
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 shrink-0"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the item "
                                    {item.label}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteItem(item.checklist_uuid)
                                    }
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="flex items-center gap-2 pt-4 border-t">
              <Input
                placeholder="Add new item..."
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
              />
              <Button onClick={handleAddItem} className="shrink-0">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export function TripPlanner({ trip }: TripPlannerProps) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(trip.itinerary);
  const [tripState, setTripState] = useState<Trip>(trip);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(trip.checklist);
  const [editingItem, setEditingItem] = useState<EditableItineraryItem | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<string>("checklist");
  const [viewingPhoto, setViewingPhoto] = useState<TripDayPhotos | null>(null);
  const [activityOptions, setActivityOptions] = useState<ActivityOptions[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const dayCoverInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchChecklist = async () => {
      const { data, error } = await supabase
        .from("pre_trip_checklist")
        .select("*")
        .eq("trip_uuid", trip.trip_uuid)
        .order("seq", { ascending: true });
      if (error) {
        toast({
          title: "Error fetching checklist",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        setChecklist(data as ChecklistItem[]);
      }
    };
    const fetchActivityOptions = async () => {
      const { data, error } = await supabase
        .from("activities_option_setup")
        .select("activity_type, icon_text, color_code, description");
      if (error) {
        toast({
          title: "Error fetching statuses",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setActivityOptions(data as ActivityOptions[]);
      }
    };

    fetchChecklist();
    fetchActivityOptions();
    setItinerary(trip.itinerary);
  }, [trip, supabase, toast]);

  const handleEditClick = (item: ItineraryItem) => {
    setTimeout(() => {
      setEditingItem({
        ...item,
        activities: item.activities
          ? [...item.activities.map((a) => ({ ...a }))]
          : [],
        tripDayPhotos: item.tripDayPhotos
          ? [...item.tripDayPhotos.map((a) => ({ ...a }))]
          : [],
        cover_image_preview: item.cover_image_url,
      });
      setIsEditDialogOpen(true);
    }, 150);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "You must be logged in to save changes.",
        variant: "destructive",
      });
      return;
    }

    const itemToSave = { ...editingItem };
    const originalDay = itinerary.find(
      (d) => d.day_uuid === itemToSave.day_uuid
    );
    const oldImageUrl = originalDay?.cover_image_url;

    let newImageUrl: string | null = itemToSave.cover_image_url;

    if (
      (itemToSave.cover_image_file || newImageUrl === null) &&
      oldImageUrl &&
      oldImageUrl !== newImageUrl
    ) {
      const oldImageKey = oldImageUrl.split("/day_cover/").pop();
      if (oldImageKey) {
        await supabase.storage.from("day_cover").remove([oldImageKey]);
      }
    }

    if (itemToSave.cover_image_file) {
      const file = itemToSave.cover_image_file;
      const fileExt = (file.name.split(".").pop() || "jpg").replace(
        /[^a-z0-9]/gi,
        ""
      );
      const filePath = `${user.id}/${trip.trip_uuid}/${itemToSave.date}-${itemToSave.day_number}-${uuidv4()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("day_cover")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast({
          title: "Error uploading day cover",
          description: uploadError.message,
          variant: "destructive",
        });
        return;
      }

      const { data: urlData } = supabase.storage
        .from("day_cover")
        .getPublicUrl(filePath);
      newImageUrl = urlData.publicUrl;
    } else if (!itemToSave.cover_image_preview && oldImageUrl) {
      newImageUrl = null;
    }

    if (!originalDay) {
      // Insert new day record when adding a fresh day
      const dayInsertPayload = {
        day_uuid: itemToSave.day_uuid,
        trip_uuid: trip.trip_uuid,
        day_number: itemToSave.day_number,
        title: itemToSave.title,
        date: itemToSave.date,
        feedback: itemToSave.feedback,
        cover_image_hint: itemToSave.cover_image_hint,
        cover_image_url: newImageUrl,
        user_id: user.id,
      };

      const { data: insertedDay, error: insertErr } = await supabase
        .from("trip_days")
        .insert(dayInsertPayload)
        .select()
        .single();

      if (insertErr) {
        toast({ title: "Error adding day", description: insertErr.message, variant: "destructive" });
        return;
      }

      // Add to local itinerary view
      setItinerary((prev) =>
        [...prev, { ...(insertedDay as any), activities: itemToSave.activities || [], tripDayPhotos: [] } as ItineraryItem].sort(
          (a, b) => a.day_number - b.day_number
        )
      );
    } else {
      const dayUpdatePayload = {
        title: itemToSave.title,
        date: itemToSave.date,
        feedback: itemToSave.feedback,
        cover_image_hint: itemToSave.cover_image_hint,
        cover_image_url: newImageUrl,
      };

      const { error: dayError } = await supabase
        .from("trip_days")
        .update(dayUpdatePayload)
        .eq("day_uuid", itemToSave.day_uuid);

      if (dayError) {
        toast({
          title: "Error saving day",
          description: dayError.message,
          variant: "destructive",
        });
        return;
      }
    }

    const originalActivities = originalDay?.activities || [];

    const newActivities = itemToSave.activities.filter(
      (act) =>
        !originalActivities.some((oa) => oa.activity_uuid === act.activity_uuid)
    ); //.filter(act => act.activity_uuid.startsWith('act_'));
    const updatedActivities = itemToSave.activities.filter((act) => {
      const original = originalActivities.find(
        (oa) => oa.activity_uuid === act.activity_uuid
      );
      if (!original) return true; // new activity not in original list

      // Compare relevant fields
      return (
        act.time !== original.time ||
        act.description !== original.description ||
        act.activity_type !== original.activity_type ||
        act.address !== original.address
      );
    });

    const deletedActivities = originalActivities.filter(
      (oa) =>
        !itemToSave.activities.some(
          (ea) => ea.activity_uuid === oa.activity_uuid
        )
    );

    if (deletedActivities.length > 0) {
      const { error } = await supabase
        .from("activities")
        .delete()
        .in(
          "activity_uuid",
          deletedActivities.map((a) => a.activity_uuid)
        );
      if (error)
        toast({
          title: "Error Deleting Activities",
          description: error.message,
          variant: "destructive",
        });
    }

    if (updatedActivities.length > 0) {
      for (const act of updatedActivities) {
        const { error } = await supabase
          .from("activities")
          .update({
            time: act.time,
            description: act.description,
            activity_type: act.activity_type,
            address: act.address,
            day_uuid: itemToSave.day_uuid, // keep consistent day_uuid
          })
          .eq("activity_uuid", act.activity_uuid); // WHERE clause

        if (error) {
          toast({
            title: "Error Updating Activity",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    }

    if (newActivities.length > 0) {
      const { error } = await supabase
        .from("activities")
        .insert(
          newActivities.map((act) => ({
            day_uuid: itemToSave.day_uuid,
            time: act.time,
            description: act.description,
            address: act.address,
            activity_type: act.activity_type,
          }))
        );
      if (error)
        toast({
          title: "Error Adding New Activities",
          description: error.message,
          variant: "destructive",
        });
    }

    // Upload any pending (new) trip day photos that were added during editing

    try {
      const photos = (itemToSave.tripDayPhotos || []) as any[];

      // 1) Delete photos marked pending_delete
      const photosToDelete = photos.filter((p) => p.pending_delete && !p.trip_day_photo);
      if (photosToDelete.length > 0) {
        for (const dp of photosToDelete) {
          try {
            const url: string = dp.url || "";
            const key = url.split("/day_feedback/").pop();
            if (key) {
              const { error: delErr } = await supabase.storage.from("day_feedback").remove([key]);
              if (delErr) console.warn("Storage delete error", delErr.message);
            }
            const { error: dbErr } = await supabase.from("trip_photos").delete().eq("photo_uuid", dp.photo_uuid);
            if (dbErr) console.warn("DB delete error", dbErr.message);
          } catch (innerErr) {
            console.error("Error deleting photo", innerErr);
          }
        }
      }

      // 2) Upload new pending previews (trip_day_photo)
      const pendingPhotos = photos.filter((p) => !!p.trip_day_photo) as Array<any>;
      if (pendingPhotos.length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast({ title: "Not Authenticated", description: "You must be logged in to save changes.", variant: "destructive" });
          return;
        }

        // find current count after deletions
        const { data: existing } = await supabase.from("trip_photos").select("seq").eq("day_uuid", itemToSave.day_uuid);
        let startSeq = Array.isArray(existing) ? existing.length : 0;

        for (let i = 0; i < pendingPhotos.length; i++) {
          const p = pendingPhotos[i];
          const file: File = p.trip_day_photo as File;
          const fileExt = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "");
          const filePath = `${user.id}/${trip.trip_uuid}/${itemToSave.day_uuid}/${itemToSave.date}-${itemToSave.day_number}-${uuidv4}-${i + 1}.${fileExt}`;

          const { error: uploadError } = await supabase.storage.from("day_feedback").upload(filePath, file, { upsert: false });
          if (uploadError) {
            toast({ title: "Photo upload failed", description: uploadError.message, variant: "destructive" });
            continue;
          }

          const { data: urlData } = supabase.storage.from("day_feedback").getPublicUrl(filePath);
          const publicUrl = urlData.publicUrl;

          const photoRow = {
            photo_uuid: p.photo_uuid || uuidv4(),
            day_uuid: itemToSave.day_uuid,
            seq: startSeq,
            url: publicUrl,
            user_id: user.id,
          };

          const { error: insertError } = await supabase.from("trip_photos").insert(photoRow);
          if (insertError) {
            toast({ title: "DB insert failed", description: insertError.message, variant: "destructive" });
            console.log(insertError.message);
          } else {
            startSeq += 1;
          }
        }
      }

      // 3) Resequence remaining photos to be contiguous
      const { data: remainingPhotos } = await supabase.from("trip_photos").select("*").eq("day_uuid", itemToSave.day_uuid).order("seq", { ascending: true });
      if (Array.isArray(remainingPhotos)) {
        for (let idx = 0; idx < remainingPhotos.length; idx++) {
          const p = remainingPhotos[idx];
          if (p.seq !== idx) {
            await supabase.from("trip_photos").update({ seq: idx }).eq("photo_uuid", p.photo_uuid);
          }
        }
      }

      // 4) Refresh local photos
      const { data: freshPhotos } = await supabase.from("trip_photos").select("*").eq("day_uuid", itemToSave.day_uuid).order("seq", { ascending: true });
      if (freshPhotos) {
        setItinerary((prev) => prev.map((d) => (d.day_uuid === itemToSave.day_uuid ? ({ ...d, tripDayPhotos: freshPhotos } as ItineraryItem) : d)));
      }
    } catch (err: any) {
      console.error("Error processing photo changes", err);
      toast({ title: "Error", description: "One or more photo operations failed.", variant: "destructive" });
    }

    toast({
      title: "Day Saved!",
      description: `Changes to Day ${itemToSave.day_number} have been saved.`,
    });

    handleCancelEdit();

    const { data: refreshedDay, error: refreshError } = await supabase
      .from("trip_days")
      .select(`*, activities:activities (*), tripDayPhotos:trip_photos (*)`)
      .eq("day_uuid", itemToSave.day_uuid)
      .single();

    if (refreshError) {
      toast({
        title: "Error refreshing day",
        description: refreshError.message,
        variant: "destructive",
      });
      return;
    }

    if (refreshedDay) {
      // Sort activities
      const sortedActivities = Array.isArray(refreshedDay.activities)
        ? [...refreshedDay.activities].sort((a: any, b: any) => {
            const ma = timeToMinutes(a?.time ?? null);
            const mb = timeToMinutes(b?.time ?? null);
            if (ma === mb) return (a.activity_uuid || "").localeCompare(b.activity_uuid || "");
            return ma - mb;
          })
        : [];

      // Sort photos by seq
      const sortedPhotos = Array.isArray(refreshedDay.tripDayPhotos)
        ? [...refreshedDay.tripDayPhotos].sort(
            (a: any, b: any) => Number(a?.seq ?? 0) - Number(b?.seq ?? 0)
          )
        : [];

      // Update editing item
      setEditingItem(prev =>
        prev ? { ...prev, tripDayPhotos: sortedPhotos } : prev
      );

      // Update itinerary
      setItinerary(prev =>
        prev.map(item =>
          item.day_uuid === refreshedDay.day_uuid
            ? ({
                ...refreshedDay,
                activities: sortedActivities,
                tripDayPhotos: sortedPhotos,
              } as ItineraryItem)
            : item
        )
      );
    }

    // Ensure day_number sequencing and trip start/end dates are correct
    try {
      await resequenceAndUpdateTripDates(trip.trip_uuid);
    } catch (err) {
      console.warn("Resequence after save failed", err);
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleFieldChange = (
    field: keyof Omit<
      EditableItineraryItem,
      "activities" | "userPhotos" | "checklist"
    >,
    value: string | null
  ) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, [field]: value });
    }
  };

  const handleActivityChange = (
    actId: string,
    field: keyof Activity,
    value: string
  ) => {
    if (editingItem) {
      const updatedActivities = editingItem.activities.map((act) =>
        act.activity_uuid === actId ? { ...act, [field]: value } : act
      );
      setEditingItem({ ...editingItem, activities: updatedActivities });
    }
  };

  const handleAddActivity = () => {
    if (editingItem) {
      const newActivity: Activity = {
        activity_uuid: uuidv4(),
        day_uuid: editingItem.day_uuid,
        time: "00:00",
        description: "New Activity",
        address: null,
        activity_type: "Sightseeing",
      };
      setEditingItem({
        ...editingItem,
        activities: [...editingItem.activities, newActivity],
      });
    }
  };

  const handleDeleteActivity = (actId: string) => {
    if (editingItem) {
      const updatedActivities = editingItem.activities.filter(
        (act) => act.activity_uuid !== actId
      );
      setEditingItem({ ...editingItem, activities: updatedActivities });
    }
  };

  const handleDayCoverImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || !editingItem) return;
    const file = e.target.files[0];
    if (file) {
      new Compressor(file, {
        quality: 0.6,
        maxWidth: 1200,
        success: (compressedResult) => {
          setEditingItem((prev) =>
            prev
              ? { ...prev, cover_image_file: compressedResult as File }
              : null
          );
          const reader = new FileReader();
          reader.onloadend = () => {
            setEditingItem((prev) =>
              prev
                ? { ...prev, cover_image_preview: reader.result as string }
                : null
            );
          };
          reader.readAsDataURL(compressedResult);
        },
        error: (err) => {
          toast({
            title: "Image compression failed",
            description: err.message,
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleRemoveDayCoverImage = () => {
    if (editingItem) {
      setEditingItem((prev) =>
        prev
          ? {
              ...prev,
              cover_image_file: null,
              cover_image_preview: null,
              cover_image_url: null,
            }
          : null
      );
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !editingItem) return;

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "You must be logged in to upload photos.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Uploading photos",
      description: `Uploading ${files.length} file(s)...`,
      variant: "default",
    });

    const compressFile = (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        // @ts-ignore
        new Compressor(file, {
          quality: 0.6,
          maxWidth: 1200,
          success(result: Blob) {
            const ext = (file.name.split(".").pop() || "").toLowerCase();
            const mime = result.type || file.type || "image/jpeg";
            const name = `${editingItem.date}_${editingItem.day_number}_${uuidv4()}.${ext || (mime.split("/")[1] ?? "jpg")}`;
            const compressedFile = new File([result], name, { type: mime });
            resolve(compressedFile);
          },
          error(err: any) {
            reject(err);
          },
        });
      });
    };

    try {
      // Instead of uploading immediately, create compressed previews and attach them to editingItem
      const previews = await Promise.all(
        files.map(async (file, idx) => {
          const compressed = await compressFile(file);
          // create data URL preview
          const reader = new FileReader();
          const dataUrl: string = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(compressed);
          });

          return {
            photo_uuid: uuidv4(),
            day_uuid: editingItem.day_uuid,
            seq: (editingItem.tripDayPhotos?.length ?? 0) + idx,
            url: "",
            trip_day_photo: compressed,
            trip_day_photo_preview: dataUrl,
          } as any;
        })
      );

      setEditingItem((prev) =>
        prev
          ? {
              ...prev,
              tripDayPhotos: [...(prev.tripDayPhotos || []), ...previews],
            }
          : prev
      );
      // Also optimistically update itinerary view while editing
      setItinerary((prev) =>
        prev.map((d) =>
          d.day_uuid === editingItem.day_uuid
            ? ({
                ...d,
                tripDayPhotos: [...(d.tripDayPhotos || []), ...previews],
              } as ItineraryItem)
            : d
        )
      );

      toast({
        title: "Files ready",
        description: `${previews.length} photo(s) ready to save. Click Save Changes to upload.`,
        variant: "default",
      });
      if (photoInputRef.current) photoInputRef.current.value = "";
    } catch (err: any) {
      console.error("Preparing previews failed", err);
      toast({
        title: "Preview failed",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!editingItem) return;

    const photo = (editingItem.tripDayPhotos || []).find((p) => p.photo_uuid === photoId) as any;
    if (!photo) return;

    // If it's a pending (unsaved) photo (has trip_day_photo), just remove locally now
    if (photo.trip_day_photo) {
      setEditingItem((prev) =>
        prev
          ? { ...prev, tripDayPhotos: (prev.tripDayPhotos || []).filter((p) => p.photo_uuid !== photoId) }
          : prev
      );
      setItinerary((prev) =>
        prev.map((d) =>
          d.day_uuid === editingItem.day_uuid
            ? ({ ...d, tripDayPhotos: (d.tripDayPhotos || []).filter((p: any) => p.photo_uuid !== photoId) } as ItineraryItem)
            : d
        )
      );
      toast({ title: "Removed", description: "Photo removed from selection.", variant: "default" });
      return;
    }

    // For already-saved photos, toggle pending_delete flag (mark for deletion on Save)
    const isPending = !!photo.pending_delete;
    setEditingItem((prev) =>
      prev ? { ...prev, tripDayPhotos: (prev.tripDayPhotos || []).map((p: any) => (p.photo_uuid === photoId ? { ...p, pending_delete: !isPending } : p)) } : prev
    );
    setItinerary((prev) =>
      prev.map((d) =>
        d.day_uuid === editingItem.day_uuid
          ? ({ ...d, tripDayPhotos: (d.tripDayPhotos || []).map((p: any) => (p.photo_uuid === photoId ? { ...p, pending_delete: !isPending } : p)) } as ItineraryItem)
          : d
      )
    );

    toast({ title: isPending ? "Restore" : "Pending delete", description: isPending ? "Photo will no longer be deleted." : "Photo marked for deletion. Click Save Changes to apply.", variant: "default" });
  };

  const handleDeleteDay = async () => {
    if (!editingItem) return;

    const dayUuid = editingItem.day_uuid;

    try {
      const {
        data: photos,
        error: photosErr,
      } = await supabase.from("trip_photos").select("url,photo_uuid").eq("day_uuid", dayUuid);

      if (photosErr) {
        toast({ title: "Error", description: photosErr.message, variant: "destructive" });
      }

      // Remove storage objects for any photos that have been uploaded
      if (Array.isArray(photos) && photos.length > 0) {
        for (const p of photos) {
          try {
            const url = p.url || "";
            const key = url.split("/day_feedback/").pop();
            if (key) {
              const { error: delErr } = await supabase.storage.from("day_feedback").remove([key]);
              if (delErr) console.warn("Storage delete error", delErr.message);
            }
          } catch (inner) {
            console.warn("Error deleting storage object", inner);
          }
        }
      }

      // Delete DB rows: trip_photos, activities, then trip_days
      const { error: photosDeleteErr } = await supabase.from("trip_photos").delete().eq("day_uuid", dayUuid);
      if (photosDeleteErr) console.warn("Error deleting photo rows", photosDeleteErr.message);

      const { error: actDelErr } = await supabase.from("activities").delete().eq("day_uuid", dayUuid);
      if (actDelErr) console.warn("Error deleting activities", actDelErr.message);

      const { error: dayDelErr } = await supabase.from("trip_days").delete().eq("day_uuid", dayUuid);
      if (dayDelErr) {
        toast({ title: "Error deleting day", description: dayDelErr.message, variant: "destructive" });
        return;
      }

      // Update local UI
      const newItinerary = itinerary.filter((d) => d.day_uuid !== dayUuid);
      setItinerary(newItinerary);
      setIsEditDialogOpen(false);
      setEditingItem(null);

      // Choose next active view: first available day or checklist
      if (newItinerary.length > 0) {
        setActiveView(`day-${newItinerary[0].day_number}`);
      } else {
        setActiveView("checklist");
      }

      toast({ title: "Day deleted", description: `Day ${editingItem.day_number} removed.` });
      // Resequence remaining days and update trip dates
      try {
        await resequenceAndUpdateTripDates(trip.trip_uuid);
      } catch (err) {
        console.warn("Resequence after delete failed", err);
      }
    } catch (err: any) {
      console.error("Delete day failed", err);
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    }
  };

  const resequenceAndUpdateTripDates = async (tripUuid: string) => {
    try {
      const { data: days, error: daysErr } = await supabase
        .from("trip_days")
        .select("*")
        .eq("trip_uuid", tripUuid)
        .order("date", { ascending: true });

      if (daysErr) {
        console.warn("Failed to fetch days for resequence", daysErr.message);
        return;
      }

      if (!Array.isArray(days)) return;

      // Resequence day_number based on date order
      for (let i = 0; i < days.length; i++) {
        const d = days[i];
        const desired = i + 1;
        if (d.day_number !== desired) {
          await supabase
            .from("trip_days")
            .update({ day_number: desired })
            .eq("day_uuid", d.day_uuid);
        }
      }

      // Update trip start_date and end_date
      const startDate = days.length > 0 ? days[0].date : null;
      const endDate = days.length > 0 ? days[days.length - 1].date : null;

      if (startDate || endDate) {
        const { error: tripErr } = await supabase
          .from("trips")
          .update({ start_date: startDate, end_date: endDate })
          .eq("trip_uuid", tripUuid);
        if (tripErr) console.warn("Failed to update trip dates", tripErr.message);
      }

      // Refresh trip record and local itinerary with latest days, activities and photos
      const { data: refreshedTrip, error: tripFetchErr } = await supabase
        .from("trips")
        .select("*")
        .eq("trip_uuid", tripUuid)
        .single();
      if (!tripFetchErr && refreshedTrip) {
        setTripState(refreshedTrip as Trip);
      }

      const { data: refreshedDays, error: refreshErr } = await supabase
        .from("trip_days")
        .select(`*, activities:activities (*), tripDayPhotos:trip_photos (*)`)
        .eq("trip_uuid", tripUuid)
        .order("day_number", { ascending: true });
      if (!refreshErr && Array.isArray(refreshedDays)) {
        const normalized = refreshedDays.map((d: any) => {
          const acts = Array.isArray(d.activities)
            ? [...d.activities].sort((a: any, b: any) => timeToMinutes(a?.time ?? null) - timeToMinutes(b?.time ?? null))
            : [];
          const photos = Array.isArray(d.tripDayPhotos)
            ? [...d.tripDayPhotos].sort((a: any, b: any) => Number(a?.seq ?? 0) - Number(b?.seq ?? 0))
            : [];
          return { ...d, activities: acts, tripDayPhotos: photos } as ItineraryItem;
        });
        setItinerary(normalized as ItineraryItem[]);
      }
    } catch (err) {
      console.error("Resequence failed", err);
    }
  };

  const handleAddDay = async () => {
    // Create a local editing item for the new day and open the edit dialog.
    const newDayNumber =
      itinerary.length > 0
        ? Math.max(...itinerary.map((i) => i.day_number)) + 1
        : 1;

    let newDate = new Date();
    if (itinerary.length > 0) {
      const lastDate = new Date(itinerary[itinerary.length - 1].date);
      lastDate.setDate(lastDate.getDate() + 1);
      newDate = lastDate;
    } else if (trip.start_date) {
      newDate = new Date(trip.start_date);
    }
    const newDateString = newDate.toISOString().split("T")[0];

    const newEditingItem: EditableItineraryItem = {
      day_uuid: uuidv4(),
      trip_uuid: trip.trip_uuid,
      day_number: newDayNumber,
      title: "New Destination",
      date: newDateString,
      cover_image_url: `https://picsum.photos/seed/${new Date().getTime()}/600/400`,
      cover_image_hint: "landscape",
      activities: [],
      tripDayPhotos: [],
      isNew: true,
      cover_image_preview: `https://picsum.photos/seed/${new Date().getTime()}/600/400`,
    } as unknown as EditableItineraryItem;

    setEditingItem(newEditingItem);
    setIsEditDialogOpen(true);
  };

  const activeItineraryItem = itinerary.find(
    (item) => `day-${item.day_number}` === activeView
  );

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
            onClick={() => router.push("/trips")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold font-headline text-primary-foreground truncate">
              {trip.name}
            </h1>
            {(tripState.start_date || tripState.end_date) && (
              <div className="text-sm text-muted-foreground">
                {formatMMDD(tripState.start_date)}{tripState.start_date && tripState.end_date ? " - " : ""}{formatMMDD(tripState.end_date)}
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={handleAddDay}
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white shrink-0"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Day
        </Button>
      </header>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-2">
          <Button
            variant={activeView === "checklist" ? "default" : "outline"}
            onClick={() => setActiveView("checklist")}
            className={cn(
              "shrink-0",
              activeView !== "checklist" &&
                "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            )}
          >
            Checklist
          </Button>
          {itinerary.map((item) => (
            <Button
              key={item.day_uuid}
              variant={
                activeView === `day-${item.day_number}` ? "default" : "outline"
              }
              onClick={() => setActiveView(`day-${item.day_number}`)}
              className={cn(
                "shrink-0",
                activeView !== `day-${item.day_number}` &&
                  "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              )}
            >
              Day {item.day_number}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {activeView === "checklist" && (
        <PreTripChecklist checklist={checklist} tripId={trip.trip_uuid} />
      )}

      {activeItineraryItem && (
        <WeatherCard
          location={activeItineraryItem.title.replace(
            /arrival in |exploring |day trip to /i,
            ""
          )}
        />
      )}

      {itinerary.map((item) => (
        <div
          key={item.day_uuid}
          className={cn(
            activeView === `day-${item.day_number}` ? "block" : "hidden"
          )}
        >
          <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-white/20 shadow-lg">
            <div className="relative">
              <div className="relative w-full h-32 rounded-t-lg overflow-hidden">
                {item.cover_image_url && (
                  <Image
                    src={item.cover_image_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                    data-ai-hint={item.cover_image_hint || ""}
                  />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                  <div className="text-white flex-grow text-left">
                    <h2 className="font-bold text-lg font-headline">
                      Day {item.day_number}: {item.title}
                    </h2>
                    <p className="text-sm">{item.date}</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="shadow-lg">
                    <DropdownMenuItem onSelect={() => handleEditClick(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {item.feedback && (
                <div className="prose prose-sm max-w-none text-card-foreground">
                  <p>{item.feedback}</p>
                </div>
              )}

              {item.tripDayPhotos && item.tripDayPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {item.tripDayPhotos.filter((p) => !p.pending_delete).map((photo) => (
                    <button
                      key={photo.photo_uuid}
                      onClick={() => setViewingPhoto(photo)}
                      className="relative block w-full aspect-square rounded-md overflow-hidden cursor-pointer"
                    >
                      <Image
                        src={photo.trip_day_photo_preview ?? photo.url}
                        alt="User photo"
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              <ul className="space-y-4">
                {item.activities.map((activity, actIndex) => {
                  const icon = getIconText(
                    activity.activity_type,
                    activityOptions
                  );
                  const ActivityIcon = iconMap[icon];
                  return (
                    <li
                      key={activity.activity_uuid}
                      className="flex items-start gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {ActivityIcon && <ActivityIcon className="h-4 w-4" />}
                        </div>
                        {actIndex < item.activities.length - 1 && (
                          <div className="w-px h-6 bg-primary/30 mt-1"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-card-foreground">
                          {activity.time}
                        </p>
                        <p className="text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-muted-foreground">
                          {activity.address}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>
        </div>
      ))}

      {editingItem && (
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleCancelEdit();
          }}
        >
          <DialogContent className="max-h-[90vh] flex flex-col shadow-lg">
            <DialogHeader>
              <DialogTitle>Edit Day {editingItem.day_number}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6 -mr-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingItem.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editingItem.date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Day Cover Image</Label>
                {editingItem.cover_image_preview && (
                  <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden">
                    <Image
                      src={editingItem.cover_image_preview}
                      alt="Day cover preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    ref={dayCoverInputRef}
                    onChange={handleDayCoverImageChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dayCoverInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveDayCoverImage}
                    disabled={!editingItem.cover_image_preview}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Feedback</Label>
                <Textarea
                  id="remarks"
                  value={editingItem.feedback || ""}
                  onChange={(e) =>
                    handleFieldChange("feedback", e.target.value)
                  }
                  placeholder="Write your feelings or reflections..."
                />
              </div>

              <div className="space-y-2">
                <Label>Your Photos</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(editingItem.tripDayPhotos || []).map((photo) => (
                    <div key={photo.photo_uuid} className="relative aspect-square">
                      <Image
                        src={photo.trip_day_photo_preview ?? photo.url}
                        alt="User upload"
                        fill
                        className={cn("rounded-md object-cover", photo.pending_delete && "opacity-40")}
                      />
                      {photo.pending_delete && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm z-10">Marked for deletion</div>
                      )}
                      <Button
                        variant={photo.pending_delete ? "outline" : "destructive"}
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 z-20"
                        onClick={() => handleDeletePhoto(photo.photo_uuid)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="aspect-square flex-col gap-1"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-xs">Upload</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Activities</h3>
                  <Button variant="ghost" size="sm" onClick={handleAddActivity}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Activity
                  </Button>
                </div>
                <div className="space-y-4">
                  {editingItem.activities.map((act) => (
                    <div
                      key={act.activity_uuid}
                      className="flex items-center gap-2 p-2 border rounded-lg"
                    >
                      <div className="grid gap-2 flex-grow">
                        <div className="flex items-center gap-2">
                          <Select
                            value={act.activity_type}
                            onValueChange={(val) =>
                              handleActivityChange(
                                act.activity_uuid,
                                "activity_type",
                                val
                              )
                            }
                          >
                            <SelectTrigger className="w-16 h-8">
                              <SelectValue>
                                {iconMap[
                                  getIconText(
                                    act.activity_type,
                                    activityOptions
                                  )
                                ] &&
                                  React.createElement(
                                    iconMap[
                                      getIconText(
                                        act.activity_type,
                                        activityOptions
                                      )
                                    ],
                                    { className: "h-4 w-4" }
                                  )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="shadow-lg">
                              {activityOptions.map((opt) => (
                                <SelectItem
                                  key={opt.icon_text}
                                  value={opt.activity_type}
                                >
                                  <div className="flex items-center gap-2">
                                    {React.createElement(
                                      iconMap[opt.icon_text],
                                      { className: "h-4 w-4" }
                                    )}
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
                              handleActivityChange(
                                act.activity_uuid,
                                "time",
                                e.target.value
                              )
                            }
                            className="w-24 h-8"
                          />
                        </div>
                        <Input
                          value={act.description}
                          onChange={(e) =>
                            handleActivityChange(
                              act.activity_uuid,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Activity description"
                          className="h-8"
                        />
                        <Input
                          value={act.address||""}
                          onChange={(e) =>
                            handleActivityChange(
                              act.activity_uuid,
                              "address",
                              e.target.value
                            )
                          }
                          placeholder="Activity Address"
                          className="h-8"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteActivity(act.activity_uuid)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="flex items-center justify-between">
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Day
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Day</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the day, its activities, and photos. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteDay} className="bg-destructive hover:bg-destructive/90">
                        Delete Day
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {viewingPhoto && (
        <Dialog
          open={!!viewingPhoto}
          onOpenChange={() => setViewingPhoto(null)}
        >
          <DialogContent className="max-w-3xl p-2 bg-transparent border-0 shadow-none">
            <DialogHeader>
              <DialogTitle className="sr-only">
                Full screen user photo
              </DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-auto">
              <Image
                src={viewingPhoto.trip_day_photo_preview ?? viewingPhoto.url}
                alt="Full screen user photo"
                width={1920}
                height={1080}
                className="rounded-lg object-contain w-full h-auto max-h-[80vh]"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
