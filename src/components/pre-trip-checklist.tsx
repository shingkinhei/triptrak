"use client";
import React, { useState, useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
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
import { GripVertical, Trash2, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";
import type { ChecklistItem } from "@/lib/types";

interface PreTripChecklistProps {
  checklist: ChecklistItem[];
  tripId: string;
}

export const PreTripChecklist = ({
  checklist: initialChecklist,
  tripId,
}: PreTripChecklistProps) => {
  const [checklist, setChecklist] = useState(initialChecklist);
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

  const handleAddItem = async () => {
    if (newItemLabel.trim()) {
      const maxSeq = checklist.reduce(
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
      setChecklist((prev) => [...prev, newItem]);
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
    const originalChecklist = [...checklist];
    setChecklist((prev) =>
      prev.filter((item) => item.checklist_uuid !== id)
    );

    supabase
      .from("pre_trip_checklist")
      .delete()
      .eq("checklist_uuid", id)
      .then(({ error }) => {
        if (error) {
          toast({
            title: "Error Deleting Item",
            description: error.message,
            variant: "destructive",
          });
          setChecklist(originalChecklist);
        }
      });
  };

  const handleLabelBlur = async (item: ChecklistItem, label: string) => {
    if (label.trim() === item.label) return;

    const { error } = await supabase
      .from("pre_trip_checklist")
      .update({ label: label.trim() })
      .eq("checklist_uuid", item.checklist_uuid);

    if (error) {
      toast({
        title: "Error Updating Label",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const originalChecklist = [...checklist];
    const items = Array.from(checklist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setChecklist(items);

    // Persist new order
    const updates = items.map((item, index) => ({
      checklist_uuid: item.checklist_uuid,
      seq: index,
    }));

    for (const u of updates) {
      const { error } = await supabase
        .from("pre_trip_checklist")
        .update({ seq: u.seq })
        .eq("checklist_uuid", u.checklist_uuid);

      if (error) {
        toast({
          title: "Error Updating Order",
          description: error.message,
          variant: "destructive",
        });
        setChecklist(originalChecklist);
        break;
      }
    }
  };

  return (
    <div className="mt-2">
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="checklist-main">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {checklist.map((item, index) => (
                  <Draggable
                    key={item.checklist_uuid}
                    draggableId={item.checklist_uuid}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-3 p-2 bg-background/40 rounded-md"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab text-muted-foreground"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <Checkbox
                          id={item.checklist_uuid}
                          onCheckedChange={(checked) =>
                            handleCheckChange(item, !!checked)
                          }
                          checked={item.checked}
                        />
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            setChecklist((prev) =>
                              prev.map((i) =>
                                i.checklist_uuid === item.checklist_uuid
                                  ? { ...i, label: e.target.value }
                                  : i
                              )
                            )
                          }
                          onBlur={(e) =>
                            handleLabelBlur(item, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          className={cn(
                            "flex-grow h-8 text-sm",
                            item.checked &&
                              "text-muted-foreground line-through"
                          )}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete checklist item?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "
                                {item.label}" from your pre-trip checklist.
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

        <div className="flex items-center gap-2 pt-4 border-t mt-4">
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
      </CardContent>
    </div>
  );
};