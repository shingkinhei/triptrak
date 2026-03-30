"use client";
import React, { type FC } from "react";
// import type { FC } from 'react';
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BottomNav, type Tab } from "@/components/ui/bottom-nav";
import { ExpenseTracker } from "@/components/expense-tracker";
import { ShoppingList } from "@/components/shopping-list";
import MemoriesView from "@/components/memories-view";
import { TripPlanner } from "@/components/trip-planner";
import { useCurrency } from "@/context/CurrencyContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  Currency,
  Expenses,
  Trip,
  ShoppingItems,
  ItineraryItem,
  Activity,
  ChecklistItem,
  TripDayPhotos,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { debounce, set } from "lodash";
import { v4 as uuidv4 } from "uuid";
import Compressor from "compressorjs";
import {
  Repeat,
  Upload,
  PlusCircle,
  Camera,
  type LucideIcon,
  Luggage,
  Plane,
  Train,
  BedDouble,
  UtensilsCrossed,
  Ticket,
  Mountain,
  Building,
  Home,
  ShoppingBag,
  Gift,
  Shirt,
  ShoppingBasket,
  Trash2,
} from "lucide-react";

type NewItemInput = ShoppingItems & {
  item_image?: File | null;
  item_image_preview?: string | null;
};

interface TabContentProps {
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip | undefined>>;
  activeTab: Tab;
  aiRate?: number;
  aiRateLimit?: number;
}
type shoppingCategoryOption = {
  name: string;
  icon_text: string;
  color_code?: string | null;
  description?: string | null;
  shopping_categories_seq?: number | null;
};
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


const TabContent: FC<TabContentProps> = ({ trip, setTrip, activeTab, aiRate, aiRateLimit }) => {
  const supabase = createClient();
  const { toast } = useToast();
  const { tripCurrency } = useCurrency();

  const handleShoppingItemCheck = (itemId: string, checked: boolean) => {
    let checkedItemName: string | undefined;
    let checkedItemPrice: number | undefined;

    const newList = trip.shoppingItems.map((item) => {
      if (item.item_uuid === itemId) {
        if (checked && item.price && item.price >= 0) {
          checkedItemName = item.name;
          checkedItemPrice = item.price;
        }
        return { ...item, checked };
      }
      return item;
    });

    setTrip((currentTrip) =>
      currentTrip ? { ...currentTrip, shopping_list: newList } : undefined
    );

    if (checkedItemName && checkedItemPrice) {
      const newExpense: Expenses = {
        expense_uuid: uuidv4(),
        name: checkedItemName,
        expense_category: "Shopping",
        amount: checkedItemPrice,
        date: new Date().toISOString().split("T")[0],
        trip_uuid: trip.trip_uuid,
        currency_code: tripCurrency,
        user_id: trip.user_id || null,
      };
    }
  };

  const tabComponents: Record<Tab, React.ComponentType<any>> = {
    planner: TripPlanner,
    memories: MemoriesView,
    expenses: ExpenseTracker,
    shopping: ShoppingList,
  };

  const setExpenses = (updater: React.SetStateAction<Expenses[]>) => {
    setTrip((currentTrip) => {
      if (!currentTrip) return undefined;
      const newExpenses =
        typeof updater === "function"
          ? updater(currentTrip.expenses)
          : updater;
      return { ...currentTrip, expenses: newExpenses };
    });
  };

  const setShoppingList = (updater: React.SetStateAction<ShoppingItems[]>) => {
    setTrip((currentTrip) => {
      if (!currentTrip) return undefined;
      const newShoppingList =
        typeof updater === "function"
          ? updater(currentTrip.shoppingItems)
          : updater;
      return { ...currentTrip, shoppingItems: newShoppingList };
    });
  };



  const componentProps = {
    planner: {
      trip: trip,
      aiRate: aiRate,
      aiRateLimit: aiRateLimit,
    },
    memories: {
      trip: trip,
      setTrip: setTrip,
    },
    expenses: {
      trip: trip,
    },
    shopping: {
      list: trip.shoppingItems,
      setList: setShoppingList,
      onCheckChange: handleShoppingItemCheck,
      trip: trip,
    },
  };

  const ActiveComponent = tabComponents[activeTab];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="h-full overflow-y-auto px-4 pb-4 pt-8"
      >
        <ActiveComponent {...componentProps[activeTab]} />
      </motion.div>
    </AnimatePresence>
  );
};

export default function TripDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tripUuId = pathname.split("/").pop();

  const [trip, setTrip] = useState<Trip | undefined>();
  const [activeTab, setActiveTab] = useState<Tab>("planner");
  const {
    tripRate,
    setHomeCurrency,
    tripCurrency,
    setTripCurrency,
    formatCurrency,
    homeCurrency,
    homeRate,
    convertCurrencyToUsd,
    convertUsdToCurrency,
    formatHomeCurrency,
    displayCurrency,
    setDisplayCurrency,
  } = useCurrency();
  const supabase = createClient();
  const { toast } = useToast();
  const [ShoppingCategoryOption, setShoppingCategoryOption] = useState<
    shoppingCategoryOption[]
  >([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<NewItemInput>({
    item_uuid: uuidv4(),
    trip_uuid: "",
    shopping_category: "",
    name: "",
    store: "",
    address: null,
    checked: false,
    image_url: null,
    price: 0,
    pcs: 1,
    user_id: null,
    item_image: null,
    item_image_preview: null,
  });
  const [aiRate, setAiRate] = useState<number>(0);
  const [aiRateLimit, setAiRateLimit] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {

    const fetchTripData = async () => {
      if (!tripUuId) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from("users_info")
          .select("home_currency,ai_rate_count,ai_rate_limit")
          .eq("user_id", user?.id)
          .single();
        if (error) {
          toast({
            title: "Error fetching home currency",
            description: error.message,
            variant: "destructive",
          });
        } else if (data?.home_currency) {
          setHomeCurrency(data.home_currency);
          setAiRate(data.ai_rate_count || 0);
          setAiRateLimit(data.ai_rate_limit || 0);
        }
      }
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("trip_uuid", tripUuId)
        .single();

      if (tripError) {
        toast({
          title: "Error fetching trip",
          description: tripError.message,
          variant: "destructive",
        });
        router.push("/trips");
        return;
      }

      const { data: daysData, error: daysError } = await supabase
        .from("trip_days")
        .select(`*, activities:activities (*), tripDayPhotos:trip_photos (*)`)
        .eq("trip_uuid", tripUuId)
        .order("day_number", { ascending: true });

      if (daysError) {
        toast({
          title: "Error fetching trip days",
          description: daysError.message,
          variant: "destructive",
        });
      }

      const { data: checklistData, error: checklistError } = await supabase
        .from("pre_trip_checklist")
        .select(`*`)
        .eq("trip_uuid", tripUuId)
        .order("seq", { ascending: true });

      if (checklistError) {
        toast({
          title: "Error fetching checklist",
          description: checklistError.message,
          variant: "destructive",
        });
      }

      const sortedDays = daysData?.map((day) => ({
        ...day,
        activities: day.activities?.sort((a: Activity, b: Activity) =>
          a.time.localeCompare(b.time)
        ),
        tripDayPhotos: day.tripDayPhotos?.sort(
          (a: TripDayPhotos, b: TripDayPhotos) => (a.seq ?? 0) - (b.seq ?? 0)
        ),
      }));

      const enrichedTrip: Trip = {
        ...tripData,
        itinerary: sortedDays || [],
        checklist: checklistData || [],
      };

      setTrip(enrichedTrip);
      if (tripData.country_code) {
        setTripCurrency(tripData.currency_code);
        //setTripCurrencyFromCountry(tripData.country_code);
      }
      // fetch shopping items for this trip and attach to trip state
      const { data: shoppingData, error: shoppingError } = await supabase
        .from("shopping_items")
        .select(
          "item_uuid, shopping_category, name, checked, image_url, price, user_id, store, address, trip_uuid, pcs"
        )
        .eq("trip_uuid", tripUuId);

      if (shoppingError) {
        toast({
          title: "Error fetching shopping items",
          description: shoppingError.message,
          variant: "destructive",
        });
      } else if (shoppingData) {
        setTrip((prev) =>
          prev ? { ...prev, shoppingItems: shoppingData } : prev
        );
      }
      //fetch expense categories for the trip and attach to trip state
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("expense_uuid, trip_uuid, name, expense_category, amount, date, currency_code,user_id")
        .eq("trip_uuid", tripUuId);
      if (expenseError) {
        toast({
          title: "Error fetching expenses",
          description: expenseError.message,
          variant: "destructive",
        });
      } else if (expenseData) {
        setTrip((prev) =>
          prev ? { ...prev, expenses: expenseData } : prev
        );
      }
    };
    fetchTripData();
  }, [tripUuId, router, supabase, toast]);

  useEffect(() => {
    if (trip) {
      // const debouncedUpdater = debounce(async () => {
      //   const { error } = await supabase
      //     .from("shopping_items")
      //     .update({
      //       trip.shoppingItems,
      //     })
      //     .eq("trip_uuid", trip.trip_uuid);

      //   if (error) {
      //     toast({
      //       title: "Error saving trip data",
      //       description: error.message,
      //       variant: "destructive",
      //     });
      //   }
      // }, 1500);

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

      // debouncedUpdater();
      fetchShoppingCategoryOptions();
      // return () => debouncedUpdater.cancel();
    }
  }, [trip, supabase, toast]);

  const pointsOfInterest = useMemo(() => {
    if (!trip || !trip.itinerary) return [];
    const allPois = trip.itinerary.flatMap((day) =>
      day.activities.map((activity) => ({
        name: activity.description,
        address: activity.address || "",
      }))
    );
    return allPois.filter((poi) =>
      newItem.address ? poi.address === newItem.address : true
    );
  }, [trip, newItem.address]);

  if (!trip) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 font-body bg-background">
        <div>Loading trip...</div>
      </main>
    );
  }

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
      setNewItem((prev) => ({
        ...prev,
        price: parseFloat(convertUsdToCurrency(convertCurrencyToUsd(number, tripRate),
        homeRate).toFixed(2)) || 0,
      }));
    } else {
      setNewItem((prev) => ({
        ...prev,
        price: parseFloat(convertUsdToCurrency(convertCurrencyToUsd(number, homeRate),
        tripRate).toFixed(2)) || 0,
      }));
    }
  };

  const currencyButtonLabel =
    displayCurrency === "trip"
      ? `${tripCurrency} \u2194 ${homeCurrency}`
      : `${homeCurrency} \u2194 ${tripCurrency}`;

  const setShoppingList = (updater: React.SetStateAction<ShoppingItems[]>) => {
    setTrip((currentTrip) => {
      if (!currentTrip) return undefined;
      const newShoppingList =
        typeof updater === "function"
          ? updater(currentTrip.shoppingItems)
          : updater;
      return { ...currentTrip, shoppingItems: newShoppingList };
    });
  };
  const fetchShoppingItems = async () => {
    const { data, error } = await supabase
      .from("shopping_items")
      .select("*")
      .eq("trip_uuid", tripUuId);

    if (error) {
      toast({
        title: "Error fetching shopping items",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setShoppingList(data as ShoppingItems[]);
    }
  };
  const handleDayCoverImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || !newItem) return;
    const file = e.target.files[0];
    if (file) {
      new Compressor(file, {
        quality: 0.6,
        maxWidth: 1200,
        success: (compressedResult) => {
          setNewItem((prev) =>
            prev
              ? { ...prev, item_image: compressedResult as File }
              : { ...newItem, item_image: compressedResult as File }
          );
          const reader = new FileReader();
          reader.onloadend = () => {
            setNewItem((prev) =>
              prev
                ? { ...prev, item_image_preview: reader.result as string }
                : { ...newItem, item_image_preview: reader.result as string }
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
  const handleInputChange = (
    field: keyof NewItemInput,
    value: string | File | null
  ) => {
    if (field === "item_image" && value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem((prev) => ({
          ...prev,
          item_image: value,
          item_image_preview: reader.result as string,
        }));
      };
      reader.readAsDataURL(value);
    } else {
      if (field === "store") {
        setNewItem((prev) => ({
          ...prev,
          store: value as string,
          address: "",
        }));
      } else if (field === "price" || field === "pcs") {
        setNewItem((prev) => ({ ...prev, [field]: Number(value) }));
      } else {
        setNewItem((prev) => ({ ...prev, [field]: value as string }));
      }
    }
  };

  const handleAddItem = async () => {
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

    if (!newItem.name.trim()) {
      toast({
        title: "Error",
        description: "Item name is required.",
        variant: "destructive",
      });
    }

    if (!newItem.shopping_category) {
      toast({
        title: "Error",
        description: "Item category is required.",
        variant: "destructive",
      });
    }

    let newImageUrl: string | null = null;

    if (newItem.item_image) {
      const file = newItem.item_image;
      const fileExt = (file.name.split(".").pop() || "jpg").replace(
        /[^a-z0-9]/gi,
        ""
      );
      const filePath = `${user.id}/${trip.trip_uuid}/${
        newItem.item_uuid
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
    } else if (!newItem.item_image_preview) {
      newImageUrl = null;
    }

    const newItemData: ShoppingItems = {
      item_uuid: uuidv4(),
      trip_uuid: trip.trip_uuid,
      name: newItem.name.trim(),
      shopping_category: newItem.shopping_category,
      checked: false,
      price: parseFloat(
            String(
              displayCurrency === "trip"
                ? convertCurrencyToUsd(newItem.price || 0, tripRate)
                : newItem.price ||
                    convertCurrencyToUsd(
                      newItem.price || 0,
                      homeRate
                    ) ||
                    0
            )
          ) || 0,
      pcs: newItem.pcs || 1,
      image_url:
        newImageUrl ||
        `https://picsum.photos/seed/${newItem.name.trim()}/100/100`,
      address: newItem.address,
      store: newItem.store,
      user_id: user.id,
    };
    // append flat shopping item list
    // setShoppingList(prev => [...prev, newItemData]);

    const { data, error } = await supabase
      .from("shopping_items")
      .insert(newItemData)
      .select()
      .single();
    if (error) {
      toast({
        title: "Error Adding Item",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      fetchShoppingItems();
      setNewItem({
        item_uuid: uuidv4(),
        trip_uuid: trip.trip_uuid,
        shopping_category: "",
        name: "",
        store: "",
        address: null,
        checked: false,
        image_url: null,
        price: 0,
        pcs: 1,
        user_id: null,
        item_image: null,
        item_image_preview: null,
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Item Added!",
        description: `"${data.name}" has been added.`,
      });
    }
  };

  const handleClearNewItemImage = () => {
    setNewItem((prev) => ({
      ...prev,
      item_image: null,
      item_image_preview: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="flex h-screen w-full flex-col bg-background font-body">
      <div
        className="relative flex-grow bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${trip.cover_image_url})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-0 backdrop-blur-sm" />
        <div className="relative z-10 h-full mx-0 lg:mx-24 flex flex-col">
          <div className="flex-grow overflow-hidden">
            <TabContent trip={trip} setTrip={setTrip} activeTab={activeTab} aiRate={aiRate} aiRateLimit={aiRateLimit} />
          </div>
          <BottomNav activeItem={activeTab} setActiveTab={setActiveTab} />
        </div>

        {activeTab === "shopping" && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="absolute bottom-24 right-8 h-16 w-16 rounded-full shadow-lg z-20">
                <PlusCircle className="h-8 w-8" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Shopping Item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={newItem.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
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
                      value={newItem.price  || 0}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
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
                    value={newItem.pcs || 1}
                    onChange={(e) => handleInputChange("pcs", e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-category">Category</Label>
                  <Select
                    value={newItem.shopping_category || ""}
                    onValueChange={(value) =>
                      handleInputChange("shopping_category", value)
                    }
                  >
                    <SelectTrigger id="item-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ShoppingCategoryOption.map((cat) => (
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
                <div className="grid gap-4 py-4">
                  {/* <div className="space-y-2">
                            <Label htmlFor="item-location">Store</Label>
                          <Select value={newItem.address || ''} onValueChange={(value) => handleInputChange('address', value)}>
                                <SelectTrigger id="item-location">
                                    <SelectValue placeholder="Select a location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {itineraryLocations.map(loc => (
                                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div> */}
                  <div className="space-y-2">
                    <Label htmlFor="item-store">Store / POI</Label>
                    <Select
                      value={newItem.store || ""}
                      onValueChange={(value) =>
                        handleInputChange("store", value)
                      }
                      disabled={
                        !pointsOfInterest || pointsOfInterest.length === 0
                      }
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
                    {pointsOfInterest.find((p) => p.name === newItem.store)
                      ?.address && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {
                          pointsOfInterest.find((p) => p.name === newItem.store)
                            ?.address
                        }
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Image (Optional)</Label>
                  <div className="flex items-center gap-4">
                    {newItem.item_image_preview && (
                      <Image
                        src={newItem.item_image_preview}
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
                      onChange={handleDayCoverImageChange}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Upload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearNewItemImage}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Clear
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </main>
  );
}
