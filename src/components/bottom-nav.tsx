'use client';
import type { Dispatch, SetStateAction } from 'react';
import {
  ClipboardList,
  Map,
  ShoppingCart,
  Wallet,
  Home,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export type Tab = 'planner' | 'map' | 'expenses' | 'shopping';
export type NavItemIds = Tab | 'trips' | 'settings';

interface NavItem {
  id: NavItemIds;
  label: string;
  icon: LucideIcon;
  action?: () => void;
}

interface BottomNavProps {
  activeItem: NavItemIds;
  setActiveTab?: Dispatch<SetStateAction<Tab>>;
  isLightMode?: boolean;
}

export function BottomNav({ activeItem, setActiveTab, isLightMode }: BottomNavProps) {
  const router = useRouter();

  const navItems: NavItem[] = [
    { id: 'trips', label: 'Trips', icon: Home, action: () => router.push('/trips') },
    { id: 'planner', label: 'Planner', icon: ClipboardList },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => router.push('/settings') },
  ];

  const filteredNavItems = setActiveTab
    ? navItems.filter(item => item.id !== 'settings')
    : navItems.filter(item => item.action);


  return (
    <nav className={cn(
        "flex items-center justify-around border-t shrink-0",
        isLightMode
          ? "bg-background/80 border-border backdrop-blur-sm"
          : "bg-black/30 border-white/20 backdrop-blur-sm"
      )}>
      {filteredNavItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            if (item.action) {
              item.action();
            } else if (setActiveTab) {
              setActiveTab(item.id as Tab);
            }
          }}
          disabled={!setActiveTab && !item.action}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 p-3 transition-colors duration-200',
            isLightMode
              ? 'text-muted-foreground'
              : 'text-primary-foreground/70',
            {
              'text-primary': activeItem === item.id,
              'text-white': activeItem === item.id && !isLightMode && !!setActiveTab, // backwards compat
              'opacity-50 cursor-not-allowed': !setActiveTab && !item.action,
            }
          )}
        >
          <item.icon
            className="h-6 w-6"
            strokeWidth={activeItem === item.id ? 2.5 : 2}
          />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
