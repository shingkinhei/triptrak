'use client';
import { useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  MoreVertical,
  Pizza,
  ShoppingBag,
  Hotel,
  Train,
  PlusCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

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

interface ExpenseTrackerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  trip: Trip;
}

const transactionCategories: TransactionCategory[] = ['Food', 'Transport', 'Shopping', 'Accommodation', 'Other'];

const categoryIcons: Record<TransactionCategory, React.ElementType> = {
  Food: Pizza,
  Transport: Train,
  Shopping: ShoppingBag,
  Accommodation: Hotel,
  Other: PlusCircle,
};

const getChartData = (transactions: Transaction[], rate: number) => {
  const categoryTotals = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount * rate;
    return acc;
  }, {} as Record<TransactionCategory, number>);

  return Object.entries(categoryTotals).map(([name, total]) => ({
    name,
    total,
  }));
};

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function ExpenseTracker({ transactions, setTransactions, trip }: ExpenseTrackerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<{name: string, category: TransactionCategory | '', amount: string}>({
    name: '',
    category: '',
    amount: '',
  });

  const { tripCurrency, tripRate, formatCurrency, homeCurrency, convertToHomeCurrency, formatHomeCurrency } = useCurrency();

  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpensesInTripCurrency = totalExpenses * tripRate;
  const totalExpensesInHomeCurrency = convertToHomeCurrency(totalExpenses);

  const chartData = getChartData(transactions, tripRate);

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

  return (
    <div className="space-y-4 text-white">
      <header>
        <h1 className="text-2xl font-bold font-headline text-primary-foreground">
          Expense Tracker
        </h1>
        <p className="text-primary-foreground/80">Keep an eye on your budget.</p>
      </header>

      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardDescription className="text-primary-foreground/80">Total Expenses ({tripCurrency})</CardDescription>
              <CardTitle>{formatCurrency(totalExpensesInTripCurrency)}</CardTitle>
            </div>
            <div className="text-right">
              <CardDescription className="text-primary-foreground/80">In {homeCurrency}</CardDescription>
              <CardTitle className="text-lg">{formatHomeCurrency(totalExpensesInHomeCurrency)}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[150px] w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--primary-foreground) / 0.8)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--primary-foreground) / 0.8)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value, 0)}
              />
               <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
              />
              <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <h2 className="font-semibold font-headline text-primary-foreground">Recent Transactions</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 hover:text-white">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={newTransaction.name} onChange={(e) => setNewTransaction({...newTransaction, name: e.target.value})} className="col-span-3" placeholder="e.g. Coffee" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount (USD)</Label>
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
                                <SelectContent>
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
            return (
              <Card key={t.id} className="bg-white/10 border-white/20 text-white">
                <CardContent className="flex items-center p-3 gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    {Icon && <Icon className="h-5 w-5 text-primary-foreground" />}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-primary-foreground/80">{t.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary-foreground">
                      -{formatCurrency(t.amount * tripRate)}
                    </p>
                    <p className="text-sm text-primary-foreground/80">{t.date}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 text-white hover:bg-white/20 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
