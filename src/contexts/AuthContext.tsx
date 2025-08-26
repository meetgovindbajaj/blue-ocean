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
import { useRouter } from "next/navigation";
import { message } from "antd";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Token validation helper
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

// Secure token storage helper
const tokenStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth-token");
  },
  set: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth-token", token);
    }
  },
  remove: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-token");
    }
  },
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = tokenStorage.get();
      if (!token) {
        setUser(null);
        return;
      }

      // Check if token is expired before making API call
      if (isTokenExpired(token)) {
        tokenStorage.remove();
        setUser(null);
        setError("Session expired. Please login again.");
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          throw new Error("Invalid response format");
        }
      } else {
        // Token is invalid, remove it
        tokenStorage.remove();
        setUser(null);
        if (res.status === 401) {
          setError("Session expired. Please login again.");
        } else {
          setError("Authentication failed");
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      tokenStorage.remove();
      setUser(null);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setError("Authentication timeout. Please try again.");
        } else {
          setError("Authentication failed. Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (token: string) => {
      try {
        setIsLoading(true);
        setError(null);

        if (!token || typeof token !== "string") {
          throw new Error("Invalid token provided");
        }

        // Validate token format
        if (token.split(".").length !== 3) {
          throw new Error("Invalid token format");
        }

        tokenStorage.set(token);

        // Decode token to get user info
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));

          // Validate required fields
          if (!payload.userId || !payload.email) {
            throw new Error("Invalid token payload");
          }

          const userData: User = {
            id: payload.userId,
            email: payload.email,
            name: payload.name || payload.email.split("@")[0],
            role: payload.role || "user",
            emailVerified: payload.emailVerified || false,
          };

          setUser(userData);
          message.success("Logged in successfully");
        } catch (decodeError) {
          console.error("Failed to decode token:", decodeError);
          // Fallback to API call
          await checkAuth();
        }
      } catch (error) {
        console.error("Login error:", error);
        tokenStorage.remove();
        setUser(null);
        setError(error instanceof Error ? error.message : "Login failed");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [checkAuth]
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = tokenStorage.get();
      if (token) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

          await fetch("/api/v1/auth/logout", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
        } catch (logoutError) {
          // Don't throw on logout API failure, still clear local state
          console.error("Logout API error:", logoutError);
        }
      }

      tokenStorage.remove();
      setUser(null);
      message.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if API call fails
      tokenStorage.remove();
      setUser(null);
      setError("Logout failed, but you have been logged out locally");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user && !error,
      error,
      login,
      logout,
      checkAuth,
      clearError,
    }),
    [user, isLoading, error, login, logout, checkAuth, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
