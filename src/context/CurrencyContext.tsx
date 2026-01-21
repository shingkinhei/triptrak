
'use client';
import { createContext, useContext, useState, useMemo, type ReactNode, useCallback, useEffect } from 'react';
import type { Currency, CurrencySetup, ExchangeRates } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface CurrencyContextType {
  tripCurrency: Currency;
  setTripCurrency: (currency: Currency) => void;
  homeCurrency: Currency;
  setHomeCurrency: (currency: Currency) => void;
  homeRate: number;
  tripRate: number;
  rates: ExchangeRates;
  currencies: CurrencySetup[];
  formatCurrency: (amount: number, minimumFractionDigits?: number) => string;
  formatHomeCurrency: (amount: number, minimumFractionDigits?: number) => string;
  getCurrencyByCountryCode: (countryCode: string) => Currency;
  // setTripCurrencyFromCountry: (countryCode: string) => void;
  convertCurrencyToUsd: (amountInCurrency: number, rate: number) => number;
  convertUsdToCurrency: (amountInCurrency: number, rate: number) => number;
  displayCurrency: 'trip' | 'home';
  setDisplayCurrency: (currencyType: 'trip' | 'home') => void;
  // convertToHomeCurrency: (amountInTripCurrency: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
    children: ReactNode;
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [tripCurrency, setTripCurrency] = useState<Currency>('USD');
  const [homeCurrency, setHomeCurrency] = useState<Currency>('USD');
  const [currencies, setCurrencies] = useState<CurrencySetup[]>([]);
  const [rates, setRates] = useState<ExchangeRates>({});
  const [countryCurrencyMap, setCountryCurrencyMap] = useState<Record<string, Currency>>({});
  const [displayCurrency, setDisplayCurrency] = useState<'trip' | 'home'>('trip');

  const supabase = createClient();

  useEffect(() => {
    const fetchCurrencies = async () => {
        const { data, error } = await supabase.from('currencies_setup').select('*');
        if (error) {
            console.error('Error fetching currencies:', error);
        } else if (data) {
            const fetchedCurrencies = data as CurrencySetup[];
            setCurrencies(fetchedCurrencies);

            const newRates = fetchedCurrencies.reduce((acc, curr) => {
                acc[curr.currency_code] = curr.rate;
                return acc;
            }, {} as ExchangeRates);
            setRates(newRates);
            
            const newCountryMap = fetchedCurrencies.reduce((acc, curr) => {
                if (curr.country_code) {
                    acc[curr.country_code] = curr.currency_code;
                }
                return acc;
            }, {} as Record<string, Currency>);
            const normalizedMap = normalizeCountryCurrencyMap(newCountryMap);
            setCountryCurrencyMap(normalizedMap);
        }
    };

    fetchCurrencies();
  }, [supabase]);

  function normalizeCountryCurrencyMap(
    rawMap: Record<string, string>
  ): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, currency] of Object.entries(rawMap)) {
      const codes = key.split(",").map((c) => c.trim().toUpperCase());
      for (const code of codes) {
        normalized[code] = currency;
      }
    }
    return normalized;
  }
 
  function getCurrencyByCountryCode(countryCode: string): Currency {
    if (Object.keys(countryCurrencyMap).length > 0) {
      const newDefaultCurrency = (countryCode && countryCurrencyMap[countryCode.toUpperCase()]) || 'USD';
      return newDefaultCurrency;
    }
     return 'USD';
  }

  // const setTripCurrencyFromCountry = useCallback((countryCode: string) => {
  //   if (Object.keys(countryCurrencyMap).length > 0) {
  //     const newDefaultCurrency = (countryCode && countryCurrencyMap[countryCode.toUpperCase()]) || 'USD';
  //     setTripCurrency(newDefaultCurrency);
  //   }
  // }, [countryCurrencyMap]);

  const tripRate = useMemo(() => rates[tripCurrency] || 1, [rates, tripCurrency]);
  const homeRate = useMemo(() => rates[homeCurrency] || 1, [rates, homeCurrency]);

  const formatCurrency = (amount: number, minimumFractionDigits: number = 2) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: tripCurrency,
        minimumFractionDigits: minimumFractionDigits,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (e) {
      return `${tripCurrency} ${amount.toFixed(2)}`;
    }
  };
  
  const formatHomeCurrency = (amount: number, minimumFractionDigits: number = 2) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: homeCurrency,
        minimumFractionDigits: minimumFractionDigits,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch(e) {
        return `${homeCurrency} ${amount.toFixed(2)}`;
    }
  };

  const convertCurrencyToUsd = (amountInCurrency: number, rate: number) => {
    return amountInCurrency / rate;
  }

  const convertUsdToCurrency = (amountInCurrency: number, rate: number) => {
    return amountInCurrency * rate;
  }

  const value = {
    tripCurrency,
    setTripCurrency,
    homeCurrency,
    setHomeCurrency,
    homeRate,
    tripRate,
    rates,
    currencies,
    formatCurrency,
    formatHomeCurrency,
    getCurrencyByCountryCode,
    // setTripCurrencyFromCountry,
    convertCurrencyToUsd,
    convertUsdToCurrency,
    displayCurrency,
    setDisplayCurrency,
    // convertToHomeCurrency
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
