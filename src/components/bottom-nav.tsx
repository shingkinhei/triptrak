'use client';
import type { Dispatch, SetStateAction } from 'react';
import {
  ClipboardList,
  Camera,
  ShoppingCart,
  Wallet,
  Home,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export type Tab = 'planner' | 'memories' | 'expenses' | 'shopping';
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
}

export function BottomNav({ activeItem, setActiveTab }: BottomNavProps) {
  const router = useRouter();

  const navItems: NavItem[] = [
    { id: 'trips', label: 'Trips', icon: Home, action: () => router.push('/trips') },
    { id: 'planner', label: 'Planner', icon: ClipboardList },
  { id: 'memories', label: 'Photos & Memories', icon: Camera },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => router.push('/settings') },
  ];

  const filteredNavItems = setActiveTab
    ? navItems.filter(item => !item.action) // Inside a trip, show only tabs
    : navItems.filter(item => item.action); // On main pages, show only actionable items


  return (
    <nav className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[96vw] lg:w-[40vw] flex items-center justify-around border-t shrink-0 bg-background/70 border-border backdrop-blur-sm rounded-full mb-3">
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
            'flex flex-1 flex-col items-center gap-1 p-5 transition-colors duration-200',
            'text-muted-foreground',
            {
              'text-primary': activeItem === item.id,
              'opacity-50 cursor-not-allowed': !setActiveTab && !item.action,
            }
          )}
        >
          <item.icon
            className="h-6 w-6"
            strokeWidth={activeItem === item.id ? 2.5 : 2}
          />
          {/* <span className="text-xs font-medium">{item.label}</span> */}
        </button>
      ))}
    </nav>
  );
}
