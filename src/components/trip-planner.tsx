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
  Plus,
  CirclePlus,
  Trash2,
  Upload,
  X,
  MapPin,
  Map,
  type LucideIcon,
  Ticket,
  Mountain,
  Building,
  ArrowLeft,
  CheckCircle2,
  Edit,
  GripVertical,
  EllipsisVertical,
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
import { LoadingOverlay } from "./loading-overlay";
import { formatMMDD, timeToMinutes , formatTimeHHMM } from "@/context/DateFormat";
import { useTranslations } from 'next-intl';
// import { DayActivities } from "./day-activities";
import { set } from "lodash";

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

function getIconText(
  activityType: string,
  options: ActivityOptions[],
  fallback: string = "❓" // default fallback icon
): string {
  const match = options.find((opt) => opt.activity_type === activityType);
  return match ? match.icon_text : fallback;
}

export function TripPlanner({ trip, aiRate, aiRateLimit }: TripPlannerProps) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [tripState, setTripState] = useState<Trip>(trip);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAiPlanDialogOpen, setIsAiPlanDialogOpen] = useState(false);
  const [isAiPlanLoading, setIsAiPlanLoading] = useState(false);
  
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [currentEditingActivity, setCurrentEditingActivity]=useState<Activity>(null);
  const [activityFormData,setActivityFormData] = useState<Activity>(
    {
      activity_uuid: "",
      day_uuid: "",
      activity_type: "Sightseeing",
      name: "",
      description: "",
      time: "00:00",
      address: "",
    }
  );

  const [localAiRate, setLocalAiRate] = useState(aiRate);
  const [localAiRateLimit, setLocalAiRateLimit] = useState(aiRateLimit);
  const [aiPreferences, setAiPreferences] = useState({
    preferences: null,
    suggestions: null,
  });
  const [aiPreferencesOptions, setAIPreferencesOptions] = useState<ActivityOptions[]>([]);
  const [activeView, setActiveView] = useState<string>("day-1");
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [activityOptions, setActivityOptions] = useState<ActivityOptions[]>([]);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations("tripPlanner");
  const ct = useTranslations('common');

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
        ...item
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

    if (!originalDay) {
      const dayInsertPayload = {
        day_uuid: itemToSave.day_uuid,
        trip_uuid: trip.trip_uuid,
        day_number: itemToSave.day_number,
        title: itemToSave.title,
        date: itemToSave.date,
        feedback: itemToSave.feedback,
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

      // Update itinerary
      setItinerary(prev =>
        prev.map(item =>
          item.day_uuid === refreshedDay.day_uuid
            ? ({
                ...refreshedDay,
                activities: sortedActivities,
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

    setIsEditDialogOpen(false);
    setIsAiPlanDialogOpen(false);
    setIsAiPlanLoading(true);
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not found");
      }

      if (!editingItem?.day_uuid) {
        throw new Error("Day not found");
      }

      // Make Sure latest AI rate is checked before applying plan
      const { data: usersInfoData, error: usersInfoError } = await supabase
        .from('users_info')
        .select('ai_rate, ai_rate_limit')
        .eq('user_id', user.id).single();
      const aiRateCheck = usersInfoData?.ai_rate || localAiRate;
      const aiRateLimitCheck = usersInfoData?.ai_rate_limit || localAiRateLimit;
      if (aiRateCheck >= aiRateLimitCheck) {
        throw new Error("AI rate limit exceeded");
      }

      if (!aiPreferences.preferences) {
        toast({
          title: "Incomplete Input",
          description: "Please provide your preferences.",
          variant: "destructive",
        });
        return;
      }

      const loadingToastId = toast({
        title: "Generating AI plan...",
        description: "Please wait while we generate your itinerary suggestions.",
      });

      const { data: result, error: aiPlanError } = await getAiPlan(
        editingItem.trip_uuid,
        editingItem.day_uuid,
        aiPreferences.preferences,
        aiPreferences.suggestions
      );

      if (aiPlanError) {
        throw new Error(aiPlanError || "Failed to generate AI plan");
      }

      //AI Rate limit handling - this is a fallback in case the backend doesn't enforce it
      const { error: rateLimitError } = await supabase
        .from("users_info")
        .update({ ai_rate_count: aiRate + 1 })
        .eq("user_id", user?.id);
      if (rateLimitError) {
        throw new Error(rateLimitError.message || "Failed to update AI rate");
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


      // delete old activities form supabase
      const { error: deleteError } = await supabase
        .from("activities")
        .delete()
        .eq("day_uuid", editingItem.day_uuid);
      if (deleteError) {
        throw new Error(deleteError.message || "Failed to delete activities");
      }

      //insert AI generated activities
      const { data: inserted, error: insertError } = await supabase
        .from("activities")
        .insert(aiActivities);
      if (insertError) {
        throw new Error(insertError.message || "Failed to insert activities");
      }

      // Refresh the entire day with all updated activities
      const { data: refreshedDay, error: refreshErr } = await supabase
        .from("trip_days")
        .select(`*, activities:activities (*)`)
        .eq("day_uuid", editingItem.day_uuid)
        .single();

      if (refreshErr) {
        throw new Error(refreshErr.message || "Failed to refresh day");
      }

      if (refreshedDay) {
        // Sort activities by time
        const sortedActivities = Array.isArray(refreshedDay.activities)
          ? [...refreshedDay.activities].sort((a: Activity, b: Activity) => 
              (a.time || "00:00").localeCompare(b.time || "00:00")
            )
          : [];

        // Update itinerary with refreshed day
        const newItinerary = itinerary.map((item) => {
          if (item.day_uuid === editingItem.day_uuid) {
            return {
              ...refreshedDay,
              activities: sortedActivities,
            } as ItineraryItem;
          }
          return item;
        });
        setItinerary(newItinerary);
      }

      setActiveView(`day-${editingItem?.day_number}`);
        setActivityFormData(null);
        handleCancelActivityDialog();

      toast({
        title: "AI Plan Applied",
        description: `${aiActivities.length} activity(ies) added to your day.`,
      });

    } catch (error) {
      console.error("Error applying AI plan:", error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setAiPreferences({
        preferences: null,
        suggestions: null,
      });
      setIsAiPlanLoading(false);
      setEditingItem(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleFieldChange = (
    field: keyof Omit<
      ItineraryItem,
      "activities" | "checklist"
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

      // Refresh trip record and local itinerary with latest days, activities
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
        .select(`*, activities:activities (*)`)
        .eq("trip_uuid", tripUuid)
        .order("day_number", { ascending: true });
      if (!refreshErr && Array.isArray(refreshedDays)) {
        const normalized = refreshedDays.map((d: any) => {
          const acts = Array.isArray(d.activities)
            ? [...d.activities].sort((a: any, b: any) => timeToMinutes(a?.time ?? null) - timeToMinutes(b?.time ?? null))
            : [];
          return { ...d, activities: acts } as ItineraryItem;
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

    const newEditingItem: ItineraryItem = {
      day_uuid: uuidv4(),
      trip_uuid: trip.trip_uuid,
      day_number: newDayNumber,
      title: `Day ${newDayNumber}`,
      date: newDateString,
    } as unknown as ItineraryItem;

    setEditingItem(newEditingItem);
    setIsEditDialogOpen(true);
  };

  const activeItineraryItem = itinerary.find(
    (item) => `day-${item.day_number}` === activeView
  );

  const handleCancelActivityDialog = () => {
    setIsActivityDialogOpen(false);
    setCurrentEditingActivity(null);
    setActivityFormData(null);
  };

  const handleAddActivity = () => {
    setCurrentEditingActivity(null);
    setActivityFormData(    {
      activity_uuid: "",
      day_uuid: "",
      activity_type: "Sightseeing",
      name: "",
      description: "",
      time: "00:00",
      address: "",
    });
    setIsActivityDialogOpen(true);
  }

  const handleEditActivity = (activity: Activity) => {
    setCurrentEditingActivity(activity);
    setActivityFormData({ ...activity });
    setIsActivityDialogOpen(true);
  }
  const validateActivityForm = (): { 
    valid: boolean;  
    message?: string 
  } => {
    const errors: Record<string, string> = {};

    // .trim() already handles empty strings (""), so you don't need both checks
    if (!activityFormData.name?.trim()) {
      errors.name = "Activity name is required";
    }
    
    if (!activityFormData.time) {
      errors.time = "Time is required";
    }

    if (!activityFormData.activity_type) {
      errors.activity_type = "Please select an activity type";
    }

    const isValid = Object.keys(errors).length === 0;

    return {
      valid: isValid,
      // This grabs the first error message available in the object
      message: isValid ? undefined : Object.values(errors)[0]
    };
  };

  const handleSaveActivity = async() => {
    try{
      const { valid, message } = validateActivityForm();
      if (!valid) {
        toast({ title: "Error", description: message, variant: "destructive" });
        return;
      }
      if (activityFormData) {
        // Edit mode: update all fields
        const updatedActivity: Activity = {
          ...currentEditingActivity,
          day_uuid: activeItineraryItem.day_uuid,
          name: activityFormData.name || "",
          time: activityFormData.time || "00:00",
          description: activityFormData.description || "",
          address: activityFormData.address || null,
          activity_type: activityFormData.activity_type || "Sightseeing",
          ai_plan: false
        };
      
        //upsert activity
        const { data: upserted, error: upsertErr } = await supabase
        .from("activities")
        .upsert([updatedActivity])
        .eq("activity_uuid", updatedActivity.activity_uuid)
        .select()
        .single();

        if (upsertErr) {
          throw new Error (upsertErr.message);
        }

        //resort activities
        if (upserted) {
          const { data: sortedData, error: sortErr } = await supabase
            .from("activities")
            .select("*")
            .eq("day_uuid", upserted.day_uuid)
            .order("time", { ascending: true });
          if (sortErr) {
            throw new Error(sortErr.message);
          }
          if (sortedData) {
            const sortedActivities = sortedData as Activity[];
            const newItinerary = itinerary.map((item) => {
              if (item.day_uuid === upserted.day_uuid) {
                return {
                  ...item,
                  activities: sortedActivities,
                };
              }
              return item;
            });
            setItinerary(newItinerary);
          }
        }
        //setActiveView(`day-${upserted?.day_number}`);
        setActivityFormData(null);
        handleCancelActivityDialog();
        
      }else {
        throw new Error("No activity to save");
      }
    } catch (err) {
      console.error("Failed to save activity", err);
      toast({
        title: "Error",
        description: Error(err).message,
        variant: "destructive",
      })
      handleCancelActivityDialog();
    }
  };

  //delete activity
  const handleDeleteActivity = async () => {
    try {
      if (currentEditingActivity) {
        const { error } = await supabase
          .from("activities")
          .delete()
          .eq("activity_uuid", currentEditingActivity.activity_uuid);
        if (error) {
          throw new Error(error.message);
        }
        //resort activities
        const { data: sortedData, error: sortErr } = await supabase
          .from("activities")
          .select("*")
          .eq("day_uuid", currentEditingActivity.day_uuid)
          .order("time", { ascending: true });
        if (sortErr) {
          throw new Error(sortErr.message);
        }
        if (sortedData) {
          const sortedActivities = sortedData as Activity[];
          const newItinerary = itinerary.map((item) => {
            if (item.day_uuid === currentEditingActivity.day_uuid) {
              return {
                ...item,
                activities: sortedActivities,
              };
            }
            return item;
          });
          setItinerary(newItinerary);
        }
      } else {
        throw new Error("No activity to delete");
      }
    } catch (err) {
      console.error("Failed to delete activity", err);
      toast({
        title: "Error",
        description: Error(err).message,
        variant: "destructive",
      });
    } finally {
      handleCancelActivityDialog();
    }
  }
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
          <Plus className="mr-2 h-4 w-4" /> {t("addDay")}
        </Button>
      </header>
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
              <span className={cn("font-bold")}>{t("dayNumber", {dayNumber:item.day_number})}</span>
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
                  
                    <WeatherCard
                    temperature={item.temperature}
                      wmoCode={item.weather_icon}
                    />
                  
                <div className="absolute inset-0 flex items-end p-4">
                  <div className="text-slate-600 flex-grow text-left">
                    <h2 className="font-bold text-3xl font-headline">
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
              <ul className="flex flex-col gap-1">
                {item.activities.map((activity, actIndex) => {
                  const icon = getIconText(
                    activity.activity_type,
                    activityOptions
                  );
                  const ActivityIcon = iconMap[icon];
                  return (
                    <li key={activity.activity_uuid} className="relative flex items-stretch pb-2 gap-4 border-b last:border-b-0 border-gray-400"> 
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-muted bg-primary">
                          {ActivityIcon && <ActivityIcon className="h-7 w-7" />}
                        </div>
                        
                        {/* {actIndex < item.activities.length - 1 && (
                          <div className="w-[2px] flex-1 bg-primary/30 my-1 translate-y-1"></div>
                        )} */}
                      </div>

                      <div className="flex flex-col gap-0">
                        <div>
                          <p className="font-semibold text-slate-700">{formatTimeHHMM(activity.time)} </p>
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
                          <MapPin className="mr-2 h-4 w-4 text-primary" />
                          <p className="text-muted-foreground italic">{activity.address}</p>
                        </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center ml-auto mr-4">
                        <a 
                          href={activity.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.address)}` : "#"}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                            // If no address, disable clicks and look "faded"
                            !activity.address ? "pointer-events-none bg-gray-100 text-gray-300" : "bg-gray-200 text-gray-500 hover:bg-gray-400 hover:text-white"
                          )}
                          onClick={(e) => {
                            // Extra safety: stop the click if no address exists
                            if (!activity.address) e.preventDefault();
                          }}
                        >
                          <button 
                          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-primary hover:text-white transition-colors ",
                            !activity.address ? "pointer-events-none bg-gray-100 text-gray-300" : "bg-gray-200 text-gray-500 hover:bg-primary hover:text-white")}
                          >
                          <Map className="h-5 w-5"/>
                        </button>
                        </a>
                      </div>
                      <div className="absolute top-1 right-0 z-10 text-gray-400 hover:cursor-pointer" onClick={() => handleEditActivity(activity)}>
                        <EllipsisVertical className="h-4 w-4" />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex justify-center items-center gap-2">
                <a
                   onClick={handleAddActivity}
                  className="bg-gray-200 border-white text-slate-600 hover:bg-primary hover:text-white shrink-0 flex flex-col lg:flex-row justify-center items-center gap-3 p-4 rounded-lg hover:cursor-pointer transition-colors"
                >
                  <CirclePlus className=" h-8 w-8" /> 
                  <span className="text-xl font-bold">{t("addNewActivity")}</span>
                </a>
              </div>
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
              <DialogTitle>{t("dayNumber", {dayNumber : editingItem.day_number})} : {editingItem.date}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("dayTitle")}</Label>
                <Input
                  id="title"
                  value={editingItem.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                />
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editingItem.date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                />
              </div> */}
              <div className="space-y-2">
              {/* <DayActivities
                activities={editingItem.activities}
                activityOptions={activityOptions}
                onAddActivity={handleAddActivity}
                onDeleteActivity={handleDeleteActivity}
                onActivityChange={handleActivityChange}
              /> */}
                <div className="space-y-2">
                  <Label htmlFor="remarks">{t("feedback")}</Label>
                  <Textarea
                    id="remarks"
                    value={editingItem.feedback || ""}
                    onChange={(e) =>
                      handleFieldChange("feedback", e.target.value)
                    }
                    placeholder={t("feedbackPlaceholder")}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-col sm:justify-between sm:space-x-0 gap-2">
              <div  className="flex gap-2">
                <Button variant="outline" onClick={handleOpenAiPlan} className="w-full">
                  <Brain className="h-4 w-4" />
                  {t("aiPlan")}
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
                        <AlertDialogTitle>{t("deleteDay", {dayNumber : editingItem.day_number})}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("deleteDayWarning")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{ct("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteDay}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {ct("delete")}
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
                  <Button onClick={handleSave} className="w-full">{t("addDay")}</Button>
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
            <DialogTitle>{t("aiPlan")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t("aiTripPreferencesDescription")} 
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-900">
                {ct("remainingAiRequests")} <span className="text-lg font-bold text-blue-600">{Math.max(0, localAiRateLimit - localAiRate)}/{localAiRateLimit}</span>
              </p>
              {localAiRateLimit - localAiRate <= 0 && (
                <p className="text-xs text-red-600 mt-1">{ct("reacheAILimitTmr")}</p>
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
                  <Label className="w-1/6">{ct("suggestions")}</Label>
                  <Input
                    id="ai-suggestions"
                    type="text"
                    placeholder={ct("suggestionsPlaceholder")}
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
            <Button 
              onClick={handleApplyAiPlan}
              disabled={isAiPlanLoading || (localAiRateLimit - localAiRate <= 0)}
              title={localAiRateLimit - localAiRate <= 0 ? ct("reacheAILimit") : ""}
            >
              {isAiPlanLoading ? ct("Generateloading") : localAiRateLimit - localAiRate <= 0 ? ct("limitReached") : ct("Apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}

      {isActivityDialogOpen && (
              <Dialog
                open={isActivityDialogOpen}
                onOpenChange={(isOpen) => {
                  if (!isOpen) {
                    handleCancelActivityDialog();
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {currentEditingActivity ? t("editActivity") + " - " + currentEditingActivity?.name : t("addNewActivity")}
                    </DialogTitle>
                  </DialogHeader>
      
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="act-name">{t("activityName")}*</Label>
                      <Input
                        id="act-name"
                        value={activityFormData?.name || ""}
                        onChange={(e) =>
                          setActivityFormData({ ...activityFormData, name: e.target.value })
                        }
                        placeholder={t("activityNamePlaceholder")}
                      />
                    </div>                    
                    <div className="grid gap-2">
                      <Label htmlFor="act-type">{t("activityType")}*</Label>
                      <Select
                        value={activityFormData?.activity_type || "Sightseeing"}
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
                      <Label htmlFor="act-time">{t("activityTime")}*</Label>
                      <Input
                        id="act-time"
                        type="time"
                        value={activityFormData?.time || "00:00"}
                        onChange={(e) =>
                          setActivityFormData({ ...activityFormData, time: e.target.value })
                        }
                      />
                    </div>      
                    <div className="grid gap-2">
                      <Label htmlFor="act-desc">{t("activityDescription")}</Label>
                      <Input
                        id="act-desc"
                        value={activityFormData?.description || ""}
                        onChange={(e) =>
                          setActivityFormData({
                            ...activityFormData,
                            description: e.target.value,
                          })
                        }
                        placeholder={t("activityDescriptionPlaceholder")}
                      />
                    </div>
      
                    <div className="grid gap-2">
                      <Label htmlFor="act-addr">{t("activityAddress")}</Label>
                      <Input
                        id="act-addr"
                        value={activityFormData?.address || ""}
                        onChange={(e) =>
                          setActivityFormData({
                            ...activityFormData,
                            address: e.target.value,
                          })
                        }
                        placeholder={t("activityAddressPlaceholder")}
                      />
                    </div>
                  </div>
      
                  <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:justify-between">
                    {currentEditingActivity && (
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
                    <Button type="button" onClick={handleSaveActivity} className="w-full">
                      {currentEditingActivity ? t("saveChanges") : t("addActivity")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {isAiPlanLoading &&
              <LoadingOverlay
                isLoading={isAiPlanLoading}
                message="AI is thinking..."
              /> 
            }
    </div>
  );
}
