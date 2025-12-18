'use client';
import { useState } from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Label as ChartLabel } from 'recharts';
import {
  MoreVertical,
  Pizza,
  ShoppingBag,
  Hotel,
  Train,
  PlusCircle,
  Repeat,
  ArrowLeft,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';

import type { Transaction, TransactionCategory, Trip } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useCurrency } from '@/context/CurrencyContext';
import { useRouter } from 'next/navigation';

interface ExpenseTrackerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  trip: Trip;
}

type DisplayCurrency = 'trip' | 'home';

const transactionCategories: TransactionCategory[] = ['Food', 'Transport', 'Shopping', 'Accommodation', 'Other'];

const categoryIcons: Record<TransactionCategory, React.ElementType> = {
  Food: Pizza,
  Transport: Train,
  Shopping: ShoppingBag,
  Accommodation: Hotel,
  Other: PlusCircle,
};

const getChartData = (transactions: Transaction[], rate: number, homeRate: number) => {
    const categoryTotals = transactions.reduce((acc, t) => {
        const amountInBase = t.amount / rate;
        const amountInHome = amountInBase * homeRate;
        acc[t.category] = (acc[t.category] || 0) + (rate === 1 ? t.amount : amountInHome);
        return acc;
    }, {} as Record<TransactionCategory, number>);

    return Object.entries(categoryTotals).map(([name, total]) => ({
        name,
        total,
        fill: `var(--color-${name.toLowerCase()})`
    }));
};

const chartConfig = {
  food: {
    label: "Food",
    color: "hsl(var(--chart-1))",
  },
  transport: {
    label: "Transport",
    color: "hsl(var(--chart-2))",
  },
  shopping: {
    label: "Shopping",
    color: "hsl(var(--chart-3))",
  },
  accommodation: {
    label: "Accommodation",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;


export function ExpenseTracker({ transactions, setTransactions, trip }: ExpenseTrackerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<{name: string, category: TransactionCategory | '', amount: string}>({
    name: '',
    category: '',
    amount: '',
  });

  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('trip');
  const router = useRouter();

  const { tripCurrency, tripRate, formatCurrency, homeCurrency, convertToHomeCurrency, formatHomeCurrency, rates } = useCurrency();

  const currentFormatter = displayCurrency === 'trip' ? formatCurrency : formatHomeCurrency;
  const currentCurrency = displayCurrency === 'trip' ? tripCurrency : homeCurrency;
  
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);

  const totalExpensesInCurrent = displayCurrency === 'trip' ? totalExpenses : convertToHomeCurrency(totalExpenses);

  const chartData = getChartData(transactions, displayCurrency === 'trip' ? 1 : tripRate, rates[homeCurrency]);

  const handleAddTransaction = () => {
    if (!newTransaction.name || !newTransaction.category || !newTransaction.amount) {
        return;
    }
    const newTx: Transaction = {
        id: new Date().toISOString(),
        name: newTransaction.name,
        category: newTransaction.category as TransactionCategory,
        amount: parseFloat(newTransaction.amount),
        date: new Date().toISOString().split('T')[0],
    };
    setTransactions([newTx, ...transactions]);
    setNewTransaction({ name: '', category: '', amount: '' });
    setIsAddDialogOpen(false);
  }
  
  const toggleCurrency = () => {
    setDisplayCurrency(prev => (prev === 'trip' ? 'home' : 'trip'));
  };

  const currencyButtonLabel = displayCurrency === 'trip' 
    ? `${tripCurrency} \u2194 ${homeCurrency}`
    : `${homeCurrency} \u2194 ${tripCurrency}`;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground" onClick={() => router.push('/trips')}>
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
              <CardDescription>Total Expenses ({currentCurrency})</CardDescription>
              <CardTitle className='text-card-foreground'>{currentFormatter(totalExpensesInCurrent)}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={toggleCurrency}>
                <Repeat className="h-4 w-4 mr-2" />
                <span>{currencyButtonLabel}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <PieChart>
                    <ChartTooltip
                        cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                        content={<ChartTooltipContent formatter={(value, name, props) => {
                            const categoryKey = name.toLowerCase() as keyof typeof chartConfig;
                            const total = chartData.reduce((acc, curr) => acc + curr.total, 0);
                            const percentage = total > 0 ? (props.payload.total / total * 100).toFixed(0) : 0;
                            return `${chartConfig[categoryKey]?.label}: ${currentFormatter(value as number)} (${percentage}%)`;
                        }} />}
                    />
                     <Pie
                        data={chartData}
                        dataKey="total"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                    >
                        {chartData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" formatter={(value) => chartConfig[value.toLowerCase() as keyof typeof chartConfig]?.label} />} />
                </PieChart>
            </ChartContainer>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <h2 className="font-semibold font-headline text-primary-foreground">Recent Transactions</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add
                    </Button>
                </DialogTrigger>
                <DialogContent className="shadow-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={newTransaction.name} onChange={(e) => setNewTransaction({...newTransaction, name: e.target.value})} className="col-span-3" placeholder="e.g. Coffee" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount ({tripCurrency})</Label>
                            <Input id="amount" type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})} className="col-span-3" placeholder="e.g. 5.00" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Select
                                value={newTransaction.category}
                                onValueChange={(value) => setNewTransaction({...newTransaction, category: value as TransactionCategory})}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent className="shadow-lg">
                                    {transactionCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddTransaction}>Add Transaction</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <div className="space-y-2">
          {transactions.map((t) => {
            const Icon = categoryIcons[t.category];
            const amount = displayCurrency === 'trip' ? t.amount : convertToHomeCurrency(t.amount);
            return (
              <Card key={t.id} className="bg-card/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardContent className="flex items-center p-3 gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    {Icon && <Icon className="h-5 w-5 text-secondary-foreground" />}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-card-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-card-foreground">
                      -{currentFormatter(amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">{t.date}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="shadow-lg">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
