'use client';
import type { Dispatch, SetStateAction } from 'react';
import {
  ClipboardList,
  Map,
  ShoppingCart,
  Wallet,
  Home,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export type Tab = 'planner' | 'map' | 'expenses' | 'shopping';

interface NavItem {
  id: Tab | 'trips';
  label: string;
  icon: LucideIcon;
  action?: () => void;
}

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const router = useRouter();

  const navItems: NavItem[] = [
    { id: 'trips', label: 'Trips', icon: Home, action: () => router.push('/trips') },
    { id: 'planner', label: 'Planner', icon: ClipboardList },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
  ];

  return (
    <nav className="flex items-center justify-around border-t bg-card/80 backdrop-blur-sm">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            if (item.action) {
              item.action();
            } else {
              setActiveTab(item.id as Tab);
            }
          }}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 p-3 text-muted-foreground transition-colors duration-200',
            {
              'text-primary': activeTab === item.id,
            }
          )}
        >
          <item.icon
            className="h-6 w-6"
            strokeWidth={activeTab === item.id ? 2.5 : 2}
          />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
