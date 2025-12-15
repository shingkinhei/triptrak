'use client';
import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { Currency, ExchangeRates } from '@/lib/types';

// Mock exchange rates relative to USD
const MOCK_RATES: ExchangeRates = {
  USD: 1,
  JPY: 157,
  EUR: 0.92,
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rate: number;
  rates: ExchangeRates;
  formatCurrency: (amount: number, minimumFractionDigits?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>('USD');

  const rate = useMemo(() => MOCK_RATES[currency], [currency]);

  const formatCurrency = (amount: number, minimumFractionDigits: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const value = {
    currency,
    setCurrency,
    rate,
    rates: MOCK_RATES,
    formatCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
