'use client';
import { createContext, useContext, useState, useMemo, type ReactNode, useEffect, useCallback } from 'react';
import type { Currency, ExchangeRates } from '@/lib/types';

const MOCK_RATES: ExchangeRates = {
  USD: 1,
  JPY: 157,
  EUR: 0.92,
  HKD: 7.8,
};

const countryCurrencyMap: Record<string, Currency> = {
    JP: 'JPY',
    IT: 'EUR',
    US: 'USD',
    FR: 'EUR',
    ES: 'EUR',
    GB: 'USD', // Should be GBP, but using USD as it's in MOCK_RATES
};

const getInitialHomeCurrency = (): Currency => {
    if (typeof window !== 'undefined') {
        const storedCurrency = localStorage.getItem('homeCurrency');
        if (storedCurrency && MOCK_RATES[storedCurrency as Currency]) {
            return storedCurrency as Currency;
        }
    }
    return 'USD';
};


interface CurrencyContextType {
  tripCurrency: Currency;
  setTripCurrency: (currency: Currency) => void;
  homeCurrency: Currency;
  setHomeCurrency: (currency: Currency) => void;
  tripRate: number;
  rates: ExchangeRates;
  formatCurrency: (amount: number, minimumFractionDigits?: number) => string;
  formatHomeCurrency: (amount: number, minimumFractionDigits?: number) => string;
  setTripCurrencyFromCountry: (countryCode: string) => void;
  convertToHomeCurrency: (amountInTripCurrency: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
    children: ReactNode;
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [tripCurrency, setTripCurrency] = useState<Currency>('USD');
  const [homeCurrency, setHomeCurrencyState] = useState<Currency>(getInitialHomeCurrency());

  const setHomeCurrency = (currency: Currency) => {
      setHomeCurrencyState(currency);
      localStorage.setItem('homeCurrency', currency);
  }

  const setTripCurrencyFromCountry = useCallback((countryCode: string) => {
    const newDefaultCurrency = (countryCode && countryCurrencyMap[countryCode.toUpperCase()]) || 'USD';
    setTripCurrency(newDefaultCurrency);
  }, []);

  const tripRate = useMemo(() => MOCK_RATES[tripCurrency], [tripCurrency]);
  const homeRate = useMemo(() => MOCK_RATES[homeCurrency], [homeCurrency]);

  const formatCurrency = (amount: number, minimumFractionDigits: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: tripCurrency,
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  const formatHomeCurrency = (amount: number, minimumFractionDigits: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: homeCurrency,
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const convertToHomeCurrency = (amountInTripCurrency: number) => {
    const amountInUsd = amountInTripCurrency / tripRate;
    return amountInUsd * homeRate;
  }

  const value = {
    tripCurrency,
    setTripCurrency,
    homeCurrency,
    setHomeCurrency,
    tripRate,
    rates: MOCK_RATES,
    formatCurrency,
    formatHomeCurrency,
    setTripCurrencyFromCountry,
    convertToHomeCurrency
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
