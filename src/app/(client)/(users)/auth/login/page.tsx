"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  Input,
  Button,
  Divider,
  message,
  Checkbox,
  Progress,
  Alert,
} from "antd";
import {
  GoogleOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  LoadingOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import styles from "./login.module.scss";
import { useAuth } from "@/contexts/AuthContext";

export default function EnhancedLoginPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [authWorkflow, setAuthWorkflow] = useState({
    isLoading: false,
    error: null as string | null,
    success: null as string | null,
  });

  const handleLogin = async (values: { email: string; password: string }) => {
    setAuthWorkflow({ isLoading: true, error: null, success: null });

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const results = await res.json();

      if (res.ok && results.token) {
        // Use auth context to store token and user info
        authLogin(results.token);

        // Show success message
        message.success(results.message || "Login successful!");
        setAuthWorkflow({
          isLoading: false,
          error: null,
          success: "Login successful!",
        });

        // Decode JWT to get user role (basic implementation)
        try {
          const tokenPayload = JSON.parse(atob(results.token.split(".")[1]));

          // Redirect based on role
          setTimeout(() => {
            if (
              tokenPayload.role === "super_admin" ||
              tokenPayload.role === "admin"
            ) {
              router.push("/admin/dashboard");
            } else {
              router.push("/");
            }
          }, 1000);
        } catch {
          // Default redirect if token decode fails
          setTimeout(() => router.push("/"), 1000);
        }
      } else {
        // Handle errors
        const errorMessage = results.error || results.message || "Login failed";

        // Check for specific error types
        if (res.status === 403 && results.requiresVerification) {
          setAuthWorkflow({
            isLoading: false,
            error: errorMessage,
            success: null,
          });
          message.warning(errorMessage);
        } else if (res.status === 423) {
          setAuthWorkflow({
            isLoading: false,
            error: "Account is locked. Please try again later.",
            success: null,
          });
          message.error("Account is locked. Please try again later.");
        } else {
          setAuthWorkflow({
            isLoading: false,
            error: errorMessage,
            success: null,
          });
          message.error(errorMessage);
        }
      }
    } catch (error) {
      setAuthWorkflow({
        isLoading: false,
        error: "Network error. Please check your connection.",
        success: null,
      });
      message.error("Network error. Please check your connection.");
      console.error("Login error:", error);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthWorkflow({ isLoading: true, error: null, success: null });

    try {
      // Get Google OAuth URL from backend
      const res = await fetch("/api/v1/auth/google", {
        method: "GET",
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url;
      } else {
        setAuthWorkflow({
          isLoading: false,
          error: "Failed to initiate Google login",
          success: null,
        });
        message.error(data.error || "Failed to initiate Google login");
      }
    } catch (error) {
      setAuthWorkflow({
        isLoading: false,
        error: "Failed to connect to Google",
        success: null,
      });
      message.error("Failed to connect to Google");
      console.error("Google login error:", error);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className="logo">BlueOcean</h1>
          <p>Welcome back to BlueOcean</p>
        </div>

        {/* Show progress during login */}
        {authWorkflow.isLoading && (
          <Alert
            message="Logging you in..."
            description={
              <div style={{ marginTop: 8 }}>
                <Progress percent={0} status="active" showInfo={false} />
                <div style={{ marginTop: 4, fontSize: "12px", color: "#666" }}>
                  Sequential loading: Auth → Profile → Cart
                </div>
              </div>
            }
            type="info"
            showIcon
            icon={<LoadingOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Show error if login fails */}
        {authWorkflow.error && (
          <Alert
            message="Login Failed"
            description={authWorkflow.error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          className={styles.loginForm}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input size="large" placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              size="large"
              placeholder="Enter your password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item>
            <div className={styles.loginOptions}>
              <Checkbox>Remember me</Checkbox>
              <Link href="/auth/forgot-password">Forgot password?</Link>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={authWorkflow.isLoading}
              size="large"
              block
              disabled={authWorkflow.isLoading}
            >
              {authWorkflow.isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </Form.Item>
        </Form>

        <Divider>Or continue with</Divider>

        <Button
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          size="large"
          block
          className={styles.googleButton}
          disabled={authWorkflow.isLoading}
        >
          Continue with Google
        </Button>

        <div className={styles.footer}>
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register">Sign up</Link>
          </p>

          {/* Development info */}
          {process.env.NODE_ENV === "development" && (
            <div
              style={{
                marginTop: 16,
                padding: 8,
                background: "#f5f5f5",
                borderRadius: 4,
                fontSize: "12px",
              }}
            >
              <strong>Sequential API Demo:</strong> This login uses the
              sequential workflow pattern. Auth calls execute first, then
              profile and cart data load in parallel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
