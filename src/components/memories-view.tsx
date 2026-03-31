"use client";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Trash2 } from "lucide-react";
import Image from "next/image";
import { FC, useRef, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import {
  ArrowLeft
} from "lucide-react";
import Compressor from "compressorjs";
import type { Trip, TripDayPhotos } from "@/lib/types";

const compressFile = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.6,
      maxWidth: 1200,
      // 轉換成與原始檔案同名但內容壓縮後的 File 物件
      success(result: Blob) {
        const compressedFile = new File([result], file.name, {
          type: result.type,
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      },
      error(err) {
        console.error('壓縮失敗:', err.message);
        reject(err);
      },
    });
  });
};
type MemoriesViewProps = {
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip | undefined>>;
} 
export const MemoriesView: FC<MemoriesViewProps> = ({ trip, setTrip }) => {
  const supabase = createClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string>(
    trip.itinerary[0]?.day_uuid || ""
  );
  const [allPhotos, setAllPhotos] = useState<TripDayPhotos[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<TripDayPhotos | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<TripDayPhotos | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

//   const allPhotos = useMemo(() => {
//     const photos: Array<
//       TripDayPhotos & { day_title: string; day_date: string | null }
//     > = [];
//     trip.itinerary.forEach((day) => {
//       (day.tripDayPhotos || []).forEach((p) => {
//         photos.push({
//           ...(p as TripDayPhotos),
//           day_title: day.title,
//           day_date: day.date,
//         });
//       });
//     });
//     return photos.sort((a, b) => {
//       const da = a.day_date || "";
//       const db = b.day_date || "";
//       return da.localeCompare(db);
//     });
//   }, [trip]);

  useEffect(() => {
    const fetchPhotes = async () => {
        // if (!selectedDayId) return;
        const { data: photos, error } = await supabase
            .from("trip_photos")
            .select("*")
            .eq("day_uuid", selectedDayId)
            .order("seq", { ascending: true });
        if (error) {
            toast({
                title: "Error fetching photos",
                description: error.message,
                variant: "destructive",
            });
        } else if (photos) {
            setAllPhotos(photos as TripDayPhotos[]);
             setTrip((prev) =>
                prev
                    ? {
                          ...prev,
                          itinerary: prev.itinerary.map((day) =>
                              day.day_uuid === selectedDayId
                                  ? { ...day, tripDayPhotos: photos as TripDayPhotos[] }
                                  : day
                          ),
                      }
                    : prev
            );
        }
    };
    fetchPhotes();
  }, [selectedDayId, supabase, toast, setTrip]);

  if (!trip) {
    return null;
    }

  const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || !selectedDayId) return;
  const files = Array.from(e.target.files);
  setIsUploading(true);

  try {
    // 1. 身份檢查
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not Authenticated");

    const currentDay = trip.itinerary.find(d => d.day_uuid === selectedDayId);
    let startSeq = currentDay?.tripDayPhotos?.length ?? 0;

    // 2. 併發處理所有文件 (壓縮 -> 上傳 -> 寫入 DB)
    const uploadPromises = files.map(async (file, i) => {
      // A. 壓縮圖片
      const compressedFile = await compressFile(file);
      
      // B. 準備路徑
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${user.id}/${trip.trip_uuid}/${selectedDayId}/${Date.now()}-${i}.${ext}`;

      // C. 上傳至 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("day_feedback")
        .upload(filePath, compressedFile); // 使用壓縮後的檔案

      if (uploadError) throw uploadError;

      // D. 獲取 Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("day_feedback")
        .getPublicUrl(filePath);

      // E. 準備寫入資料庫的物件
      return {
        photo_uuid: uuidv4(),
        day_uuid: selectedDayId,
        seq: startSeq + i,
        url: publicUrl,
        user_id: user.id,
      };
    });

    const photoRows = await Promise.all(uploadPromises);

    // 3. 一次性寫入資料庫 (更有效率)
    const { error: insertError } = await supabase
      .from("trip_photos")
      .insert(photoRows);

    if (insertError) throw insertError;

    toast({ 
      title: "成功", 
      description: 
      `已上傳照片` 
    });

    // 4. 更新狀態
    setAllPhotos(prev => [...prev, ...photoRows]);
    setTrip(prev => prev ? {
      ...prev,
      itinerary: prev.itinerary.map(day =>
        day.day_uuid === selectedDayId
          ? { ...day, tripDayPhotos: [...(day.tripDayPhotos || []), ...photoRows] }
          : day
      ),
    } : prev);
  } catch (error: any) {
    toast({
      title: "上傳失敗",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setIsUploading(false);
  }
};

  // const handleUploadChange = async (
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   if (!e.target.files || !selectedDayId) return;
  //   const files = Array.from(e.target.files);
  //   if (files.length === 0) return;

  //   setIsUploading(true);

  //   const {
  //     data: { user },
  //   } = await supabase.auth.getUser();
  //   if (!user) {
  //     toast({
  //       title: "Not Authenticated",
  //       description: "You must be logged in to upload photos.",
  //       variant: "destructive",
  //     });
  //     setIsUploading(false);
  //     return;
  //   }

  //   const currentDay = trip.itinerary.find(
  //     (d) => d.day_uuid === selectedDayId
  //   );
  //   let startSeq = currentDay?.tripDayPhotos?.length ?? 0;

  //   for (let i = 0; i < files.length; i++) {
  //     const file = files[i];
  //     const ext = (file.name.split(".").pop() || "jpg")
  //       .toLowerCase()
  //       .replace(/[^a-z0-9]/gi, "");
  //     const filePath = `${user.id}/${trip.trip_uuid}/${selectedDayId}/${Date.now()}-${i}.${ext || "jpg"}`;

  //     const { error: uploadError } = await supabase.storage
  //       .from("day_feedback")
  //       .upload(filePath, file, { upsert: false });

  //     if (uploadError) {
  //       toast({
  //         title: "Photo upload failed",
  //         description: uploadError.message,
  //         variant: "destructive",
  //       });
  //       continue;
  //     }

  //     const { data: urlData } = supabase.storage
  //       .from("day_feedback")
  //       .getPublicUrl(filePath);
  //     const publicUrl = urlData.publicUrl;

  //     const photoRow = {
  //       photo_uuid: uuidv4(),
  //       day_uuid: selectedDayId,
  //       seq: startSeq,
  //       url: publicUrl,
  //       user_id: user.id,
  //     };

  //     const { error: insertError } = await supabase
  //       .from("trip_photos")
  //       .insert(photoRow);
  //     if (insertError) {
  //       toast({
  //         title: "Save failed",
  //         description: insertError.message,
  //         variant: "destructive",
  //       });
  //     } else {
  //       startSeq += 1;
  //     }
  //   }

  //   const { data: freshPhotos, error: fetchError } = await supabase
  //     .from("trip_photos")
  //     .select("*")
  //     .eq("day_uuid", selectedDayId)
  //     .order("seq", { ascending: true });

  //   if (fetchError) {
  //     toast({
  //       title: "Refresh failed",
  //       description: fetchError.message,
  //       variant: "destructive",
  //     });
  //   } else if (freshPhotos) {
  //     setTrip((prev) =>
  //       prev
  //         ? {
  //             ...prev,
  //             itinerary: prev.itinerary.map((day) =>
  //               day.day_uuid === selectedDayId
  //                 ? {
  //                     ...day,
  //                     tripDayPhotos: freshPhotos as TripDayPhotos[],
  //                   }
  //                 : day
  //             ),
  //           }
  //         : prev
  //     );
  //     toast({
  //       title: "Photos uploaded",
  //       description: `${files.length} photo(s) added to your memories.`,
  //     });
  //   }

  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  //   setIsUploading(false);
  // };

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;

    setIsDeleting(true);
    try {
      // Delete from storage
      const storageKey = photoToDelete.url.split("/day_feedback/").pop();
      if (storageKey) {
        const { error: storageError } = await supabase.storage
          .from("day_feedback")
          .remove([storageKey]);

        if (storageError) {
          console.warn("Storage delete error:", storageError.message);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("trip_photos")
        .delete()
        .eq("photo_uuid", photoToDelete.photo_uuid);

      if (dbError) {
        toast({
          title: "Error deleting photo",
          description: dbError.message,
          variant: "destructive",
        });
        setIsDeleting(false);
        return;
      }

      // Resequence remaining photos
      const { data: remainingPhotos } = await supabase
        .from("trip_photos")
        .select("*")
        .eq("day_uuid", selectedDayId)
        .order("seq", { ascending: true });

      if (Array.isArray(remainingPhotos)) {
        for (let idx = 0; idx < remainingPhotos.length; idx++) {
          const p = remainingPhotos[idx];
          if (p.seq !== idx) {
            await supabase
              .from("trip_photos")
              .update({ seq: idx })
              .eq("photo_uuid", p.photo_uuid);
          }
        }
      }

      // Update local state
      setAllPhotos((prev) =>
        prev.filter((p) => p.photo_uuid !== photoToDelete.photo_uuid)
      );

      setTrip((prev) =>
        prev
          ? {
              ...prev,
              itinerary: prev.itinerary.map((day) =>
                day.day_uuid === selectedDayId
                  ? {
                      ...day,
                      tripDayPhotos: day.tripDayPhotos?.filter(
                        (p) => p.photo_uuid !== photoToDelete.photo_uuid
                      ),
                    }
                  : day
              ),
            }
          : prev
      );

      setViewingPhoto(null);
      setPhotoToDelete(null);

      toast({
        title: "Photo deleted",
        description: "The photo has been removed from your memories.",
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast({
        title: "Error",
        description: "Failed to delete photo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <header className="flex items-center gap-2">
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
            onClick={() => router.push("/trips")}
        >
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>

          <h1 className="text-2xl font-bold font-headline text-primary-foreground">
            Photos & Memories
          </h1>
        </div>
      </header>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select
            value={selectedDayId}
            onValueChange={setSelectedDayId}
          >
            <SelectTrigger id="memories-day" className="h-9">
              <SelectValue placeholder="Select a day" />
            </SelectTrigger>
            <SelectContent>
              {trip.itinerary.map((day) => (
                <SelectItem key={day.day_uuid} value={day.day_uuid}>
                  Day {day.day_number}: {day.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUploadChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !selectedDayId}
            className="h-9"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      {allPhotos.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-card/40 p-6 text-center">
          <div>
            <Camera className="mx-auto mb-2 h-8 w-8 text-primary" />
            <p className="text-sm text-primary-foreground">
              No memories yet. Upload some photos to start your trip gallery.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 pb-4">
            {allPhotos.map((photo) => (
              <div
                key={photo.photo_uuid}
                className="relative group aspect-square overflow-hidden rounded-md bg-black/20"
              >
                <button
                  type="button"
                  onClick={() => setViewingPhoto(photo)}
                  className="w-full h-full"
                >
                  <Image
                    src={photo.url}
                    alt="Trip memory"
                    fill
                    className="object-cover"
                  />
                </button>
                {/* Delete button - visible on hover */}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoToDelete(photo);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewingPhoto && (
        <Dialog
          open={!!viewingPhoto}
          onOpenChange={() => setViewingPhoto(null)}
        >
          <DialogContent className="max-w-3xl p-2 bg-transparent border-0 shadow-none">
            <DialogHeader>
              <DialogTitle className="sr-only">
                Full screen memory photo
              </DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-auto">
              <Image
                src={viewingPhoto.url}
                alt="Trip memory"
                width={1920}
                height={1080}
                className="rounded-lg object-contain w-full h-auto max-h-[80vh]"
              />
              {/* Delete button in full screen view */}
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-4 right-4 h-10 w-10"
                onClick={() => {
                  setPhotoToDelete(viewingPhoto);
                  setViewingPhoto(null);
                }}
                title="Delete photo"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!photoToDelete} onOpenChange={(open) => !open && setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhoto}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MemoriesView;