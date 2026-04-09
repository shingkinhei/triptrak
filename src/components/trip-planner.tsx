"use client";
import React, { useState, useRef, useEffect, use } from "react";
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
  ActivityOptions
} from "@/lib/types";
import {
  BedDouble,
  Camera,
  ChevronUp,
  ChevronDown,
  Plane,
  Train, 
  UtensilsCrossed,
  MoreVertical,
  PlusCircle,
  Trash2,
  Upload,
  X,
  MapPin,
  type LucideIcon,
  Ticket,
  Mountain,
  Building,
  ArrowLeft,
  CheckCircle2,
  Edit,
  GripVertical,
  Brain,
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
import { v4 as uuidv4 } from "uuid";
import { Description } from "@radix-ui/react-toast";
import { match } from "assert/strict";
import { getAiPlan } from "@/api/generateDayActivities";
import { PreTripChecklist } from "./pre-trip-checklist";
import { DayActivities } from "./day-activities";

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
  aiRate?: number;
  aiRateLimit?: number;
}

type EditableTripDayPhoto = TripDayPhotos;

type EditableItineraryItem = ItineraryItem & {
  cover_image_file?: File | null;
  cover_image_preview?: string | null;
  isNew?: boolean;
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

export function TripPlanner({ trip, aiRate, aiRateLimit }: TripPlannerProps) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [tripState, setTripState] = useState<Trip>(trip);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [editingItem, setEditingItem] = useState<EditableItineraryItem | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAiPlanDialogOpen, setIsAiPlanDialogOpen] = useState(false);
  const [isAiPlanLoading, setIsAiPlanLoading] = useState(false);
  const [localAiRate, setLocalAiRate] = useState(aiRate);
  const [localAiRateLimit, setLocalAiRateLimit] = useState(aiRateLimit);
  const [aiPreferences, setAiPreferences] = useState({
    preferences: null,
    suggestions: null,
  });
  const [aiPreferencesOptions, setAIPreferencesOptions] = useState<ActivityOptions[]>([]);

  const [activeView, setActiveView] = useState<string>("day-1");
  const [checklistOpen, setChecklistOpen] = useState(false);

  // const [viewingPhoto, setViewingPhoto] = useState<TripDayPhotos | null>(null);
  const [activityOptions, setActivityOptions] = useState<ActivityOptions[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  // const dayCoverInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchActivityOptions = async () => {
      const { data, error } = await supabase
        .from("activities_option_setup")
        .select("activity_type, icon_text, color_code, description, ai_preference");
      if (error) {
        toast({
          title: "Error fetching activity options",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setActivityOptions(data as ActivityOptions[]);
        setAIPreferencesOptions(
          (data as ActivityOptions[]).filter((opt) => opt.ai_preference === true)
        );
      }
    };
    fetchActivityOptions();
  }, []);

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

    const fetchItinerary = async () => {
      const { data, error } = await supabase
        .from("trip_days")
        .select(`*, activities:activities (*)`)
        .eq("trip_uuid", trip.trip_uuid)
        .order("day_number", { ascending: true });

      if (error) {
        toast({
          title: "Error fetching itinerary",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const sortedDays = (data || []).map((day: any) => ({
        ...day,
        activities: (day.activities || []).sort((a: Activity, b: Activity) =>
          a.time.localeCompare(b.time)
        ),
        tripDayPhotos: (day.tripDayPhotos || []).sort(
          (a: TripDayPhotos, b: TripDayPhotos) => (a.seq ?? 0) - (b.seq ?? 0)
        ),
      }));
      setItinerary(sortedDays as ItineraryItem[]);
    };

    fetchChecklist();
    fetchItinerary();
  }, [trip, supabase, toast]);

  useEffect(() => {
    // Sync local AI rate state with props
    setLocalAiRate(aiRate);
    setLocalAiRateLimit(aiRateLimit);
  }, [aiRate, aiRateLimit]);

  const handleEditClick = (item: ItineraryItem) => {
    setTimeout(() => {
      setEditingItem({
        ...item,
        activities: item.activities
          ? [...item.activities.map((a) => ({ ...a }))]
          : [],
        // tripDayPhotos: item.tripDayPhotos
        //   ? [...item.tripDayPhotos.map((a) => ({ ...a }))]
        //   : [],
        // cover_image_preview: item.cover_image_url,
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
    // const oldImageUrl = originalDay?.cover_image_url;

    // let newImageUrl: string | null = itemToSave.cover_image_url;

    // if (
    //   (itemToSave.cover_image_file || newImageUrl === null) &&
    //   oldImageUrl &&
    //   oldImageUrl !== newImageUrl
    // ) {
    //   const oldImageKey = oldImageUrl.split("/day_cover/").pop();
    //   if (oldImageKey) {
    //     await supabase.storage.from("day_cover").remove([oldImageKey]);
    //   }
    // }

    // if (itemToSave.cover_image_file) {
    //   const file = itemToSave.cover_image_file;
    //   const fileExt = (file.name.split(".").pop() || "jpg").replace(
    //     /[^a-z0-9]/gi,
    //     ""
    //   );
    //   const filePath = `${user.id}/${trip.trip_uuid}/${itemToSave.date}-${itemToSave.day_number}-${uuidv4()}.${fileExt}`;

    //   const { error: uploadError } = await supabase.storage
    //     .from("day_cover")
    //     .upload(filePath, file, { upsert: true });

    //   if (uploadError) {
    //     toast({
    //       title: "Error uploading day cover",
    //       description: uploadError.message,
    //       variant: "destructive",
    //     });
    //     return;
    //   }

    //   const { data: urlData } = supabase.storage
    //     .from("day_cover")
    //     .getPublicUrl(filePath);
    //   newImageUrl = urlData.publicUrl;
    // } else if (!itemToSave.cover_image_preview && oldImageUrl) {
    //   newImageUrl = null;
    // }

    if (!originalDay) {
      // Insert new day record when adding a fresh day
      const dayInsertPayload = {
        day_uuid: itemToSave.day_uuid,
        trip_uuid: trip.trip_uuid,
        day_number: itemToSave.day_number,
        title: itemToSave.title,
        date: itemToSave.date,
        feedback: itemToSave.feedback,
        // cover_image_hint: itemToSave.cover_image_hint,
        // cover_image_url: newImageUrl,
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
        // cover_image_hint: itemToSave.cover_image_hint,
        // cover_image_url: newImageUrl,
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
        act.address !== original.address ||
        act.name !== original.name
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
            name: act.name,
            description: act.description,
            activity_type: act.activity_type,
            address: act.address,
            day_uuid: itemToSave.day_uuid, // keep consistent day_uuid
            ai_plan: act.ai_plan,
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
            name: act.name,
            time: act.time,
            description: act.description,
            address: act.address,
            activity_type: act.activity_type,
            ai_plan: act.ai_plan,
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

    // try {
    //   const photos = (itemToSave.tripDayPhotos || []) as any[];

    //   // 1) Delete photos marked pending_delete
    //   const photosToDelete = photos.filter((p) => p.pending_delete && !p.trip_day_photo);
    //   if (photosToDelete.length > 0) {
    //     for (const dp of photosToDelete) {
    //       try {
    //         const url: string = dp.url || "";
    //         const key = url.split("/day_feedback/").pop();
    //         if (key) {
    //           const { error: delErr } = await supabase.storage.from("day_feedback").remove([key]);
    //           if (delErr) console.warn("Storage delete error", delErr.message);
    //         }
    //         const { error: dbErr } = await supabase.from("trip_photos").delete().eq("photo_uuid", dp.photo_uuid);
    //         if (dbErr) console.warn("DB delete error", dbErr.message);
    //       } catch (innerErr) {
    //         console.error("Error deleting photo", innerErr);
    //       }
    //     }
    //   }

    //   // 2) Upload new pending previews (trip_day_photo)
    //   const pendingPhotos = photos.filter((p) => !!p.trip_day_photo) as Array<any>;
    //   if (pendingPhotos.length > 0) {
    //     const {
    //       data: { user },
    //     } = await supabase.auth.getUser();
    //     if (!user) {
    //       toast({ title: "Not Authenticated", description: "You must be logged in to save changes.", variant: "destructive" });
    //       return;
    //     }

    //     // find current count after deletions
    //     const { data: existing } = await supabase.from("trip_photos").select("seq").eq("day_uuid", itemToSave.day_uuid);
    //     let startSeq = Array.isArray(existing) ? existing.length : 0;

    //     for (let i = 0; i < pendingPhotos.length; i++) {
    //       const p = pendingPhotos[i];
    //       const file: File = p.trip_day_photo as File;
    //       const fileExt = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "");
    //       const filePath = `${user.id}/${trip.trip_uuid}/${itemToSave.day_uuid}/${itemToSave.date}-${itemToSave.day_number}-${uuidv4}-${i + 1}.${fileExt}`;

    //       const { error: uploadError } = await supabase.storage.from("day_feedback").upload(filePath, file, { upsert: false });
    //       if (uploadError) {
    //         toast({ title: "Photo upload failed", description: uploadError.message, variant: "destructive" });
    //         continue;
    //       }

    //       const { data: urlData } = supabase.storage.from("day_feedback").getPublicUrl(filePath);
    //       const publicUrl = urlData.publicUrl;

    //       const photoRow = {
    //         photo_uuid: p.photo_uuid || uuidv4(),
    //         day_uuid: itemToSave.day_uuid,
    //         seq: startSeq,
    //         url: publicUrl,
    //         user_id: user.id,
    //       };

    //       const { error: insertError } = await supabase.from("trip_photos").insert(photoRow);
    //       if (insertError) {
    //         toast({ title: "DB insert failed", description: insertError.message, variant: "destructive" });
    //         console.log(insertError.message);
    //       } else {
    //         startSeq += 1;
    //       }
    //     }
    //   }

    //   // 3) Resequence remaining photos to be contiguous
    //   const { data: remainingPhotos } = await supabase.from("trip_photos").select("*").eq("day_uuid", itemToSave.day_uuid).order("seq", { ascending: true });
    //   if (Array.isArray(remainingPhotos)) {
    //     for (let idx = 0; idx < remainingPhotos.length; idx++) {
    //       const p = remainingPhotos[idx];
    //       if (p.seq !== idx) {
    //         await supabase.from("trip_photos").update({ seq: idx }).eq("photo_uuid", p.photo_uuid);
    //       }
    //     }
    //   }

    //   // 4) Refresh local photos
    //   const { data: freshPhotos } = await supabase.from("trip_photos").select("*").eq("day_uuid", itemToSave.day_uuid).order("seq", { ascending: true });
    //   if (freshPhotos) {
    //     setItinerary((prev) => prev.map((d) => (d.day_uuid === itemToSave.day_uuid ? ({ ...d, tripDayPhotos: freshPhotos } as ItineraryItem) : d)));
    //   }
    // } catch (err: any) {
    //   console.error("Error processing photo changes", err);
    //   toast({ title: "Error", description: "One or more photo operations failed.", variant: "destructive" });
    // }

    toast({
      title: "Day Saved!",
      description: `Changes to Day ${itemToSave.day_number} have been saved.`,
    });

    handleCancelEdit();

    const { data: refreshedDay, error: refreshError } = await supabase
      .from("trip_days")
      .select(`*, activities:activities (*)`)
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
      // const sortedPhotos = Array.isArray(refreshedDay.tripDayPhotos)
      //   ? [...refreshedDay.tripDayPhotos].sort(
      //       (a: any, b: any) => Number(a?.seq ?? 0) - Number(b?.seq ?? 0)
      //     )
      //   : [];

      // Update editing item
      // setEditingItem(prev =>
      //   prev ? { ...prev, tripDayPhotos: sortedPhotos } : prev
      // );

      // Update itinerary
      setItinerary(prev =>
        prev.map(item =>
          item.day_uuid === refreshedDay.day_uuid
            ? ({
                ...refreshedDay,
                activities: sortedActivities,
                //tripDayPhotos: sortedPhotos,
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

  const handleAiPlanChange = (field: "preferences" | "suggestions", value: string | null) => {
    setAiPreferences(prev => ({ ...prev, [field]: value }));
  }

  const handleOpenAiPlan = async () => {
    // Refresh AI rate from database
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("users_info")
        .select("ai_rate_count, ai_rate_limit")
        .eq("user_id", user.id)
        .single();

      if (error) {
        toast({
          title: "Error refreshing AI rate",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        // Update parent component props by triggering a callback
        // Note: Since props are read-only, we'll show the updated info in the dialog
        setLocalAiRate(data.ai_rate_count || 0);
        setLocalAiRateLimit(data.ai_rate_limit || 0);
      }
    }

    setIsAiPlanDialogOpen(true);
  };

  const handleCancelAiPlan = () => {
    setIsAiPlanDialogOpen(false);
    setAiPreferences({
      preferences: null,
      suggestions: null,
    });
  }
  const handleApplyAiPlan = async () => {

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

    if (!editingItem?.day_uuid) {
      toast({
        title: "Error",
        description: "No day selected.",
        variant: "destructive",
      });
      return;
    }

    // Make Sure latest AI rate is checked before applying plan
    const { data: usersInfoData, error: usersInfoError } = await supabase
      .from('users_info')
      .select('ai_rate, ai_rate_limit')
      .eq('user_id', user.id).single();
    const aiRateCheck = usersInfoData?.ai_rate || localAiRate;
    const aiRateLimitCheck = usersInfoData?.ai_rate_limit || localAiRateLimit;
    if (aiRateCheck >= aiRateLimitCheck) {
      toast({
        title: "AI Rate Limit Reached",
        description: `You have reached the AI rate limit of ${aiRateLimitCheck}.`,
        variant: "destructive",
      });
      return;
    }

    if (!aiPreferences.preferences) {
      toast({
        title: "Incomplete Input",
        description: "Please provide your preferences.",
        variant: "destructive",
      });
      return;
    }

    if (editingItem?.activities?.length > 0) {
      // the exist acitivites will be replaced by AI
      const existingActivities = editingItem.activities;
      //confirm the existing activities will be replaced by AI suggestions

      // Clear existing activities
      setEditingItem({
        ...editingItem,
        activities: [],
        feedback: `Existing activities will be replaced by AI suggestions.`,
      })
    }
    setIsAiPlanLoading(true);
    const loadingToastId = toast({
      title: "Generating AI plan...",
      description: "Please wait while we generate your itinerary suggestions.",
    });

    try {
      const result = await getAiPlan(
        editingItem.day_uuid,
        aiPreferences.preferences,
        aiPreferences.suggestions
      );

      if (!result) {
        toast({
          title: "AI Plan Failed",
          description: "Failed to generate AI plan.",
          variant: "destructive",
        });
        return;
      }

      //AI Rate limit handling - this is a fallback in case the backend doesn't enforce it
      const { error: rateLimitError } = await supabase
        .from("users_info")
        .update({ ai_rate_count: aiRate + 1 })
        .eq("user_id", user?.id);
      if (rateLimitError) {
        console.warn("Failed to update AI rate", rateLimitError.message);
      }

      // Convert AI response to Activity objects
      // result should be an array of activities with: time, description, activity_type, address
      const aiActivities: Activity[] = Array.isArray(result)
        ? result.map((activity: any) => ({
            activity_uuid: uuidv4(),
            day_uuid: editingItem.day_uuid,
            name: activity.name || "",
            time: activity.time || "00:00",
            description: activity.description || "",
            activity_type: activity.activity_type || "Sightseeing",
            address: activity.address || null,
            ai_plan: true
          }))
        : [];

      // Update editingItem with new activities
      setEditingItem((prev) =>
        prev
          ? {
              ...prev,
              activities: [...prev.activities, ...aiActivities],
              feedback: `AI Plan Applied (${aiActivities.length} activities suggested)`,
            }
          : prev
      );

      toast({
        title: "AI Plan Applied",
        description: `${aiActivities.length} activity(ies) added to your day.`,
      });
    } catch (error) {
      console.error("Error applying AI plan:", error);
      toast({
        title: "Error",
        description: "Failed to process AI plan.",
        variant: "destructive",
      });
    } finally {
      setAiPreferences({
        preferences: null,
        suggestions: null,
      });
      setIsAiPlanLoading(false);
    }
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
        name: "",
        time: "00:00",
        description: "",
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

  const handleDeleteDay = async () => {
    if (!editingItem) return;

    const dayUuid = editingItem.day_uuid;

    try {
      // // Delete DB rows: trip_photos, activities, then trip_days
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
        setActiveView("day-1");
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
      //cover_image_url: `https://picsum.photos/seed/${new Date().getTime()}/600/400`,
      //cover_image_hint: "landscape",
      activities: [],
      tripDayPhotos: [],
      isNew: true,
      //cover_image_preview: `https://picsum.photos/seed/${new Date().getTime()}/600/400`,
    } as unknown as EditableItineraryItem;

    setEditingItem(newEditingItem);
    setIsEditDialogOpen(true);
  };

  const activeItineraryItem = itinerary.find(
    (item) => `day-${item.day_number}` === activeView
  );

  return (
    <div className="space-y-4 pb-20">
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
              <div className="text-sm text-primary-foreground">
                {formatMMDD(tripState.start_date)}
                {tripState.start_date && tripState.end_date ? " - " : ""}
                {formatMMDD(tripState.end_date)}
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
      
      {/* <div className="flex items-end gap-2 h-80">
        <div className="flex flex-col gap-5">
          <span className="box-decoration-clone text-5xl font-semibold text-primary-foreground bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg px-4 py-2 ">
            {trip.name}
          </span>
          <span className="text-3xl text-primary-foreground">
            {(tripState.start_date || tripState.end_date) && (
              <div className="text-sm text-primary-foreground">
                {formatMMDD(tripState.start_date)}
                {tripState.start_date && tripState.end_date ? " - " : ""}
                {formatMMDD(tripState.end_date)}
              </div>
            )}
          </span>
        </div>
      </div> */}
                {/* <Button
            variant={activeView === "checklist" ? "default" : "outline"}
            onClick={() => setActiveView("checklist")}
            className={cn(
              "shrink-0",
              activeView !== "checklist" &&
                "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            )}
          >
            Checklist
          </Button> */}
          <div className={`border-b border-white/20 ${checklistOpen ? "bg-white/80 rounded-lg border-b-0" : ""}`}>
          <div
            onClick={() => setChecklistOpen(!checklistOpen)}
            className={`p-2 flex items-center justify-between text-white hover:bg-white/20 hover:text-white ${checklistOpen ? " rounded-lg " : ""}`}
          >
            <div className="flex items-center gap-2 text-lg font-headline text-card-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className={`font-semibold ${checklistOpen ? "text-black" : "text-white"}`}>Pre-Trip Checklist</p>
            </div>
            {checklistOpen ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (<ChevronDown className="h-4 w-4 text-white" />)}
            
          </div>
          {checklistOpen && (
            <PreTripChecklist checklist={checklist} tripId={trip.trip_uuid} />
          )}
          </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-2">
          {itinerary.map((item) => (
            <Button
              key={item.day_uuid}
              variant={
                activeView === `day-${item.day_number}` ? "default" : "outline"
              }
              onClick={() => setActiveView(`day-${item.day_number}`)}
              className={cn(
                "shrink-0 w-16 h-16 rounded-full flex flex-col items-center justify-center text-center gap-0",
                activeView !== `day-${item.day_number}` &&
                  "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              )}
            >
              <span className={cn("font-medium")}>{formatMMDD(item.date)}</span>
              <span className={cn("font-bold")}>Day {item.day_number}</span>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

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
                  {item.weather_icon && (
                    <WeatherCard
                    temperature={item.temperature}
                      wmoCode={item.weather_icon}
                    />
                  ) ||
                  (<Image
                    src="/images/background.jpeg"
                    alt="Trip Cover Image"
                    fill
                    className="object-cover"
                    data-ai-hint={item.title || ""}
                  />) }
                <div className="absolute inset-0 flex items-end p-4">
                  <div className="text-primary flex-grow text-left">
                    <h2 className="font-bold text-lg font-headline">
                      {item.title}
                    </h2>
                    <p className="text-sm">{item.date}</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 z-10">
                <Button variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 pointer-events-auto" onClick={() => handleEditClick(item)}>
                  <Edit className="h-4 w-4" color="white"/>
                  <span className="sr-only">Edit Trip</span>
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* {item.tripDayPhotos && item.tripDayPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {item.tripDayPhotos
                    .filter((p) => !p.pending_delete)
                    .map((photo) => (
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
              )} */}
              <ul className="space-y-4">
                {item.activities.map((activity, actIndex) => {
                  const icon = getIconText(
                    activity.activity_type,
                    activityOptions
                  );
                  const ActivityIcon = iconMap[icon];
                  return (
                    <li key={activity.activity_uuid} className="flex items-stretch gap-4"> 
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                          {ActivityIcon && <ActivityIcon className="h-4 w-4" />}
                        </div>
                        
                        {/* {actIndex < item.activities.length - 1 && (
                          <div className="w-[2px] flex-1 bg-primary/30 my-1 translate-y-1"></div>
                        )} */}
                      </div>

                      <div className="flex flex-col gap-0">
                        <div>
                          <p className="font-semibold text-card-foreground">{activity.time} </p>
                        </div>
                        <div className="flex items-center">
                          <p className="font-semibold text-primary">{activity.name} 
                          </p>
                          {activity.ai_plan &&  <div className="ml-1 rounded-full bg-primary p-1"><Brain className="h-3 w-3 text-white" /></div>}
                        </div>
                        <div>
                          <p className="text-muted-foreground">{activity.description}</p>
                        </div>
                        {activity.address && activity.address.length > 0 && (
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4 text-primary" />
                          <p className="text-muted-foreground italic">{activity.address}</p>
                        </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {item.feedback && (
                <div className="prose prose-sm max-w-none text-card-foreground">
                  <p>{item.feedback}</p>
                </div>
              )}
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
              <DialogTitle>Day {editingItem.day_number}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pl-1 pr-4">
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

              {/* <div className="space-y-2">
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
              </div> */}

              {/* <div className="space-y-2">
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
                    <div
                      key={photo.photo_uuid}
                      className="relative aspect-square"
                    >
                      <Image
                        src={photo.trip_day_photo_preview ?? photo.url}
                        alt="User upload"
                        fill
                        className={cn(
                          "rounded-md object-cover",
                          photo.pending_delete && "opacity-40"
                        )}
                      />
                      {photo.pending_delete && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm z-10">
                          Marked for deletion
                        </div>
                      )}
                      <Button
                        variant={
                          photo.pending_delete ? "outline" : "destructive"
                        }
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
              </div> */}

              <div className="space-y-2">
              <DayActivities
                activities={editingItem.activities}
                activityOptions={activityOptions}
                onAddActivity={handleAddActivity}
                onDeleteActivity={handleDeleteActivity}
                onActivityChange={handleActivityChange}
              />
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
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-col sm:justify-between sm:space-x-0 gap-2">
              <div  className="flex gap-2">
                <Button variant="outline" onClick={handleOpenAiPlan} className="w-full">
                  <Brain className="h-4 w-4" />
                  AI Plan
                </Button>
              </div>
              <div className="flex gap-2 justify-around">
                <div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" >
                        <Trash2 className= "h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Day</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the day, its activities,
                          and photos. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteDay}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete Day
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              {/* <div >
                <Button variant="outline" onClick={handleCancelEdit} className="w-full">
                  Cancel
                </Button>
              </div> */}
                <div className="w-full">
                  <Button onClick={handleSave} className="w-full">Save Changes</Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {( isAiPlanDialogOpen || isAiPlanLoading ) && <Dialog
        open={isAiPlanDialogOpen}
        onOpenChange={(isOpen) => {
          handleCancelAiPlan();
          setIsAiPlanLoading(false);
          setIsAiPlanDialogOpen(isOpen);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Trip Preferences</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Choose the preferences to guide the AI itinerary suggestions. 
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-900">
                Remaining AI Requests: <span className="text-lg font-bold text-blue-600">{Math.max(0, localAiRateLimit - localAiRate)}/{localAiRateLimit}</span>
              </p>
              {localAiRateLimit - localAiRate <= 0 && (
                <p className="text-xs text-red-600 mt-1">You have reached your daily AI limit. Try again tomorrow.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center gap-2 justify-center">
                  <div className="grid grid-cols-2 gap-4 p-2 ">
                  {aiPreferencesOptions.map((opt) => (
                    <Button
                      className="flex items-center gap-2 h-[8rem] w-[8rem]"
                      key={opt.icon_text}
                      variant={
                        aiPreferences.preferences === opt.activity_type
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        handleAiPlanChange("preferences", opt.activity_type)
                      }
                    >
                      <div className="flex flex-col items-center justify-center gap-2 h-[8rem] w-full">
                        {React.createElement(
                          iconMap[opt.icon_text],
                          { className: "h-8 w-8" }
                        )}
                        <span>{opt.activity_type}</span>
                      </div>
                    </Button>
                  ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Suggestion</Label>
                  <Input
                    id="ai-suggestions"
                    type="text"
                    placeholder="Add more local food spots?"
                    value= {aiPreferences.suggestions || ""}
                    onChange={(e) =>
                      handleAiPlanChange("suggestions", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
                
          </div>
          <DialogFooter className="flex justify-end gap-2">
            {/* <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                handleCancelAIPlan();
              }}
              disabled={isAiPlanLoading}
            >
              Cancel
            </Button> */}
            <Button 
              onClick={handleApplyAiPlan}
              disabled={isAiPlanLoading || (localAiRateLimit - localAiRate <= 0)}
              title={localAiRateLimit - localAiRate <= 0 ? "You have reached your daily AI limit" : ""}
            >
              {isAiPlanLoading ? "Generating..." : localAiRateLimit - localAiRate <= 0 ? "Limit Reached" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}

      {/* {viewingPhoto && (
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
      )} */}
    </div>
  );
}
