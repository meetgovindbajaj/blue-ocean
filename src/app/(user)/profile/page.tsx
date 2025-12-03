"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { User, Mail, Calendar, Shield, Edit2, Camera, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  authType: string;
  createdAt: string;
  profile: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: string;
    gender?: string;
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

const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login?redirect=/profile");
          return;
        }
        throw new Error(data.error || "Failed to load profile");
      }

      setUser(data.user);
      setFormData({
        name: data.user.name || "",
        phone: data.user.profile?.phone || "",
        dateOfBirth: data.user.profile?.dateOfBirth?.split("T")[0] || "",
        gender: data.user.profile?.gender || "",
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      // Upload image to Cloudinary (avatars folder for user profile pics)
      const formData = new FormData();
      formData.append("files", file);
      formData.append("folder", "avatars");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || "Failed to upload image");
      }

      const avatarUrl = uploadData.images[0]?.url;
      if (!avatarUrl) {
        throw new Error("No image URL returned");
      }

      // Update profile with new avatar
      const profileResponse = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: avatarUrl }),
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.error || "Failed to update profile");
      }

      toast.success("Profile picture updated!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Loader2 className={styles.spinner} size={32} />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <p>Unable to load profile. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Profile</h1>
          {!editing && (
            <button
              className={styles.editButton}
              onClick={() => setEditing(true)}
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>

        <div className={styles.content}>
          {/* Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                {uploadingAvatar ? (
                  <Loader2 size={32} className={styles.spinner} />
                ) : user.profile?.avatar ? (
                  <img src={user.profile.avatar} alt={user.name} />
                ) : (
                  <User size={48} />
                )}
              </div>
              {editing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className={styles.hiddenInput}
                  />
                  <button
                    className={styles.changeAvatarBtn}
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                    type="button"
                  >
                    {uploadingAvatar ? <Loader2 size={16} className={styles.spinner} /> : <Camera size={16} />}
                  </button>
                </>
              )}
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.userName}>{user.name}</h2>
              <p className={styles.userEmail}>{user.email}</p>
              <div className={styles.badges}>
                {user.isVerified && (
                  <span className={styles.verifiedBadge}>
                    <Shield size={14} />
                    Verified
                  </span>
                )}
                <span className={styles.roleBadge}>{user.role}</span>
              </div>
            </div>
          </div>

          {/* Profile Form / Details */}
          {editing ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={styles.input}
                  placeholder="+91 1234567890"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="dateOfBirth" className={styles.label}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="gender" className={styles.label}>
                  Gender
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className={styles.input}
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className={styles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.details}>
              <div className={styles.detailsSection}>
                <h3 className={styles.sectionTitle}>Personal Information</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <User size={16} />
                      Full Name
                    </span>
                    <span className={styles.detailValue}>{user.name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <Mail size={16} />
                      Email
                    </span>
                    <span className={styles.detailValue}>{user.email}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <Phone size={16} />
                      Phone
                    </span>
                    <span className={styles.detailValue}>
                      {user.profile?.phone || "Not set"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <Calendar size={16} />
                      Date of Birth
                    </span>
                    <span className={styles.detailValue}>
                      {user.profile?.dateOfBirth
                        ? formatDate(user.profile.dateOfBirth)
                        : "Not set"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <User size={16} />
                      Gender
                    </span>
                    <span className={styles.detailValue}>
                      {user.profile?.gender
                        ? user.profile.gender.charAt(0).toUpperCase() +
                          user.profile.gender.slice(1)
                        : "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h3 className={styles.sectionTitle}>Account Information</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <Shield size={16} />
                      Account Type
                    </span>
                    <span className={styles.detailValue}>
                      {user.authType === "google" ? "Google Account" : "Email & Password"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      <Calendar size={16} />
                      Member Since
                    </span>
                    <span className={styles.detailValue}>
                      {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
