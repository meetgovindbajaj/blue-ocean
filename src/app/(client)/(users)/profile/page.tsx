"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  message,
  Spin,
  Divider,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  UploadOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import "@/styles/userPages.scss";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  avatar?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function ProfilePage() {
  const [form] = Form.useForm();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth-token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        form.setFieldsValue({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          street: data.address?.street || "",
          city: data.address?.city || "",
          state: data.address?.state || "",
          zipCode: data.address?.zipCode || "",
          country: data.address?.country || "",
        });
      } else {
        message.error("Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      message.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [router, form]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchProfile();
  }, [isAuthenticated, router, fetchProfile]);

  const handleSave = async (values: FormValues) => {
    try {
      setSaving(true);
      const token = localStorage.getItem("auth-token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/v1/user/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          address: {
            street: values.street,
            city: values.city,
            state: values.state,
            zipCode: values.zipCode,
            country: values.country,
          },
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditing(false);
        message.success("Profile updated successfully");
      } else {
        const errorData = await response.json();
        message.error(errorData.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        message.error("Authentication required");
        return false;
      }

      const response = await fetch("/api/v1/user/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile((prev) => (prev ? { ...prev, avatar: data.avatar } : null));
        message.success("Avatar updated successfully");
      } else {
        message.error("Failed to update avatar");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      message.error("Failed to update avatar");
    }

    return false; // Prevent default upload behavior
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-page__container">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "50vh",
            }}
          >
            <Spin size="large" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-page__container">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h3>Profile not found</h3>
            <Button type="primary" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        <div className="profile-page__header">
          <h1>My Profile</h1>
          <p>Manage your account information and preferences</p>
        </div>

        <div className="profile-page__content">
          {/* Avatar Section */}
          <Card
            title="Profile Picture"
            className="profile-page__avatar-section"
          >
            <div style={{ textAlign: "center" }}>
              <Avatar
                size={120}
                src={profile.avatar}
                icon={<UserOutlined />}
                style={{ marginBottom: "1rem" }}
              />
              <div>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleAvatarUpload}
                >
                  <Button icon={<UploadOutlined />}>Change Avatar</Button>
                </Upload>
              </div>
            </div>
          </Card>

          {/* Basic Information */}
          <Card
            title="Basic Information"
            extra={
              <Button
                type={editing ? "default" : "primary"}
                icon={editing ? <SaveOutlined /> : <EditOutlined />}
                onClick={() => {
                  if (editing) {
                    form.submit();
                  } else {
                    setEditing(true);
                  }
                }}
                loading={saving}
              >
                {editing ? "Save Changes" : "Edit Profile"}
              </Button>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              className="profile-page__form"
            >
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Please enter your name" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your full name"
                  disabled={!editing}
                />
              </Form.Item>

              <Form.Item name="email" label="Email Address">
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Enter your email"
                  disabled={true} // Email should not be editable
                />
              </Form.Item>

              <Form.Item name="phone" label="Phone Number">
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Enter your phone number"
                  disabled={!editing}
                />
              </Form.Item>

              <Divider>Address Information</Divider>

              <Form.Item name="street" label="Street Address">
                <Input
                  prefix={<HomeOutlined />}
                  placeholder="Enter your street address"
                  disabled={!editing}
                />
              </Form.Item>

              <div style={{ display: "flex", gap: "1rem" }}>
                <Form.Item name="city" label="City" style={{ flex: 1 }}>
                  <Input placeholder="Enter your city" disabled={!editing} />
                </Form.Item>

                <Form.Item
                  name="state"
                  label="State/Province"
                  style={{ flex: 1 }}
                >
                  <Input placeholder="Enter your state" disabled={!editing} />
                </Form.Item>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <Form.Item
                  name="zipCode"
                  label="ZIP/Postal Code"
                  style={{ flex: 1 }}
                >
                  <Input
                    placeholder="Enter your ZIP code"
                    disabled={!editing}
                  />
                </Form.Item>

                <Form.Item name="country" label="Country" style={{ flex: 1 }}>
                  <Input placeholder="Enter your country" disabled={!editing} />
                </Form.Item>
              </div>

              {editing && (
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    onClick={() => {
                      setEditing(false);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={saving}>
                    Save Changes
                  </Button>
                </div>
              )}
            </Form>
          </Card>

          {/* Account Information */}
          <Card title="Account Information">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div>
                <strong>Account Type:</strong>{" "}
                {profile.role?.charAt?.(0).toUpperCase?.() +
                  profile?.role?.slice(1)}
              </div>
              <div>
                <strong>Member Since:</strong>{" "}
                {new Date(profile.createdAt).toLocaleDateString()}
              </div>
              <div>
                <strong>Last Updated:</strong>{" "}
                {new Date(profile.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
