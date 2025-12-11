"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import {
  Settings,
  Bell,
  Lock,
  Globe,
  DollarSign,
  Mail,
  Smartphone,
  BellRing,
  Loader2,
  ChevronRight,
  Check,
  MapPin,
  User,
  Phone,
  Clock,
  Eye,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency, CURRENCIES } from "@/context/CurrencyContext";
import CarouselWrapper from "@/components/ui/CarouselWrapper";

interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface RecentProduct {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  price?: number;
  salePrice?: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  authType: string;
  lastLogin?: string;
  twoFactorEnabled?: boolean;
  hasPassword?: boolean;
  createdAt?: string;
  profile: {
    phone?: string;
    address?: Address;
    preferences: {
      newsletter: boolean;
      promotions: boolean;
      currency: string;
      language: string;
      notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
    };
  };
}

const SettingsPage = () => {
  const router = useRouter();
  const {
    currency,
    setUserCurrency,
    siteCurrency,
    loading: currencyLoading,
  } = useCurrency();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("account");

  // Account state
  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  // Change password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    newsletter: true,
    promotions: true,
    currency: "INR",
    language: "en",
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  });

  // Address state
  const [address, setAddress] = useState<Address>({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Recently viewed state
  const [recentlyViewed, setRecentlyViewed] = useState<RecentProduct[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeSection === "activity") {
      fetchRecentlyViewed();
    }
  }, [activeSection]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login?redirect=/settings");
          return;
        }
        throw new Error(data.error || "Failed to load settings");
      }

      setUser(data.user);
      if (data.user.profile?.phone) {
        setPhone(data.user.profile.phone);
      }
      if (data.user.profile?.preferences) {
        setPreferences({
          ...preferences,
          ...data.user.profile.preferences,
        });
      }
      if (data.user.profile?.address) {
        setAddress({
          ...address,
          ...data.user.profile.address,
        });
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentlyViewed = async () => {
    setLoadingRecent(true);
    try {
      const response = await fetch("/api/user/recently-viewed");
      const data = await response.json();
      if (data.success) {
        setRecentlyViewed(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch recently viewed:", error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handlePhoneSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPhone(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error("Failed to save phone");
      }

      toast.success("Phone number saved successfully");
    } catch (error) {
      toast.error("Failed to save phone number");
    } finally {
      setSavingPhone(false);
    }
  };

  const handlePreferencesChange = async (
    key: string,
    value: boolean | string
  ) => {
    const updatedPreferences = { ...preferences };

    if (key.startsWith("notifications.")) {
      const notificationKey = key.replace(
        "notifications.",
        ""
      ) as keyof typeof preferences.notifications;
      updatedPreferences.notifications = {
        ...updatedPreferences.notifications,
        [notificationKey]: value,
      };
    } else {
      (updatedPreferences as any)[key] = value;
    }

    setPreferences(updatedPreferences);

    // Auto-save preferences
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: updatedPreferences }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
      // Revert on error
      if (user?.profile?.preferences) {
        setPreferences(user.profile.preferences);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error("Failed to save address");
      }

      toast.success("Address saved successfully");
    } catch (error) {
      toast.error("Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Loader2 className={styles.spinner} size={32} />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Settings size={28} />
          <h1 className={styles.title}>Settings</h1>
        </div>

        <div className={styles.layout}>
          {/* Sidebar */}
          <nav className={styles.sidebar}>
            <button
              className={`${styles.navItem} ${
                activeSection === "account" ? styles.active : ""
              }`}
              onClick={() => setActiveSection("account")}
            >
              <User size={20} />
              <span>Account</span>
              <ChevronRight size={16} className={styles.chevron} />
            </button>
            <button
              className={`${styles.navItem} ${
                activeSection === "notifications" ? styles.active : ""
              }`}
              onClick={() => setActiveSection("notifications")}
            >
              <Bell size={20} />
              <span>Notifications</span>
              <ChevronRight size={16} className={styles.chevron} />
            </button>
            <button
              className={`${styles.navItem} ${
                activeSection === "preferences" ? styles.active : ""
              }`}
              onClick={() => setActiveSection("preferences")}
            >
              <Globe size={20} />
              <span>Preferences</span>
              <ChevronRight size={16} className={styles.chevron} />
            </button>
            <button
              className={`${styles.navItem} ${
                activeSection === "address" ? styles.active : ""
              }`}
              onClick={() => setActiveSection("address")}
            >
              <MapPin size={20} />
              <span>Address</span>
              <ChevronRight size={16} className={styles.chevron} />
            </button>
            <button
              className={`${styles.navItem} ${
                activeSection === "security" ? styles.active : ""
              }`}
              onClick={() => setActiveSection("security")}
            >
              <Lock size={20} />
              <span>Security</span>
              <ChevronRight size={16} className={styles.chevron} />
            </button>
            <button
              className={`${styles.navItem} ${
                activeSection === "activity" ? styles.active : ""
              }`}
              onClick={() => setActiveSection("activity")}
            >
              <Eye size={20} />
              <span>Activity</span>
              <ChevronRight size={16} className={styles.chevron} />
            </button>
          </nav>

          {/* Content */}
          <div className={styles.content}>
            {/* Account Section */}
            {activeSection === "account" && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Account Information</h2>
                <p className={styles.sectionDescription}>
                  Manage your account details and contact information
                </p>

                <div className={styles.settingsGroup}>
                  <h3 className={styles.groupTitle}>Basic Information</h3>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>Name</h3>
                        <p className={styles.settingDescription}>
                          {user?.name || "Not set"}
                        </p>
                      </div>
                    </div>
                    <Link href="/profile" className={styles.editLink}>
                      Edit in Profile
                    </Link>
                  </div>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>Email</h3>
                        <p className={styles.settingDescription}>
                          {user?.email || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.settingsGroup}>
                  <h3 className={styles.groupTitle}>Phone Number</h3>

                  <form
                    onSubmit={handlePhoneSave}
                    className={styles.addressForm}
                  >
                    <div className={styles.formGroup}>
                      <label htmlFor="phone" className={styles.label}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={styles.input}
                        placeholder="+91 9876543210"
                      />
                      <span className={styles.hint}>
                        Used for SMS notifications and order updates
                      </span>
                    </div>

                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={savingPhone}
                    >
                      {savingPhone ? (
                        <>
                          <Loader2 size={18} className={styles.spinner} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Phone size={18} />
                          Save Phone
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className={styles.settingsGroup}>
                  <h3 className={styles.groupTitle}>Account Status</h3>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>Member Since</h3>
                        <p className={styles.settingDescription}>
                          {formatDate(user?.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>Last Login</h3>
                        <p className={styles.settingDescription}>
                          {formatDate(user?.lastLogin)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        {user?.authType === "google" ? (
                          <Globe size={20} />
                        ) : (
                          <Mail size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>Login Method</h3>
                        <p className={styles.settingDescription}>
                          {user?.authType === "google"
                            ? "Google Account"
                            : "Email & Password"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Notification Settings</h2>
                <p className={styles.sectionDescription}>
                  Manage how you receive notifications and updates
                </p>

                <div className={styles.settingsGroup}>
                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>
                          Email Notifications
                        </h3>
                        <p className={styles.settingDescription}>
                          Receive order updates and important notifications via
                          email
                        </p>
                      </div>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={preferences.notifications.email}
                        onChange={(e) =>
                          handlePreferencesChange(
                            "notifications.email",
                            e.target.checked
                          )
                        }
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>
                          SMS Notifications
                        </h3>
                        <p className={styles.settingDescription}>
                          Receive order updates via text message
                        </p>
                      </div>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={preferences.notifications.sms}
                        onChange={(e) =>
                          handlePreferencesChange(
                            "notifications.sms",
                            e.target.checked
                          )
                        }
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        <BellRing size={20} />
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>
                          Push Notifications
                        </h3>
                        <p className={styles.settingDescription}>
                          Receive notifications in your browser
                        </p>
                      </div>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={preferences.notifications.push}
                        onChange={(e) =>
                          handlePreferencesChange(
                            "notifications.push",
                            e.target.checked
                          )
                        }
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>

                <div className={styles.settingsGroup}>
                  <h3 className={styles.groupTitle}>Marketing</h3>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div>
                        <h3 className={styles.settingLabel}>Newsletter</h3>
                        <p className={styles.settingDescription}>
                          Receive our weekly newsletter with new products
                        </p>
                      </div>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={preferences.newsletter}
                        onChange={(e) =>
                          handlePreferencesChange(
                            "newsletter",
                            e.target.checked
                          )
                        }
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div>
                        <h3 className={styles.settingLabel}>Promotions</h3>
                        <p className={styles.settingDescription}>
                          Receive special offers and promotional updates
                        </p>
                      </div>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={preferences.promotions}
                        onChange={(e) =>
                          handlePreferencesChange(
                            "promotions",
                            e.target.checked
                          )
                        }
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </section>
            )}

            {/* Preferences Section */}
            {activeSection === "preferences" && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Preferences</h2>
                <p className={styles.sectionDescription}>
                  Customize your experience
                </p>

                <div className={styles.settingsGroup}>
                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>Currency</h3>
                        <p className={styles.settingDescription}>
                          Select your preferred currency for viewing prices
                        </p>
                      </div>
                    </div>
                    <select
                      className={styles.select}
                      value={currency}
                      onChange={async (e) => {
                        const value = e.target.value;
                        // If user selects the same as site default, clear their preference
                        if (value === siteCurrency) {
                          await setUserCurrency("");
                        } else {
                          await setUserCurrency(value);
                        }
                        toast.success("Currency preference saved");
                      }}
                      disabled={currencyLoading}
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} ({curr.symbol}) - {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        <Globe size={20} />
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>Language</h3>
                        <p className={styles.settingDescription}>
                          Select your preferred language
                        </p>
                      </div>
                    </div>
                    <select
                      className={styles.select}
                      value={preferences.language}
                      onChange={(e) =>
                        handlePreferencesChange("language", e.target.value)
                      }
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* Address Section */}
            {activeSection === "address" && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Address</h2>
                <p className={styles.sectionDescription}>
                  Manage your shipping and billing address
                </p>

                <form
                  onSubmit={handleAddressSave}
                  className={styles.addressForm}
                >
                  <div className={styles.formGroup}>
                    <label htmlFor="street" className={styles.label}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="street"
                      value={address.street || ""}
                      onChange={(e) =>
                        setAddress({ ...address, street: e.target.value })
                      }
                      className={styles.input}
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="city" className={styles.label}>
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={address.city || ""}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                        className={styles.input}
                        placeholder="Mumbai"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="state" className={styles.label}>
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        value={address.state || ""}
                        onChange={(e) =>
                          setAddress({ ...address, state: e.target.value })
                        }
                        className={styles.input}
                        placeholder="Maharashtra"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="postalCode" className={styles.label}>
                        Postal Code
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        value={address.postalCode || ""}
                        onChange={(e) =>
                          setAddress({ ...address, postalCode: e.target.value })
                        }
                        className={styles.input}
                        placeholder="400001"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="country" className={styles.label}>
                        Country
                      </label>
                      <input
                        type="text"
                        id="country"
                        value={address.country || ""}
                        onChange={(e) =>
                          setAddress({ ...address, country: e.target.value })
                        }
                        className={styles.input}
                        placeholder="India"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={savingAddress}
                  >
                    {savingAddress ? (
                      <>
                        <Loader2 size={18} className={styles.spinner} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <MapPin size={18} />
                        Save Address
                      </>
                    )}
                  </button>
                </form>
              </section>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Security</h2>
                <p className={styles.sectionDescription}>
                  Manage your account security settings
                </p>

                {/* Two-Factor Authentication */}
                <div className={styles.settingsGroup}>
                  <h3 className={styles.groupTitle}>
                    Two-Factor Authentication
                  </h3>

                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingIcon}>
                        {user?.twoFactorEnabled ? (
                          <ShieldCheck size={20} />
                        ) : (
                          <ShieldOff size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className={styles.settingLabel}>2FA Status</h3>
                        <p className={styles.settingDescription}>
                          {user?.twoFactorEnabled
                            ? "Two-factor authentication is enabled for your account"
                            : "Add an extra layer of security to your account"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`${styles.statusBadge} ${
                        user?.twoFactorEnabled
                          ? styles.statusEnabled
                          : styles.statusDisabled
                      }`}
                    >
                      {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <p className={styles.hint} style={{ marginTop: "0.5rem" }}>
                    Two-factor authentication setup is coming soon. This will
                    add an extra layer of security to your account.
                  </p>
                </div>

                {/* Password Management */}
                <div className={styles.settingsGroup}>
                  <h3 className={styles.groupTitle}>
                    {user?.hasPassword ? "Change Password" : "Add Password"}
                  </h3>

                  {user?.authType === "google" && !user?.hasPassword && (
                    <p
                      className={styles.settingDescription}
                      style={{ marginBottom: "1rem" }}
                    >
                      Your account is linked to Google. You can add a password
                      to also login with email and password.
                    </p>
                  )}

                  <form
                    onSubmit={handleChangePassword}
                    className={styles.passwordForm}
                  >
                    {user?.hasPassword && (
                      <div className={styles.formGroup}>
                        <label
                          htmlFor="currentPassword"
                          className={styles.label}
                        >
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className={styles.input}
                          required={user?.hasPassword}
                        />
                      </div>
                    )}

                    <div className={styles.formGroup}>
                      <label htmlFor="newPassword" className={styles.label}>
                        {user?.hasPassword ? "New Password" : "Password"}
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className={styles.input}
                        required
                        minLength={8}
                      />
                      <span className={styles.hint}>Minimum 8 characters</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="confirmPassword" className={styles.label}>
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className={styles.input}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={changingPassword}
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 size={18} className={styles.spinner} />
                          {user?.hasPassword ? "Changing..." : "Adding..."}
                        </>
                      ) : (
                        <>
                          <Lock size={18} />
                          {user?.hasPassword
                            ? "Change Password"
                            : "Add Password"}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </section>
            )}

            {/* Activity Section */}
            {activeSection === "activity" && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Activity</h2>
                <p className={styles.sectionDescription}>
                  View your recent activity and browsing history
                </p>

                <div className={styles.settingsGroup}>
                  <h3 className={styles.groupTitle}>
                    Recently Viewed Products
                  </h3>

                  {loadingRecent ? (
                    <div
                      className={styles.loading}
                      style={{ minHeight: "200px" }}
                    >
                      <Loader2 className={styles.spinner} size={24} />
                      <span>Loading...</span>
                    </div>
                  ) : recentlyViewed.length > 0 ? (
                    <div className={styles.recentlyViewedCarousel}>
                      <CarouselWrapper
                        variant="default"
                        data={recentlyViewed.map((product) => ({
                          id: product._id,
                          image: product.image || "",
                          alt: product.name,
                          url: `/products/${product.slug}`,
                          content: (
                            <Link
                              href={`/products/${product.slug}`}
                              className={styles.recentProduct}
                            >
                              <div className={styles.recentProductImage}>
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    width={200}
                                    height={200}
                                    className={styles.recentProductImg}
                                  />
                                ) : (
                                  <div className={styles.noImage}>
                                    <Eye size={24} />
                                  </div>
                                )}
                              </div>
                              <div className={styles.recentProductInfo}>
                                <h4>{product.name}</h4>
                                {product.price && (
                                  <p className={styles.recentProductPrice}>
                                    {product.salePrice ? (
                                      <>
                                        <span className={styles.salePrice}>
                                          ₹{product.salePrice.toLocaleString()}
                                        </span>
                                        <span className={styles.originalPrice}>
                                          ₹{product.price.toLocaleString()}
                                        </span>
                                      </>
                                    ) : (
                                      <span>
                                        ₹{product.price.toLocaleString()}
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </Link>
                          ),
                        }))}
                        options={{
                          showControlBtns: true,
                          showControlDots: false,
                          autoPlay: false,
                          loop: true,
                          itemsPerView: {
                            mobile: 1,
                            tablet: 2,
                            desktop: 3,
                            xl: 4,
                          },
                        }}
                        renderItem={(item) => item.content}
                      />
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <Eye size={48} />
                      <h4>No recently viewed products</h4>
                      <p>Products you view will appear here</p>
                      <Link href="/products" className={styles.browseLink}>
                        Browse Products
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {saving && (
          <div className={styles.savingIndicator}>
            <Check size={16} />
            Saved
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
