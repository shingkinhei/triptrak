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

import type { Transaction, TransactionCategory } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const mockTransactions: Transaction[] = [
  { id: '1', name: 'Ichiran Ramen', category: 'Food', amount: 15, date: '2024-10-26' },
  { id: '2', name: 'Train to Shinjuku', category: 'Transport', amount: 25, date: '2024-10-26' },
  { id: '3', name: 'Park Hyatt Tokyo', category: 'Accommodation', amount: 450, date: '2024-10-26' },
  { id: '4', name: 'Fushimi Inari Souvenir', category: 'Shopping', amount: 45, date: '2024-10-27' },
  { id: '5', name: 'Kaiseki Dinner', category: 'Food', amount: 120, date: '2024-10-27' },
  { id: '6', name: 'Dotonbori Takoyaki', category: 'Food', amount: 10, date: '2024-10-28' },
];

const categoryIcons: Record<TransactionCategory, React.ElementType> = {
  Food: Pizza,
  Transport: Train,
  Shopping: ShoppingBag,
  Accommodation: Hotel,
  Other: PlusCircle,
};

const getChartData = (transactions: Transaction[]) => {
  const categoryTotals = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
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

export function ExpenseTracker() {
  const [transactions] = useState(mockTransactions);
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
  const chartData = getChartData(transactions);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold font-headline text-foreground">
          Expense Tracker
        </h1>
        <p className="text-muted-foreground">Keep an eye on your budget.</p>
      </header>

      <Card>
        <CardHeader>
          <CardDescription>Total Expenses</CardDescription>
          <CardTitle>${totalExpenses.toLocaleString()}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[150px] w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
               <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <h2 className="font-semibold font-headline">Recent Transactions</h2>
            <Button size="sm" variant="ghost">
                <PlusCircle className="mr-2 h-4 w-4" /> Add
            </Button>
        </div>
        <div className="space-y-2">
          {transactions.map((t) => {
            const Icon = categoryIcons[t.category];
            return (
              <Card key={t.id}>
                <CardContent className="flex items-center p-3 gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">
                      -${t.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">{t.date}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
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
