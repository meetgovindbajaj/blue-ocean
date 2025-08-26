"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { message } from "antd";

interface WishlistContextType {
  items: IProduct[];
  isLoading: boolean;
  addItem: (product: IProduct) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: IProduct) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

// Storage helpers
const WISHLIST_STORAGE_KEY = "blueocean-wishlist";

const wishlistStorage = {
  get: (): IProduct[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error("Error loading wishlist from storage:", error);
      return [];
    }
  },
  set: (items: IProduct[]): void => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Error saving wishlist to storage:", error);
      }
    }
  },
  clear: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }
  },
};

export const WishlistProvider: React.FC<WishlistProviderProps> = ({
  children,
}) => {
  const [items, setItems] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const storedItems = wishlistStorage.get();
    setItems(storedItems);
    setIsLoading(false);
  }, []);

  // Save wishlist to localStorage whenever items change
  useEffect(() => {
    if (!isLoading) {
      wishlistStorage.set(items);
    }
  }, [items, isLoading]);

  const addItem = useCallback((product: IProduct) => {
    setItems((prevItems) => {
      // Check if item already exists
      const exists = prevItems.some((item) => item.id === product.id);
      if (exists) {
        message.info(`${product.name} is already in your wishlist`);
        return prevItems;
      }

      message.success(`${product.name} added to wishlist`);
      return [...prevItems, product];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => {
      const item = prevItems.find((item) => item.id === productId);
      if (item) {
        message.success(`${item.name} removed from wishlist`);
      }
      return prevItems.filter((item) => item.id !== productId);
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setItems([]);
    wishlistStorage.clear();
    message.success("Wishlist cleared");
  }, []);

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return items.some((item) => item.id === productId);
    },
    [items]
  );

  const toggleWishlist = useCallback(
    (product: IProduct) => {
      if (isInWishlist(product.id)) {
        removeItem(product.id);
      } else {
        addItem(product);
      }
    },
    [isInWishlist, removeItem, addItem]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      items,
      isLoading,
      addItem,
      removeItem,
      clearWishlist,
      isInWishlist,
      toggleWishlist,
    }),
    [
      items,
      isLoading,
      addItem,
      removeItem,
      clearWishlist,
      isInWishlist,
      toggleWishlist,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
