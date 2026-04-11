"use client";
import React, { useRef, useState, useMemo, useEffect } from "react";
import type { ShoppingItems, Trip, Activity } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  PlusCircle,
  Plus,
  ListPlus,
  MoreVertical,
  Edit,
  Trash2,
  Repeat,
  Gift,
  Home,
  Plane,
  Shirt,
  ShoppingBasket,
  UtensilsCrossed,
  Luggage,
  type LucideIcon,
  Store,
  MapPin,
  ArrowLeft,
  Camera,
  Upload,
  Train,
  BedDouble,
  Ticket,
  Mountain,
  Building,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import { useCurrency } from "@/context/CurrencyContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
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
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Compressor from "compressorjs";
import { v4 as uuidv4 } from "uuid";
import { formatMMDD } from "@/context/DateFormat";
import { date } from "zod";
import { set } from "lodash";
import { useTranslations } from 'next-intl';

interface ShoppingListProps {
  onCheckChange: (itemId: string, checked: boolean) => void;
  trip: Trip;
}

const iconMap: Record<string, LucideIcon> = {
  Luggage,
  Plane,
  Train,
  BedDouble,
  UtensilsCrossed,
  Camera,
  Ticket,
  Mountain,
  Building,
  Home,
  Gift,
  ShoppingBag,
  Shirt,
  ShoppingBasket,
};

type shoppingCategoryOption = {
  name: string;
  icon_text: string;
  color_code?: string | null;
  description?: string | null;
  shopping_categories_seq?: number | null;
};

type PointsOfInterest = {
  name: string;
  address: string;
  activity_uuid: string;
  day_uuid: string;
  date: string;
}

function getIconText(
  name: string,
  options: shoppingCategoryOption[],
  fallback: string = "ShoppingBasket" // default fallback icon
): string {
  const match = options.find((opt) => opt.name === name);
  return match ? match.icon_text : fallback;
}

export function ShoppingList({
  onCheckChange,
  trip,
}: ShoppingListProps) {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItems[]>([]);
  const {
    tripCurrency,
    tripRate,
    formatCurrency,
    homeCurrency,
    homeRate,
    convertCurrencyToUsd,
    convertUsdToCurrency,
    formatHomeCurrency,
    displayCurrency,
    setDisplayCurrency,
  } = useCurrency();
  const router = useRouter();
  const priceInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { toast } = useToast();
  const [shoppingCategoryOption, setShoppingCategoryOption] = useState<
    shoppingCategoryOption[]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ShoppingItems | null>(null);
  const [itemFormData, setItemFormData] = useState<
    Partial<ShoppingItems> & { file?: File | null; previewUrl?: string | null }
  >({});
  const [pointsOfInterest, setPointsOfInterest] = useState<PointsOfInterest[]>([]);
  const t = useTranslations('shoppingList');
  const ct = useTranslations('common');

  useEffect(() => {
    const fetchShoppingItems = async () => {
      const { data, error } = await supabase
        .from("shopping_items")
        .select(
          "*"
        )
        .eq("trip_uuid", trip.trip_uuid);

      if (error) {
        toast({
          title: "Error fetching shopping items",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        setShoppingItems(data as ShoppingItems[]);
      }
    };

    const fetchShoppingCategoryOptions = async () => {
      const { data, error } = await supabase
        .from("shopping_categories_setup")
        .select(
          "name, icon_text, color_code, description, shopping_categories_seq"
        );

      if (error) {
        toast({
          title: "Error fetching shopping categories",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setShoppingCategoryOption(data as shoppingCategoryOption[]);
      }
    };

    const fetchPointsOfInterest = async () => {
      const { data, error } = await supabase
        .from("v_point_of_interest")
        .select("*")
        .eq("trip_uuid", trip.trip_uuid);
        
      if (error) {
        toast({
          title: "Error fetching Points of Interest for Store",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        setPointsOfInterest(data as PointsOfInterest[]);
      }
    }

    fetchShoppingItems();
    fetchShoppingCategoryOptions();
    fetchPointsOfInterest();
  }, [trip.trip_uuid]);

  const getAddressForStore = (storeName: string) => {
    const poi = pointsOfInterest.find((poi) => poi.name === storeName);
    return poi ? poi.address : "";
  };

  const currentFormatter =
    displayCurrency === "trip" ? formatCurrency : formatHomeCurrency;
  const currentCurrency =
    displayCurrency === "trip" ? tripCurrency : homeCurrency;

  const toggleCurrency = () => {
    setDisplayCurrency(displayCurrency === "trip" ? "home" : "trip");
  };
  const toggleCurrencyForm = (number: number) => {
    setDisplayCurrency(displayCurrency === "trip" ? "home" : "trip");
    if (displayCurrency === "trip") {
      setItemFormData((prev) => ({
        ...prev,
        price:
          parseFloat(
            convertUsdToCurrency(
              convertCurrencyToUsd(number, tripRate),
              homeRate
            ).toFixed(2)
          ) || 0,
      }));
    } else {
      setItemFormData((prev) => ({
        ...prev,
        price:
          parseFloat(
            convertUsdToCurrency(
              convertCurrencyToUsd(number, homeRate),
              tripRate
            ).toFixed(2)
          ) || 0,
      }));
    }
  };

  const handleCheckChange = async (item: ShoppingItems, checked: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const originalState = [...shoppingItems];
    setShoppingItems((prevList) =>
      prevList.map((i) =>
        i.item_uuid === item.item_uuid ? { ...i, checked } : i
      )
    );

    const { error } = await supabase
      .from("shopping_items")
      .update({ checked: checked })
      .eq("item_uuid", item.item_uuid);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update list item.",
        variant: "destructive",
      });
      setShoppingItems(originalState);
    }

    if (checked) {
      const newExpense = {
        name: item.name,
        amount: item.price,
        currency_code: tripCurrency,
        trip_uuid: trip.trip_uuid,
        user_id: user?.id ?? null,
        item_uuid: item.item_uuid,
        date: new Date(),
        expense_category: item.shopping_category,
      };
      const { error } = await supabase.from("expenses").insert(newExpense);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("item_uuid", item.item_uuid);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  // Category operations removed: categories are derived from items' `shopping_category`
  const handleEditItemClick = (item: ShoppingItems) => {
    setTimeout(() => {
      setCurrentItem(item);
      setItemFormData({
        ...item,
        price:
          displayCurrency === "trip"
            ? parseFloat((item.price * tripRate).toFixed(2))
            : parseFloat((item.price * homeRate || 0).toFixed(2)),
        previewUrl: item.image_url,
      });
      setIsDialogOpen(true);
    }, 150);
  };

  const handleUpdateItem = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to update items.",
        variant: "destructive",
      });
      return;
    }

    if (!currentItem) return;

    if (!itemFormData.name?.trim()) {
      toast({
        title: "Error",
        description: "Item name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!itemFormData.shopping_category) {
      toast({
        title: "Error",
        description: "Item category is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      let newImageUrl: string | null = null;

      if (itemFormData.file) {
        const file = itemFormData.file;
        const fileExt = (file.name.split(".").pop() || "jpg").replace(
          /[^a-z0-9]/gi,
          ""
        );
        const filePath = `${user.id}/${trip.trip_uuid}/${
          currentItem.item_uuid
        }-${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("shopping_item_photo")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          toast({
            title: "Error uploading image",
            description: uploadError.message,
            variant: "destructive",
          });
          return;
        }

        const { data: urlData } = supabase.storage
          .from("shopping_item_photo")
          .getPublicUrl(filePath);
        newImageUrl = urlData.publicUrl;
      } else if (!itemFormData.previewUrl) {
        newImageUrl = null;
      }

      const updatedItem = {
        ...currentItem,
        ...itemFormData,
        price:
          parseFloat(
            String(
              displayCurrency === "trip"
                ? convertCurrencyToUsd(itemFormData.price || 0, tripRate)
                : itemFormData.price ||
                    convertCurrencyToUsd(itemFormData.price || 0, homeRate) ||
                    0
            )
          ) || 0,
        pcs:
          parseInt(String(itemFormData.pcs ?? currentItem.pcs ?? 1)) || 1,
        image_url: itemFormData.previewUrl || newImageUrl,
      } as ShoppingItems;
      delete (updatedItem as any).file;
      delete (updatedItem as any).previewUrl;

      setShoppingItems((prevList) =>
        prevList.map((item) =>
          item.item_uuid === currentItem.item_uuid ? updatedItem : item
        )
      );

      const { item_id, created_at, ...payload } = updatedItem as any;

      const { data, error } = await supabase
        .from("shopping_items")
        .upsert(payload)
        .eq("item_uuid", payload.item_uuid)
        .select()
        .single();
      if (error) {
        toast({
          title: "Error Updating Item",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        toast({
          title: "Item Updated",
          description: `${data.name} has been updated.`,
        });
      }
    } catch (error) {
      console.error("Item update failed", error);
      toast({
        title: "Error",
        description: "Failed to update item.",
        variant: "destructive",
      });
    } finally {
      setIsDialogOpen(false);
      setCurrentItem(null);
      setItemFormData({});
    }
  };

  const handleAddItem = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to add items.",
        variant: "destructive",
      });
      return;
    }

    if (!itemFormData.name?.trim()) {
      toast({
        title: "Error",
        description: "Item name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!itemFormData.shopping_category) {
      toast({
        title: "Error",
        description: "Item category is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      let newImageUrl: string | null = null;

      if (itemFormData.file) {
        const file = itemFormData.file;
        const fileExt = (file.name.split(".").pop() || "jpg").replace(
          /[^a-z0-9]/gi,
          ""
        );
        const itemUuid = uuidv4();
        const filePath = `${user.id}/${trip.trip_uuid}/${itemUuid}-${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("shopping_item_photo")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          toast({
            title: "Error uploading image",
            description: uploadError.message,
            variant: "destructive",
          });
          return;
        }

        const { data: urlData } = supabase.storage
          .from("shopping_item_photo")
          .getPublicUrl(filePath);
        newImageUrl = urlData.publicUrl;
      }

      const newItem = {
        item_uuid: uuidv4(),
        name: itemFormData.name.trim(),
        price: parseFloat(
          String(
            displayCurrency === "trip"
              ? convertCurrencyToUsd(itemFormData.price || 0, tripRate)
              : convertCurrencyToUsd(itemFormData.price || 0, homeRate)
          )
        ) || 0,
        pcs: parseInt(String(itemFormData.pcs ?? 1)) || 1,
        shopping_category: itemFormData.shopping_category,
        store: itemFormData.store || null,
        address: itemFormData.address || null,
        image_url: newImageUrl,
        checked: false,
        trip_uuid: trip.trip_uuid,
        user_id: user.id,
      } as ShoppingItems;

      const { data, error } = await supabase
        .from("shopping_items")
        .insert(newItem)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error adding item",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        setShoppingItems((prevList) => [...prevList, data as ShoppingItems]);
        toast({
          title: "Item added",
          description: `${data.name} has been added to your shopping list.`,
        });
        setItemFormData({});
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Item addition failed", error);
      toast({
        title: "Error",
        description: "Failed to add item.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!currentItem) return;

    const itemUuid = currentItem.item_uuid;

    try {
      const { data: photo, error: photosErr } = await supabase
        .from("shopping_items")
        .select("image_url")
        .eq("item_uuid", itemUuid)
        .single();

      if (photosErr) {
        toast({
          title: "Error",
          description: photosErr.message,
          variant: "destructive",
        });
      }

      // Remove storage objects for any photos that have been uploaded
      if (photo?.image_url) {
        const url = photo.image_url || "";
        const key = url.split("/shopping_items/").pop();
        if (key) {
          const { error: delErr } = await supabase.storage
            .from("shopping_items")
            .remove([key]);
          if (delErr) console.warn("Storage delete error", delErr.message);
        }
      }

      // Delete DB row: shopping_items
      const { error: DelErr } = await supabase
        .from("shopping_items")
        .delete()
        .eq("item_uuid", itemUuid);
      if (DelErr) {
        toast({
          title: "Error deleting day",
          description: DelErr.message,
          variant: "destructive",
        });
        return;
      }

      // Update local UI
      const fetchItems = async () => {
        const { data, error } = await supabase
          .from("shopping_items")
          .select()
          .eq("trip_uuid", trip.trip_uuid);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setShoppingItems(data as ShoppingItems[]);
        }
      };

      setShoppingItems((prev) =>
        prev.filter((item) => item.item_uuid !== itemUuid)
      );
      toast({
        title: "Item deleted",
        description: `${currentItem?.name} removed.`,
      });
      handleCancelDialog();
    } catch (err: any) {
      console.error("Item deletion failed", err);
      toast({
        title: "Error",
        description: err?.message || String(err),
        variant: "destructive",
      });
    }
  };

  const handleItemFormChange = (
    field: keyof typeof itemFormData,
    value: string | File | number | null
  ) => {
    if (field === "file" && value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemFormData((prev) => ({
          ...prev,
          file: value,
          previewUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(value);
    } else if (typeof value === "string") {
      if (field === "store") {
        setItemFormData((prev) => ({
          ...prev,
          store: value,
          address: getAddressForStore(value),
        }));
      } else {
        setItemFormData((prev) => ({ ...prev, [field]: value }));
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      new Compressor(file, {
        maxWidth: 1200,
        success: (compressedResult) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setItemFormData((prev) => ({
              ...prev,
              file: compressedResult as File,
              previewUrl: reader.result as string,
            }));
          };
          reader.readAsDataURL(compressedResult);
        },
        error: (err) => {
          toast({
            title: "Image compression failed",
            description: err.message,
            variant: "destructive",
          });
          const reader = new FileReader();
          reader.onloadend = () => {
            setItemFormData((prev) => ({
              ...prev,
              file: file,
              previewUrl: reader.result as string,
            }));
          };
          reader.readAsDataURL(file);
        },
      });
    }
  };

  const handleClearItemImage = () => {
    setItemFormData((prev) => ({
      ...prev,
      file: null,
      previewUrl: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const calculateTotal = (items: ShoppingItems[]) => {
    return items.reduce(
      (total, item) => total + (item.price || 0) * (item.pcs ?? 1),
      0
    );
  };

  const baseGrandTotal = (shoppingItems ?? []).reduce(
    (total, item) => total + (item.price || 0) * (item.pcs ?? 1),
    0
  );

  const grouped = useMemo(() => {
    const map: Record<string, ShoppingItems[]> = {};
    (shoppingItems ?? []).forEach((i) => {
      const key = i.shopping_category || "General";
      if (!map[key]) map[key] = [];
      map[key].push(i);
    });
    return Object.keys(map).map((k) => ({ name: k, items: map[k] }));
  }, [shoppingItems]);

  const grandTotalInCurrent =
    displayCurrency === "trip"
      ? convertUsdToCurrency(baseGrandTotal, tripRate)
      : convertUsdToCurrency(baseGrandTotal, homeRate);

  const currencyButtonLabel =
    displayCurrency === "trip"
      ? `${tripCurrency} \u2194 ${homeCurrency}`
      : `${homeCurrency} \u2194 ${tripCurrency}`;

  const handleCancelDialog = () => {
    setIsDialogOpen(false);
    setCurrentItem(null);
    setItemFormData({});
  };

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
          <div>
            <h1 className="text-2xl font-bold font-headline text-primary-foreground">
              {t(`title`)}
            </h1>
          </div>
        </div>
          <Button
            onClick={() => {
              setCurrentItem(null);
              setItemFormData({});
              setIsDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 absolute bottom-24 right-8 h-16 w-16 rounded-full shadow-lg z-20 p-0"
            size="icon"
          >
            <Plus className="!h-8 !w-8" />
          </Button>
      </header>

      <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardDescription>{t(`grandTotal`)} ({currentCurrency})</CardDescription>
              <CardTitle className="text-card-foreground">
                {currentFormatter(grandTotalInCurrent)}
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleCurrency()}
              className= {displayCurrency === "trip" ? `bg-primary text-white` : `text-black bg-white`}
            >
              <Repeat className="h-4 w-4 mr-2" />
              <span>{currencyButtonLabel}</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {grouped.map((group) => {
          const baseCategoryTotal = calculateTotal(group.items);
          const categoryTotalInCurrent =
            displayCurrency === "trip"
              ? convertUsdToCurrency(baseCategoryTotal, tripRate)
              : convertUsdToCurrency(baseCategoryTotal, homeRate);
          const CategoryIcon =
            iconMap[getIconText(group.name, shoppingCategoryOption)];
          return (
            <Card
              key={group.name}
              className="bg-card/80 backdrop-blur-sm border-white/20 shadow-lg"
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-headline text-card-foreground flex items-center gap-2">
                    {CategoryIcon && (
                      <CategoryIcon className="h-5 w-5 text-primary" />
                    )}
                    {group.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-card-foreground">
                      {currentFormatter(categoryTotalInCurrent)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-4 grid-cols-2 gap-4">
                  {group.items.map((item) => {
                    const baseItemPrice = item.price || 0;
                    const qty = item.pcs ?? 1;
                    const itemPriceInCurrent =
                      displayCurrency === "trip"
                        ? convertUsdToCurrency(baseItemPrice * qty, tripRate)
                        : convertUsdToCurrency(baseItemPrice * qty, homeRate);
                    return (
                      <Card
                        key={item.item_uuid}
                        className={cn(
                          "overflow-hidden relative bg-card/80 backdrop-blur-sm border-white/20 shadow-lg",
                          item.checked && "opacity-50"
                        )}
                      >
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            id={`${item.item_uuid}`}
                            checked={item.checked}
                            onCheckedChange={(checked) =>
                              handleCheckChange(item, !!checked)
                            }
                            className="h-5 w-5 bg-background border-2"
                          />
                        </div>
                        <div className="z-20 absolute top-2 right-2 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 pointer-events-auto" onClick={() => handleEditItemClick(item)}>
                            <Edit className="h-4 w-4" color="white"/>
                            <span className="sr-only">Edit Trip</span>
                          </Button>
                        </div>
                        {/* <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-7 w-7 z-10 bg-black/30 text-white hover:bg-black/50 hover:text-white"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleEditItemClick(item)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu> */}

                        <div className="relative aspect-square w-full">
                          <Image
                            src={item.image_url || "/images/shopping_item_sample.jpeg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                          {item.checked && (
                            <div className="absolute inset-0 bg-background/60"></div>
                          )}
                        </div>
                        <div className="p-2 space-y-1">
                          <p
                            className={cn(
                              "text-sm font-medium leading-tight truncate text-card-foreground",
                              item.checked
                                ? "text-muted-foreground line-through"
                                : "text-card-foreground"
                            )}
                          >
                            {item.name}
                          </p>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {item.store && (
                              <div className="flex items-center gap-1">
                                <Store className="h-3 w-3" />
                                <span>{item.store}</span>
                              </div>
                            )}
                            {item.address && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{item.address}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p
                              className={cn(
                                "text-xs text-muted-foreground",
                                item.checked
                                  ? "text-muted-foreground line-through"
                                  : "text-card-foreground"
                              )}
                            >
                              {qty} {t("pcs")}
                            </p>
                            <p
                              className={cn(
                                "text-xs font-semibold pt-1 text-card-foreground",
                                item.checked
                                  ? "text-muted-foreground line-through"
                                  : "text-card-foreground"
                              )}
                            >
                              {currentFormatter(itemPriceInCurrent)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                {currentItem ? `${currentItem.name}` : t(`addItem`)}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[70vh] pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">{t(`itemName`)}*</Label>
                <Input
                  id="item-name"
                  value={itemFormData.name || ""}
                  onChange={(e) =>
                    handleItemFormChange("name", e.target.value)
                  }
                  placeholder="e.g. Japanese KitKats"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price">
                  {t(`price`)} (
                  {displayCurrency === "trip" ? tripCurrency : homeCurrency})*
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="item-price"
                    type="number"
                    step="0.01"
                    ref={priceInputRef}
                    value={itemFormData.price || 0}
                    onChange={(e) =>
                      handleItemFormChange("price", e.target.value)
                    }
                    placeholder="e.g. 15.00"
                  />
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                       const value = priceInputRef?.current?.value;
                        if (value) {
                          toggleCurrencyForm(parseFloat(value) || 0);
                        }
                      }
                    }
                  >
                    <Repeat className="h-4 w-4 mr-2" />
                    <span>{currencyButtonLabel}</span>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-pcs">{t(`quantity`)}*</Label>
                <Input
                  id="item-pcs"
                  type="number"
                  step="1"
                  value={itemFormData.pcs ?? 1}
                  onChange={(e) =>
                    handleItemFormChange("pcs", e.target.value)
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">{t(`category`)}*</Label>
                <Select
                  value={itemFormData.shopping_category || ""}
                  onValueChange={(value) =>
                    handleItemFormChange("shopping_category", value)
                  }
                >
                  <SelectTrigger id="item-category">
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {shoppingCategoryOption.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const IconComp =
                              iconMap[cat.icon_text as keyof typeof iconMap];
                            return IconComp ? (
                              <IconComp className="h-4 w-4" />
                            ) : (
                              <PlusCircle className="h-4 w-4" />
                            );
                          })()}
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-store">{t(`store`)}</Label>
                <Select
                  value={itemFormData.store || ""}
                  onValueChange={(value) =>
                    handleItemFormChange("store", value)
                  }
                  disabled={!pointsOfInterest || pointsOfInterest.length === 0}
                >
                  <SelectTrigger id="item-store">
                    <SelectValue placeholder={t('selectStore')} />
                  </SelectTrigger>
                  <SelectContent>
                    {pointsOfInterest.map((poi) => (
                      <SelectItem key={poi.activity_uuid} value={poi.name}>
                        {formatMMDD(poi.date)} - {poi.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pointsOfInterest.find((p) => p.name === itemFormData.store)
                  ?.address && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {
                      pointsOfInterest.find(
                        (p) => p.name === itemFormData.store
                      )?.address
                    }
                    <input
                      type="hidden"
                      value={
                        pointsOfInterest.find(
                          (p) => p.name === itemFormData.store
                        )?.address
                      }
                    ></input>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-items-start gap-2">
                  <Label>{t(`image`)}</Label>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleClearItemImage}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Image
                    src={itemFormData.previewUrl || "/images/shopping_item_sample.jpeg"}
                    alt="preview"
                    width={600}
                    height={800}
                    className="rounded-md object-cover"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-row sm:flex-row items-center justify-around gap-2">
              {currentItem && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{ct("delete")} - {currentItem.name}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t(`deleteConfirmation`)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{ct("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteItem}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {ct("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                onClick={currentItem ? handleUpdateItem : handleAddItem}
                className="w-full"
              >
                {currentItem ? t("saveChanges") : t("addNewItem")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
