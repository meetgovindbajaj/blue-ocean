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

export interface CartItem {
  id: string;
  product: IProduct;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  addedAt: Date;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

interface CartContextType {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  addItem: (
    product: IProduct,
    quantity?: number,
    options?: { size?: string; color?: string }
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

// Storage helpers
const CART_STORAGE_KEY = "blueocean-cart";

const cartStorage = {
  get: (): CartItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((item: CartItem & { addedAt: string }) => ({
        ...item,
        addedAt: new Date(item.addedAt),
      }));
    } catch (error) {
      console.error("Error loading cart from storage:", error);
      return [];
    }
  },
  set: (items: CartItem[]): void => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Error saving cart to storage:", error);
      }
    }
  },
  clear: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  },
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedItems = cartStorage.get();
    setItems(storedItems);
    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (!isLoading) {
      cartStorage.set(items);
    }
  }, [items, isLoading]);

  // Calculate cart summary
  const summary = useMemo((): CartSummary => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.product.prices?.retail || 0;
      const discount = item.product.prices?.discount || 0;
      const discountedPrice = price * (1 - discount / 100);
      return sum + discountedPrice * item.quantity;
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Free shipping over $100
    const shipping = subtotal > 100 ? 0 : subtotal > 0 ? 9.99 : 0;

    // 8% tax
    const tax = subtotal * 0.08;

    const total = subtotal + shipping + tax;

    return {
      subtotal,
      shipping,
      tax,
      total,
      itemCount,
    };
  }, [items]);

  const addItem = useCallback(
    (
      product: IProduct,
      quantity: number = 1,
      options?: { size?: string; color?: string }
    ) => {
      if (!product.isActive) {
        message.error("This product is currently unavailable");
        return;
      }

      if (quantity <= 0) {
        message.error("Quantity must be greater than 0");
        return;
      }

      setItems((prevItems) => {
        // Check if item with same product and options already exists
        const existingItemIndex = prevItems.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedSize === options?.size &&
            item.selectedColor === options?.color
        );

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
          };
          message.success(`Updated ${product.name} quantity in cart`);
          return updatedItems;
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${product.id}-${Date.now()}-${Math.random()}`,
            product,
            quantity,
            selectedSize: options?.size,
            selectedColor: options?.color,
            addedAt: new Date(),
          };
          message.success(`${product.name} added to cart`);
          return [...prevItems, newItem];
        }
      });
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    setItems((prevItems) => {
      const item = prevItems.find((item) => item.id === itemId);
      if (item) {
        message.success(`${item.product.name} removed from cart`);
      }
      return prevItems.filter((item) => item.id !== itemId);
    });
  }, []);

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId);
        return;
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    cartStorage.clear();
    message.success("Cart cleared");
  }, []);

  const isInCart = useCallback(
    (productId: string): boolean => {
      return items.some((item) => item.product.id === productId);
    },
    [items]
  );

  const getCartItem = useCallback(
    (productId: string): CartItem | undefined => {
      return items.find((item) => item.product.id === productId);
    },
    [items]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      items,
      summary,
      isLoading,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
      getCartItem,
    }),
    [
      items,
      summary,
      isLoading,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
      getCartItem,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
