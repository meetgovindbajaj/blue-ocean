"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { useSiteSettings } from "./SiteSettingsContext";

// Currency configuration
export const CURRENCIES = [
  { code: "INR", symbol: "\u20b9", name: "Indian Rupee", locale: "en-IN" },
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "\u20ac", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "\u00a3", name: "British Pound", locale: "en-GB" },
  { code: "AED", symbol: "\u062f.\u0625", name: "UAE Dirham", locale: "ar-AE" },
  { code: "SAR", symbol: "\ufdfc", name: "Saudi Riyal", locale: "ar-SA" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "JPY", symbol: "\u00a5", name: "Japanese Yen", locale: "ja-JP" },
  { code: "CNY", symbol: "\u00a5", name: "Chinese Yuan", locale: "zh-CN" },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]["code"];

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextValue {
  // Current active currency (user preference > site default)
  currency: CurrencyCode;
  currencySymbol: string;
  locale: string;

  // Base currency (what prices are stored in - from site settings)
  baseCurrency: CurrencyCode;

  // Exchange rates (relative to USD as reference)
  exchangeRates: ExchangeRates;

  // User's preference (empty means use site default)
  userCurrency: string;

  // Site default currency (base currency for prices)
  siteCurrency: CurrencyCode;

  // Loading states
  loading: boolean;
  ratesLoading: boolean;

  // Functions
  formatPrice: (price: number, options?: { showOriginal?: boolean; decimals?: number }) => string;
  convertPrice: (price: number, fromCurrency?: CurrencyCode, toCurrency?: CurrencyCode) => number;
  setUserCurrency: (currency: string) => Promise<void>;
  getCurrencyInfo: (code: CurrencyCode) => typeof CURRENCIES[number] | undefined;
}

// Default exchange rates relative to USD (as reference currency for API)
const defaultExchangeRates: ExchangeRates = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.5,
  CNY: 7.24,
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();

  const [userCurrency, setUserCurrencyState] = useState<string>("");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(defaultExchangeRates);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);

  // Base currency is from site settings (what prices are stored in)
  // Admin sets prices in this currency, defaults to USD
  const siteCurrency = (settings?.locale?.currency as CurrencyCode) || "USD";
  const baseCurrency: CurrencyCode = siteCurrency;

  // Active currency: user preference takes precedence over site default
  // If user hasn't set preference, use site default (no conversion needed)
  const currency = (userCurrency || siteCurrency) as CurrencyCode;

  // Get currency info
  const getCurrencyInfo = useCallback((code: CurrencyCode) => {
    return CURRENCIES.find(c => c.code === code);
  }, []);

  const currencyInfo = getCurrencyInfo(currency);
  const currencySymbol = currencyInfo?.symbol || "\u20b9";
  const locale = currencyInfo?.locale || "en-IN";

  // Fetch user's currency preference
  useEffect(() => {
    const fetchUserCurrency = async () => {
      if (authLoading) return;

      if (!user) {
        // Load from localStorage for non-logged-in users
        if (typeof window !== "undefined") {
          const storedCurrency = localStorage.getItem("preferredCurrency");
          if (storedCurrency) {
            setUserCurrencyState(storedCurrency);
          }
        }
        setUserLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/profile");
        const data = await response.json();
        if (data.success && data.profile?.preferences?.currency) {
          setUserCurrencyState(data.profile.preferences.currency);
        }
      } catch (error) {
        console.error("Failed to fetch user currency preference:", error);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserCurrency();
  }, [user, authLoading]);

  // Use admin-defined exchange rates from site settings, or fetch from API as fallback
  useEffect(() => {
    const loadExchangeRates = async () => {
      setRatesLoading(true);
      try {
        // First, check if admin has set custom exchange rates in site settings
        const adminRates = settings?.locale?.exchangeRates as ExchangeRates | undefined;

        if (adminRates && Object.keys(adminRates).length > 0) {
          // Use admin-defined rates
          const rates: ExchangeRates = { ...defaultExchangeRates };
          CURRENCIES.forEach(curr => {
            if (adminRates[curr.code] !== undefined) {
              rates[curr.code] = adminRates[curr.code];
            }
          });
          setExchangeRates(rates);
        } else {
          // Fallback: Fetch rates from external API relative to USD
          const response = await fetch(
            `https://api.exchangerate-api.com/v4/latest/USD`
          );

          if (response.ok) {
            const data = await response.json();
            const rates: ExchangeRates = {};

            CURRENCIES.forEach(curr => {
              if (data.rates[curr.code]) {
                rates[curr.code] = data.rates[curr.code];
              } else {
                rates[curr.code] = defaultExchangeRates[curr.code];
              }
            });

            setExchangeRates(rates);
          }
        }
      } catch (error) {
        console.error("Failed to load exchange rates, using defaults:", error);
        // Keep using default rates
      } finally {
        setRatesLoading(false);
      }
    };

    // Only load rates after settings are loaded
    if (!settingsLoading) {
      loadExchangeRates();
    }
  }, [settings?.locale?.exchangeRates, settingsLoading]);

  // Convert price from one currency to another
  // Exchange rates are relative to USD, so we convert through USD
  const convertPrice = useCallback((
    price: number,
    fromCurrency: CurrencyCode = baseCurrency,
    toCurrency: CurrencyCode = currency
  ): number => {
    if (fromCurrency === toCurrency) return price;

    // Get rates (relative to USD)
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;

    // Convert: fromCurrency -> USD -> toCurrency
    // price in fromCurrency / fromRate = price in USD
    // price in USD * toRate = price in toCurrency
    const priceInUSD = price / fromRate;
    return priceInUSD * toRate;
  }, [exchangeRates, currency, baseCurrency]);

  // Format price in current currency
  // Prices are stored in site's base currency, convert to user's preferred currency
  const formatPrice = useCallback((
    price: number,
    options?: { showOriginal?: boolean; decimals?: number }
  ): string => {
    // Convert from base currency (site setting) to display currency (user preference or site default)
    const convertedPrice = convertPrice(price, baseCurrency, currency);

    // Decimal places: min 2, max 4 (JPY uses 0)
    const isJPY = currency === "JPY";
    const defaultDecimals = isJPY ? 0 : 2;
    const minDecimals = isJPY ? 0 : Math.max(2, options?.decimals || defaultDecimals);
    const maxDecimals = isJPY ? 0 : Math.min(4, options?.decimals || defaultDecimals);

    try {
      const formatted = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals,
      }).format(convertedPrice);

      return formatted;
    } catch {
      // Fallback formatting
      return `${currencySymbol}${convertedPrice.toFixed(minDecimals)}`;
    }
  }, [convertPrice, currency, locale, currencySymbol, baseCurrency]);

  // Update user's currency preference
  const setUserCurrency = useCallback(async (newCurrency: string) => {
    setUserCurrencyState(newCurrency);

    // If user is logged in, save to their profile
    if (user) {
      try {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferences: { currency: newCurrency }
          }),
        });
      } catch (error) {
        console.error("Failed to save currency preference:", error);
      }
    } else {
      // Store in localStorage for non-logged-in users
      if (typeof window !== "undefined") {
        if (newCurrency) {
          localStorage.setItem("preferredCurrency", newCurrency);
        } else {
          localStorage.removeItem("preferredCurrency");
        }
      }
    }
  }, [user]);

  const loading = settingsLoading || userLoading;

  const value = useMemo(() => ({
    currency,
    currencySymbol,
    locale,
    baseCurrency,
    exchangeRates,
    userCurrency,
    siteCurrency,
    loading,
    ratesLoading,
    formatPrice,
    convertPrice,
    setUserCurrency,
    getCurrencyInfo,
  }), [
    currency,
    currencySymbol,
    locale,
    baseCurrency,
    exchangeRates,
    userCurrency,
    siteCurrency,
    loading,
    ratesLoading,
    formatPrice,
    convertPrice,
    setUserCurrency,
    getCurrencyInfo,
  ]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

export default CurrencyContext;
