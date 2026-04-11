"use client";
import { use, useEffect, useState, useRef, useMemo } from "react";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  Label as ChartLabel,
} from "recharts";
import {
  MoreVertical,
  Edit,
  Trash2,
  type LucideIcon,
  Luggage,
  Plane,
  Train,
  BedDouble,
  UtensilsCrossed,
  Camera,
  Ticket,
  Mountain,
  Building,
  PlusCircle,
  Plus,
  Repeat,
  ArrowLeft,
  Home,
  Gift,
  ShoppingBag,
  Shirt,
  ShoppingBasket,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

import type { Expenses, Trip } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useCurrency } from "@/context/CurrencyContext";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";
import { set } from "lodash";
import { userInfo } from "os";

interface ExpenseTrackerProps {
  expensesInfo: Expenses[];
  setExpenses: React.Dispatch<React.SetStateAction<Expenses[]>>;
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
  PlusCircle,
  Home,
  Gift,
  ShoppingBag,
  Shirt,
  ShoppingBasket,
};

interface ExpenseTrackerProps {
  trip: Trip;
}
// const expenseCategories: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Accommodation', 'Other'];

// const categoryIcons: Record<ExpenseCategory, React.ElementType> = {
//   Food: Pizza,
//   Transport: Train,
//   Shopping: ShoppingBag,
//   Accommodation: Hotel,
//   Other: PlusCircle,
// };
type ExpenseCategoryOption = {
  name: string;
  icon_text: string;
  color_code: string | "--chart-1";
  description?: string | null;
  shopping_categories_seq?: number | null;
};
function getIconText(
  name: string,
  options: ExpenseCategoryOption[],
  fallback: string = "ShoppingBasket" // default fallback icon
): string {
  const match = options.find((opt) => opt.name === name);
  return match ? match.icon_text : fallback;
}

function getChartColor(
  name: string,
  options: ExpenseCategoryOption[],
  fallback: string = "--chart-1" // default fallback icon
): string {
  const match = options.find((opt) => opt.name === name);
  return match ? match.color_code : fallback;
}

// const getChartData = (expenses: Expenses[], rate: number, homeRate: number) => {
//     const categoryTotals = expenses?.reduce((acc, t) => {
//         const amountInBase = t.amount / rate;
//         const amountInHome = amountInBase * homeRate;
//         acc[t.expense_category] = (acc[t.expense_category] || 0) + (rate === 1 ? t.amount : amountInHome);
//         return acc;
//     }, {} as Record<string, number>)?? {};
//     return Object.entries(categoryTotals).map(([name, total]) => ({
//         name,
//         total,
//         fill: "#FFFFFF" //`var(--color-${name.toLowerCase()})`
//     }));
// };

const calculateTotal = (items: Expenses[]) => {
  return items.reduce((total, item) => total + (item.amount || 0), 0);
};

//   const chartConfig = {
//   food: {
//     label: "Food",
//     color: "hsl(var(--chart-1))",
//   },
//   transport: {
//     label: "Transport",
//     color: "hsl(var(--chart-2))",
//   },
//   shopping: {
//     label: "Shopping",
//     color: "hsl(var(--chart-3))",
//   },
//   accommodation: {
//     label: "Accommodation",
//     color: "hsl(var(--chart-4))",
//   },
//   other: {
//     label: "Other",
//     color: "hsl(var(--chart-5))",
//   },
// } satisfies ChartConfig;
interface ChartCategory {
  label: string;
  color: string;
  icon?: string;
  description?: string;
}

export function ExpenseTracker({ trip }: ExpenseTrackerProps) {
  const [expenseCategoryOption, setExpenseCategoryOption] = useState<
    ExpenseCategoryOption[]
  >([]);
  const [newExpense, setNewExpense] = useState<{
    name: string;
    expense_category: string;
    amount: number;
    date: string;
    currency_code: string;
    trip_uuid: string;
  }>({
    name: "",
    expense_category: "",
    amount: 0,
    date: Date.now().toString(),
    currency_code: "USD",
    trip_uuid: trip.trip_uuid
  });
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
    rates,
  } = useCurrency();
  const [expenses, setExpenses] = useState<Expenses[]>([]);
  const [editingExpense, setEditingExpense] = useState<
    Partial<Expenses>
  >({
    name: "",
    expense_category: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    currency_code: "",
    trip_uuid: trip.trip_uuid
  });
  const [editExpenseFormData, setEditExpenseFormData] = useState<
    Partial<Expenses>
  >({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});

  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const currentFormatter =
    displayCurrency === "trip" ? formatCurrency : formatHomeCurrency;
  const currentCurrency =
    displayCurrency === "trip" ? tripCurrency : homeCurrency;

  const totalExpenses = expenses?.reduce((sum, t) => sum + t.amount, 0) ?? 0;

  const totalExpensesInCurrent =
    displayCurrency === "trip"
      ? convertUsdToCurrency(totalExpenses, tripRate)
      : convertUsdToCurrency(totalExpenses, homeRate);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // const chartData = getChartData(expenses, displayCurrency === 'trip' ? 1 : tripRate, homeRate);

  useEffect(() => {
    const fetchExpenseCategories = async () => {
      // Fetch distinct expense categories from expenses for the current trip
      const { data, error } = await supabase
        .from("expense_categories_setup")
        .select(
          "name, icon_text, color_code, description, expense_category_seq"
        );
      if (error) {
        console.error("Error fetching expense categories:", error);
      } else if (data) {
        console.log("Expense categories fetched:", data);
        setExpenseCategoryOption(data as ExpenseCategoryOption[]);

        const config: ChartConfig = {};
        data.forEach((row) => {
          config[row.name.toLowerCase()] = {
            label: row.name,
            color: row.color_code || "hsl(var(--chart-1))",
            icon: row.icon_text || undefined,
          };
        });
        setChartConfig(config);
      }
    };
    const fetchExpenses = async () => {
      // Fetch transactions for the new trip from your data source here
      const { data, error } = await supabase
        .from("expenses")
        .select(
          "expense_uuid, trip_uuid, name, expense_category, amount, date, currency_code"
        )
        .eq("trip_uuid", trip.trip_uuid);
      if (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: "Error",
          description: "Failed to load transactions.",
          variant: "destructive",
        });
      } else if (data) {
        setExpenses(data as Expenses[]);
        //const chartData = getChartData(expenses, displayCurrency === 'trip' ? 1 : tripRate, homeRate);
        // }
      }
    };
    fetchExpenses();
    fetchExpenseCategories();
  }, [trip.trip_uuid]);

  const grouped = useMemo(() => {
    const map: Record<string, Expenses[]> = {};
    (expenses ?? []).forEach((i) => {
      const key = i.expense_category || "Others";
      if (!map[key]) map[key] = [];
      map[key].push(i);
    });
    console.log(
      Object.keys(map).map((k) => ({
        name: k,
        total: calculateTotal(map[k]),
        color: getChartColor(map[k][0].expense_category, expenseCategoryOption),
        items: map[k],
      }))
    );
    return Object.keys(map).map((k) => ({
      name: k,
      total: calculateTotal(map[k]),
      color: getChartColor(map[k][0].expense_category, expenseCategoryOption),
      items: map[k],
    }));
  }, [expenses]);

  // useEffect(() => {
  //   // Reset new transaction form when dialog is closed
  //   if (!isAddDialogOpen) {
  //     setNewTransaction({ name: '', expense_category: '', amount: '' });
  //   }
  // }, [isAddDialogOpen]);

  // useEffect(() => {
  //   // Close dialog when transaction is added
  //   if (newTransaction.name || newTransaction.expense_category || newTransaction.amount) {
  //     setIsAddDialogOpen(false);
  //   }
  // })

  // useEffect(() => {
  //   // Reset transactions when trip changes
  //   if (!trip.trip_uuid) return;

  // }, [trip.trip_uuid]);

  // const handleAddExpense = async () => {
  //   if (
  //     !newExpense.name ||
  //     !newExpense.expense_category ||
  //     !newExpense.amount ||
  //     !newExpense.date
  //   ) {
  //     toast({
  //       title: "Incomplete Data",
  //       description: "Please fill in all the required fields.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   const {
  //     data: { user },
  //   } = await supabase.auth.getUser();

  //   const newTx: Expenses = {
  //     expense_uuid: uuidv4(),
  //     trip_uuid: trip.trip_uuid,
  //     name: newExpense.name,
  //     expense_category: newExpense.expense_category,
  //     amount:
  //       displayCurrency === "trip"
  //         ? convertCurrencyToUsd(newExpense.amount, tripRate)
  //         : convertUsdToCurrency(newExpense.amount, homeRate),
  //     date: new Date().toISOString().split("T")[0],
  //     currency_code: displayCurrency === "trip" ? tripCurrency : homeCurrency,
  //     user_id: user?.id ?? null,
  //   };

  //   // Add the new transaction to the list
  //   const { data, error } = await supabase.from("expenses").insert([newTx]);

  //   if (error) {
  //     console.error("Error adding transaction:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to add transaction.",
  //       variant: "destructive",
  //     });
  //     return;
  //     // }
  //   } else if (data) {
  //     setExpenses([newTx, ...expenses]);
  //     setNewExpense({
  //       name: "",
  //       expense_category: "",
  //       amount: 0,
  //       date: new Date().toString(),
  //       currency_code: displayCurrency === "trip" ? tripCurrency : homeCurrency,
  //       trip_uuid: trip.trip_uuid,
  //     });
  //     setIsAddDialogOpen(false);
  //   }
  // };

  const toggleCurrency = () => {
    setDisplayCurrency(displayCurrency === "trip" ? "home" : "trip");
  };

  const currencyButtonLabel =
    displayCurrency === "trip"
      ? `${tripCurrency} \u2194 ${homeCurrency}`
      : `${homeCurrency} \u2194 ${tripCurrency}`;

  const toggleCurrencyForm = (number: number) => {
    setDisplayCurrency(displayCurrency === "trip" ? "home" : "trip");
    if (displayCurrency === "trip") {
      setEditExpenseFormData((prev) => ({
        ...prev,
        amount:
          parseFloat(
            convertUsdToCurrency(
              convertCurrencyToUsd(number, tripRate),
              homeRate
            ).toFixed(2)
          ) || 0,
      }));
    } else {
      setEditExpenseFormData((prev) => ({
        ...prev,
        amount:
          parseFloat(
            convertUsdToCurrency(
              convertCurrencyToUsd(number, homeRate),
              tripRate
            ).toFixed(2)
          ) || 0,
      }));
    }
  };

  const handleEditExpenseFormChange = (
    field: keyof typeof editExpenseFormData,
    value: string | number | null
  ) => {
    if (typeof value === "number") {
      if (field === "amount") {
        setEditExpenseFormData((prev) => ({
          ...prev,
          amount: value,
        }));
      }
    } else {
      setEditExpenseFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingExpense(null);
    setEditExpenseFormData(null);
  };

  const validateExpenseForm = (): { valid: boolean; message?: string } => {
    if (
      !editExpenseFormData.name ||
      !editExpenseFormData.expense_category ||
      !editExpenseFormData.amount ||
      !editExpenseFormData.date
    ) {
      return { valid: false, message: 'Please fill out all fields to create a trip.' };
    }
    return { valid: true };
  }
  const handleUpdateExpense = async () => {
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

    if (!editingExpense) return;

    const { valid, message } = validateExpenseForm();
    if (!valid) {
      toast({ title: 'Invalid Information', description: message, variant: 'destructive' });
      return;
    }

    try {
      const updateExpense = {
        ...editingExpense,
        ...editExpenseFormData,
        amount:
          parseFloat(
            String(
              displayCurrency === "trip"
                ? convertCurrencyToUsd(
                    editExpenseFormData.amount || 0,
                    tripRate
                  )
                : editExpenseFormData.amount ||
                    convertCurrencyToUsd(
                      editExpenseFormData.amount || 0,
                      homeRate
                    ) ||
                    0
            )
          ) || 0,
          trip_uuid: trip.trip_uuid,
          currency_code: displayCurrency === "trip" ? tripCurrency : homeCurrency
      } as Expenses;

      setExpenses((prevList) =>
        prevList.map((item) =>
          item.expense_uuid === editingExpense.expense_uuid
            ? updateExpense
            : item
        )
      );

      const { data, error } = await supabase
        .from("expenses")
        .upsert(updateExpense)
        .eq("expense_uuid", updateExpense.expense_uuid)
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

    
    setEditingExpense(null);
    setEditExpenseFormData({});
    setIsEditDialogOpen(false);
  };

  const handleDeleteExpense = async () => {
    if (!editingExpense) return;

    const expenseUuid = editingExpense.expense_uuid;

    // Delete DB row: Expenses
    try {
      const { error: DelErr } = await supabase
        .from("expenses")
        .delete()
        .eq("expense_uuid", expenseUuid);
      if (DelErr) {
        toast({
          title: "Error deleting expense",
          description: DelErr.message,
          variant: "destructive",
        });
        return;
      }

      // Update local UI
      const newExpenses = expenses.filter(
        (d) => d.expense_uuid !== expenseUuid
      );

      setExpenses(newExpenses);
      setIsEditDialogOpen(false);
      setEditExpenseFormData({});

      setExpenses((expenses) =>
        expenses.filter((d) => d.expense_uuid !== expenseUuid)
      );

      setEditingExpense(null);
      setIsEditDialogOpen(false);
      setEditExpenseFormData({});

      toast({
        title: "Item deleted",
        description: `${editingExpense.name} removed.`,
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
  const handleEditExpenseClick = (item: Expenses) => {
    setTimeout(() => {
      setEditingExpense(item as Expenses);
      setEditExpenseFormData({
        ...item,
        amount:
          displayCurrency === "trip"
            ? parseFloat((item.amount * tripRate).toFixed(2))
            : parseFloat((item.amount * homeRate || 0).toFixed(2)),
      });
      setIsEditDialogOpen(true);
    }, 150);
  };

  return (
    <div className="space-y-4 pb-20">
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
            Expense Tracker
          </h1>
        </div>
      </header>

      <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardDescription>
                Total Expenses ({currentCurrency})
              </CardDescription>
              <CardTitle className="text-card-foreground">
                {currentFormatter(totalExpensesInCurrent)}
              </CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleCurrency}
              className= {displayCurrency === "trip" ? `bg-primary text-white` : `text-black bg-white`}
            >
              <Repeat className="h-4 w-4 mr-2" />
              <span>{currencyButtonLabel}</span>
              
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          <ChartContainer config={chartConfig} className="flex col-span-3 lg:col-span-2 h-180 lg:h-84">
            <PieChart>
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => {
                      // const categoryKey = name as keyof typeof chartConfig;
                      const total = grouped.reduce(
                        (acc, curr) => acc + curr.total,
                        0
                      );
                      const percentage =
                        total > 0
                          ? ((props.payload.total / total) * 100).toFixed(0)
                          : 0;
                      return `${
                        grouped.find((d) => d.name === name)?.name || ''
                      }: ${currentFormatter(value as number)} (${percentage}%)`;
                    }}
                  />
                }
              />
              <Pie
                data={grouped}
                dataKey="total"
                nameKey="name"
                innerRadius={0}
                outerRadius={120}
                paddingAngle={3}
                labelLine={false}
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  percent,
                  index,
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius =
                    innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="hsl(var(--card-foreground))"
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      className="text-lg font-bold"
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {grouped.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="col-span-3 lg:col-span-1 flex flex-row lg:flex-col gap-2 justify-center items-centerlg:items-start">
            {grouped.map((group) => {
              const CategoryIcon =
                iconMap[getIconText(group.name, expenseCategoryOption)];
              return (
                <div
                  key={group.name}
                  className="flex items-center gap-2 text-sm text-card-foreground"
                >
                  {CategoryIcon && (
                    <CategoryIcon
                      className={`h-8 w-8`}
                      style={{ color: getChartColor(group.name, expenseCategoryOption) }}
                    />
                  )}
                  <span className="text-sm font-bold">{group.name}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="font-semibold font-headline text-primary-foreground">
          Recent Transactions
        </h2>
        <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
        {/* <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            
          </DialogTrigger>
          <DialogContent className="shadow-lg">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4 overflow-y-auto max-h-[70vh] pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newExpense.name}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, name: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="e.g. Coffee"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-right">
                  Amount (
                  {displayCurrency === "trip" ? tripCurrency : homeCurrency})
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="amount"
                  type="number"
                  ref={amountInputRef}
                  value={newExpense.amount || 0}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g. 5.00"
                  className="w-full"
                />
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      const value = amountInputRef?.current?.value;
                      if (value) {
                        toggleCurrencyForm(parseFloat(value) || 0);
                      }
                    }}
                  >
                    <Repeat className="h-4 w-4 mr-2" />
                    <span>{currencyButtonLabel}</span>
                  </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newExpense.date.toString() || Date.now().toString()}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      date: e.target.value || Date.now().toString(),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={newExpense.expense_category}
                  onValueChange={(value) =>
                    setNewExpense({
                      ...newExpense,
                      expense_category: value as string,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="shadow-lg">
                    {expenseCategoryOption.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const IconComp =
                              iconMap[cat.icon_text as keyof typeof iconMap];
                            return IconComp ? (
                              <IconComp
                                className={`h-4 w-4 ${cat.color_code}`}
                              />
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
            </div>
            <DialogFooter>
              <Button onClick={handleAddExpense} className="w-full">Add Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}
      </div>
      <div className="space-y-4">
        {grouped.map((group) => {
          const baseCategoryTotal = calculateTotal(group.items);
          const categoryTotalInCurrent =
            displayCurrency === "trip"
              ? convertUsdToCurrency(baseCategoryTotal, tripRate)
              : convertUsdToCurrency(baseCategoryTotal, homeRate);
          const CategoryIcon =
            iconMap[getIconText(group.name, expenseCategoryOption)];
          return (
            <Card
              key={group.name}
              className="bg-card/80 backdrop-blur-sm border-white/20 shadow-lg"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center border-b border-gray-400 pb-2">
                  <CardTitle className="text-lg font-headline text-card-foreground flex items-center gap-2">
                    {CategoryIcon && (
                      <CategoryIcon 
                        className="h-5 w-5 text-primary" 
                        style={{ color: getChartColor(group.name, expenseCategoryOption) }}
                      />
                    )}
                    {group.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg text-card-foreground">
                      {currentFormatter(categoryTotalInCurrent)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const baseItemPrice = item.amount || 0;
                    const itemPriceInCurrent =
                      displayCurrency === "trip"
                        ? convertUsdToCurrency(baseItemPrice, tripRate)
                        : convertUsdToCurrency(baseItemPrice, homeRate);
                    return (
                      <div
                        key={item.expense_uuid}
                        className="flex justify-between items-center pb-1 border-b last:border-b-0 border-gray-400"
                      >
                        <div className="flex-grow">
                          <p className="font-semibold text-card-foreground">
                            {item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-card-foreground">
                            -{currentFormatter(itemPriceInCurrent)}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 pointer-events-auto ml-1" onClick={() => handleEditExpenseClick(item)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Trip</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isEditDialogOpen && (
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              handleCancelEdit();
              setEditingExpense(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense?.name || "New Expense"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[70vh] pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  value={editExpenseFormData?.name || ""}
                  onChange={(e) =>
                    handleEditExpenseFormChange("name", e.target.value)
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
              <div className="flex gap-4">
                  <Input
                    id="item-price"
                    type="number"
                    step="0.01"
                    ref={amountInputRef}
                    value={editExpenseFormData?.amount || 0}
                    onChange={(e) =>
                      handleEditExpenseFormChange("amount", e.target.value)
                    }
                    placeholder="e.g. 15.00"
                    className="w-full"
                  />
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      const value = amountInputRef?.current?.value;
                      if (value) {
                        toggleCurrencyForm(parseFloat(value) || 0);
                      }
                    }}
                    className= {displayCurrency === "trip" ? `bg-primary text-white` : `text-black bg-white`}
                  >
                    <Repeat className="h-4 w-4 mr-2" />
                    <span>{currencyButtonLabel}</span>
                  </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date*</Label>
                <Input
                  id="date"
                  type="date"
                  value={editExpenseFormData?.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) =>
                    handleEditExpenseFormChange("date", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Select
                  value={editExpenseFormData?.expense_category || ""}
                  onValueChange={(value) =>
                    handleEditExpenseFormChange("expense_category", value)
                  }
                >
                  <SelectTrigger id="item-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategoryOption.map((cat) => (
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
            </div>
            <DialogFooter className="flex items-center justify-between">
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash2 className= "h-4 w-4" /> 
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
                        onClick={handleDeleteExpense}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
                {/* <Button
                  variant="outline"
                  onClick={() => setEditingExpense(null)}
                >
                  Cancel
                </Button> */}
                <Button onClick={handleUpdateExpense} className="w-full">
                  {editingExpense ? "Add New Expense" : "Save Changes"}
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
