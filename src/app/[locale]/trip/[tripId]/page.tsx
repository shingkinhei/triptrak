"use client";
import React, { type FC } from "react";
// import type { FC } from 'react';
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BottomNav, type Tab } from "@/components/ui/bottom-nav";
import { ExpenseTracker } from "@/components/expense-tracker";
import { ShoppingList } from "@/components/shopping-list";
import { MemoriesView } from "@/components/memories-view";
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
  Loader2,
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
import { useTranslations } from "next-intl";

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

  // const handleShoppingItemCheck = (itemId: string, checked: boolean) => {
  //   let checkedItemName: string | undefined;
  //   let checkedItemPrice: number | undefined;

  //   // const newList = (trip.shoppingItems ?? []).map((item) => {
  //   //   if (item.item_uuid === itemId) {
  //   //     if (checked && item.price && item.price >= 0) {
  //   //       checkedItemName = item.name;
  //   //       checkedItemPrice = item.price;
  //   //     }
  //   //     return { ...item, checked };
  //   //   }
  //   //   return item;
  //   // });

  //   setTrip((currentTrip) =>
  //     currentTrip ? { ...currentTrip, shopping_list: newList } : undefined
  //   );

  //   if (checkedItemName && checkedItemPrice) {
  //     const newExpense: Expenses = {
  //       expense_uuid: uuidv4(),
  //       name: checkedItemName,
  //       expense_category: "Shopping",
  //       amount: checkedItemPrice,
  //       date: new Date().toISOString().split("T")[0],
  //       trip_uuid: trip.trip_uuid,
  //       currency_code: tripCurrency,
  //       user_id: trip.user_id || null,
  //     };
  //   }
  // };

  const tabComponents: Record<Tab, React.ComponentType<any>> = {
    planner: TripPlanner,
    memories: MemoriesView,
    expenses: ExpenseTracker,
    shopping: ShoppingList,
  };

  // const setExpenses = (updater: React.SetStateAction<Expenses[]>) => {
  //   setTrip((currentTrip) => {
  //     if (!currentTrip) return undefined;
  //     const newExpenses =
  //       typeof updater === "function"
  //         ? updater(currentTrip.expenses)
  //         : updater;
  //     return { ...currentTrip, expenses: newExpenses };
  //   });
  // };

  // const setShoppingList = (updater: React.SetStateAction<ShoppingItems[]>) => {
  //   setTrip((currentTrip) => {
  //     if (!currentTrip) return undefined;
  //     const newShoppingList =
  //       typeof updater === "function"
  //         ? updater(currentTrip.shoppingItems)
  //         : updater;
  //     return { ...currentTrip, shoppingItems: newShoppingList };
  //   });
  // };



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
  const ct = useTranslations("common");

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

      const basicTrip: Trip = {
        ...tripData,
      };

      setTrip(basicTrip);
      if (tripData.country_code) {
        setTripCurrency(tripData.currency_code);
      }
    };
    fetchTripData();
  }, [tripUuId, router, supabase, toast]);

  if (!trip) {
    return (
      <main className="flex flex-col min-h-screen items-center justify-center p-4 font-body bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div>{ct("loading")}</div>
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

  // const setShoppingList = (updater: React.SetStateAction<ShoppingItems[]>) => {
  //   setTrip((currentTrip) => {
  //     if (!currentTrip) return undefined;
  //     const newShoppingList =
  //       typeof updater === "function"
  //         ? updater(currentTrip.shoppingItems)
  //         : updater;
  //     return { ...currentTrip, shoppingItems: newShoppingList };
  //   });
  // };
  // const fetchShoppingItems = async () => {
  //   const { data, error } = await supabase
  //     .from("shopping_items")
  //     .select("*")
  //     .eq("trip_uuid", tripUuId);

  //   if (error) {
  //     toast({
  //       title: "Error fetching shopping items",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   } else if (data) {
  //     setShoppingList(data as ShoppingItems[]);
  //   }
  // };
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
        newImageUrl || '',
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
      // fetchShoppingItems();
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

  if (!trip) {
    return (<div className="flex flex-col items-center justify-center flex-grow gap-4 text-center text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div>Loading trip...</div>
      </div>);
  }

  return (
    <main className="flex h-screen w-full flex-col bg-background font-body">
      <div
        className="relative flex-grow bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${trip.cover_image_url || "https://rodtfkraukblqbshlazo.supabase.co/storage/v1/object/public/trip_cover/trip_cover_sample.jpg"})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-0 backdrop-blur-sm" />
        <div className="relative z-10 h-full mx-0 lg:mx-24 flex flex-col">
          <div className="flex-grow overflow-hidden">
            <TabContent trip={trip} setTrip={setTrip} activeTab={activeTab} aiRate={aiRate} aiRateLimit={aiRateLimit} />
          </div>
          <BottomNav activeItem={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </main>
  );
}
