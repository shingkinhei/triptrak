"use client";
import React, { useRef, useState, useMemo, useEffect } from "react";
import type { ShoppingItems, Trip } from "@/lib/types";
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
import { date } from "zod";

interface ShoppingListProps {
  list: ShoppingItems[];
  setList: React.Dispatch<React.SetStateAction<ShoppingItems[]>>;
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
function getIconText(
  name: string,
  options: shoppingCategoryOption[],
  fallback: string = "ShoppingBasket" // default fallback icon
): string {
  const match = options.find((opt) => opt.name === name);
  return match ? match.icon_text : fallback;
}

export function ShoppingList({
  list,
  setList,
  onCheckChange,
  trip,
}: ShoppingListProps) {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItems[]>(
    trip.shoppingItems
  );
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // State for main dialogs
  // State for editing items
  const [editingItem, setEditingItem] = useState<{
    item: ShoppingItems;
  } | null>(null);
  const [editItemFormData, setEditItemFormData] = useState<
    Partial<ShoppingItems> & { file?: File | null; previewUrl?: string | null }
  >({});

  useEffect(() => {
    const fetchShoppingItems = async () => {
      const { data, error } = await supabase
        .from("shopping_items")
        .select(
          "item_uuid, shopping_category, name, checked, image_url, price, user_id, store, address, trip_uuid, pcs"
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

    fetchShoppingItems();
    fetchShoppingCategoryOptions();
  }, [trip.trip_uuid]);

  const pointsOfInterest = useMemo(() => {
    if (!trip || !trip.itinerary) return [];
    const allPois = trip.itinerary.flatMap((day) =>
      day.activities.map((activity) => ({
        name: activity.description,
        address: activity.address || "",
      }))
    );

    return allPois.filter((poi) =>
      editingItem ? poi.address === editingItem.item.address : true
    );
  }, [trip]);

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
      setEditItemFormData((prev) => ({
        ...prev,
        price: parseFloat(convertUsdToCurrency(convertCurrencyToUsd(number, tripRate),
        homeRate).toFixed(2)) || 0,
      }));
    } else {
      setEditItemFormData((prev) => ({
        ...prev,
        price: parseFloat(convertUsdToCurrency(convertCurrencyToUsd(number, homeRate),
        tripRate).toFixed(2)) || 0,
      }));
    }
  };

  const handleCheckChange = async (item: ShoppingItems, checked: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const originalState = [...list];
    setList((prevList) =>
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
      setList(originalState);
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
      setEditingItem({ item });
      setEditItemFormData({
        ...item,
        price:
          displayCurrency === "trip"
            ? parseFloat((item.price * tripRate).toFixed(2))
            : parseFloat((item.price * homeRate || 0).toFixed(2)),
        previewUrl: item.image_url,
      });
      setIsEditDialogOpen(true);
    }, 150);
  };

  const handleUpdateItem = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to create a trip.",
        variant: "destructive",
      });
      return;
    }

    if (!editingItem) return;

    if (!editingItem.item.name.trim()) {
      toast({
        title: "Error",
        description: "Item name is required.",
        variant: "destructive",
      });
    }

    if (!editingItem.item.shopping_category) {
      toast({
        title: "Error",
        description: "Item category is required.",
        variant: "destructive",
      });
    }

    try {
      let newImageUrl: string | null = null;

      if (editItemFormData.file) {
        const file = editItemFormData.file;
        const fileExt = (file.name.split(".").pop() || "jpg").replace(
          /[^a-z0-9]/gi,
          ""
        );
        const filePath = `${user.id}/${trip.trip_uuid}/${
          editingItem.item.item_uuid
        }-${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("shopping_item_photo")
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
          .from("shopping_item_photo")
          .getPublicUrl(filePath);
        newImageUrl = urlData.publicUrl;
      } else if (!editItemFormData.previewUrl) {
        newImageUrl = null;
      }

      const updatedItem = {
        ...editingItem.item,
        ...editItemFormData,
        price:
          parseFloat(
            String(
              displayCurrency === "trip"
                ? convertCurrencyToUsd(editItemFormData.price || 0, tripRate)
                : editItemFormData.price ||
                    convertCurrencyToUsd(
                      editItemFormData.price || 0,
                      homeRate
                    ) ||
                    0
            )
          ) || 0,
        pcs:
          parseInt(String(editItemFormData.pcs ?? editingItem.item.pcs ?? 1)) ||
          1,
        image_url: editItemFormData.previewUrl || newImageUrl,
      } as ShoppingItems;
      delete (updatedItem as any).file;
      delete (updatedItem as any).previewUrl;

      setList((prevList) =>
        prevList.map((item) =>
          item.item_uuid === editingItem.item.item_uuid ? updatedItem : item
        )
      );

      const { data, error } = await supabase
        .from("shopping_items")
        .update(updatedItem)
        .eq("item_uuid", updatedItem.item_uuid)
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
    }
    setEditingItem(null);
    setEditItemFormData({});
    setIsEditDialogOpen(false);
  };

  const handleDeleteItem = async () => {
    if (!editingItem) return;

    const itemUuid = editItemFormData.item_uuid;

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
      const newShoppingItems = shoppingItems.filter(
        (d) => d.item_uuid !== itemUuid
      );

      setShoppingItems(newShoppingItems);
      setIsEditDialogOpen(false);
      setEditItemFormData({});

      setList((shoppingItems) =>
        shoppingItems.filter((d) => d.item_uuid !== itemUuid)
      );

      setEditingItem(null);
      setIsEditDialogOpen(false);
      setEditItemFormData({});

      toast({
        title: "Item deleted",
        description: `${editingItem.item.name} removed.`,
      });
    } catch (err: any) {
      console.error("Item deletion failed", err);
      toast({
        title: "Error",
        description: err?.message || String(err),
        variant: "destructive",
      });
    }
  };

  const handleEditItemFormChange = (
    field: keyof typeof editItemFormData,
    value: string | File | number | null
  ) => {
    if (field === "file" && value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditItemFormData((prev) => ({
          ...prev,
          file: value,
          previewUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(value);
    } else if (typeof value === "string") {
      if (field === "store") {
        setEditItemFormData((prev) => ({
          ...prev,
          store: value,
          address: getAddressForStore(value),
        }));
      } else {
        setEditItemFormData((prev) => ({ ...prev, [field]: value }));
      }
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      new Compressor(file, {
        maxWidth: 1200,
        success: (compressedResult) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setEditItemFormData((prev) => ({
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
          // Fallback to original file
          const reader = new FileReader();
          reader.onloadend = () => {
            setEditItemFormData((prev) => ({
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

  const handleClearNewItemImage = () => {
    setEditItemFormData((prev) => ({
      ...prev,
      item_image: null,
      item_image_preview: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const calculateTotal = (items: ShoppingItems[]) => {
    return items.reduce(
      (total, item) => total + (item.price || 0) * (item.pcs ?? 1),
      0
    );
  };

  const baseGrandTotal = (list ?? []).reduce(
    (total, item) => total + (item.price || 0) * (item.pcs ?? 1),
    0
  );

  const grouped = useMemo(() => {
    const map: Record<string, ShoppingItems[]> = {};
    (list ?? []).forEach((i) => {
      const key = i.shopping_category || "General";
      if (!map[key]) map[key] = [];
      map[key].push(i);
    });
    return Object.keys(map).map((k) => ({ name: k, items: map[k] }));
  }, [list]);

  const grandTotalInCurrent =
    displayCurrency === "trip"
      ? convertUsdToCurrency(baseGrandTotal, tripRate)
      : convertUsdToCurrency(baseGrandTotal, homeRate);

  const currencyButtonLabel =
    displayCurrency === "trip"
      ? `${tripCurrency} \u2194 ${homeCurrency}`
      : `${homeCurrency} \u2194 ${tripCurrency}`;

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
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
              Shopping List
            </h1>
          </div>
        </div>
        <div />
      </header>

      <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardDescription>Grand Total ({currentCurrency})</CardDescription>
              <CardTitle className="text-card-foreground">
                {currentFormatter(grandTotalInCurrent)}
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleCurrency()}
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
                        <DropdownMenu>
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
                        </DropdownMenu>

                        <div className="relative aspect-square w-full">
                          {item.image_url && (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          )}
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
                              {qty} pcs
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

      {editingItem && (
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleCancelEdit();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit: {editingItem.item.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  value={editItemFormData.name || ""}
                  onChange={(e) =>
                    handleEditItemFormChange("name", e.target.value)
                  }
                  placeholder="e.g. Japanese KitKats"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price">
                  Price (
                  {displayCurrency === "trip" ? tripCurrency : homeCurrency})
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="item-price"
                    type="number"
                    step="0.01"
                    ref={priceInputRef}
                    value={editItemFormData.price || 0}
                    onChange={(e) =>
                      handleEditItemFormChange("price", e.target.value)
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
                <Label htmlFor="item-pcs">Quantity (pcs)</Label>
                <Input
                  id="item-pcs"
                  type="number"
                  step="1"
                  value={editItemFormData.pcs ?? 1}
                  onChange={(e) =>
                    handleEditItemFormChange("pcs", e.target.value)
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Select
                  value={editItemFormData.shopping_category || ""}
                  onValueChange={(value) =>
                    handleEditItemFormChange("shopping_category", value)
                  }
                >
                  <SelectTrigger id="item-category">
                    <SelectValue placeholder="Select a category" />
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
                <Label htmlFor="item-store">Store / POI</Label>
                <Select
                  value={editItemFormData.store || ""}
                  onValueChange={(value) =>
                    handleEditItemFormChange("store", value)
                  }
                  disabled={!pointsOfInterest || pointsOfInterest.length === 0}
                >
                  <SelectTrigger id="item-store">
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {pointsOfInterest.map((poi) => (
                      <SelectItem key={poi.name} value={poi.name}>
                        {poi.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pointsOfInterest.find((p) => p.name === editItemFormData.store)
                  ?.address && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {
                      pointsOfInterest.find(
                        (p) => p.name === editItemFormData.store
                      )?.address
                    }
                    <input
                      type="hidden"
                      value={
                        pointsOfInterest.find(
                          (p) => p.name === editItemFormData.store
                        )?.address
                      }
                    ></input>
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image (Optional)</Label>
              <div className="flex items-center gap-4">
                {editItemFormData.previewUrl && (
                  <Image
                    src={editItemFormData.previewUrl}
                    alt="preview"
                    width={60}
                    height={60}
                    className="rounded-md object-cover"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleEditImageChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Change
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleClearNewItemImage()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
            <DialogFooter className="flex items-center justify-between">
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this shopping item.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteItem}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateItem}>Save Changes</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
