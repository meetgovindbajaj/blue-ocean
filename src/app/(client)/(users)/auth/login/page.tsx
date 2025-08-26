"use client";

import React, { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { Form, Input, Button, message, Spin, Checkbox, Alert } from "antd";
import {
  LockOutlined,
  MailOutlined,
  GoogleOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import "@/styles/auth.scss";

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
  token?: string;
  requiresVerification?: boolean;
}

const LoginContent = React.memo(() => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  // Handle verification message from registration
  useEffect(() => {
    const messageParam = searchParams.get("message");
    if (messageParam === "verify-email") {
      setSuccess(
        "Registration successful! Please check your email to verify your account before logging in."
      );
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Debounced form validation
  const _validateForm = useCallback((values: Partial<LoginFormValues>) => {
    const errors: string[] = [];

    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.push("Please enter a valid email address");
    }

    if (values.password && values.password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    return errors;
  }, []);

  const handleLogin = useCallback(
    async (values: LoginFormValues) => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
          }),
        });

        const data: ApiResponse = await response.json();

        if (response.ok && data.token) {
          // Store remember me preference
          if (values.rememberMe) {
            localStorage.setItem("rememberMe", "true");
          } else {
            localStorage.removeItem("rememberMe");
          }

          await login(data.token);
          message.success("Login successful! Welcome back.");

          // Redirect to intended page or dashboard
          const redirectTo = searchParams.get("redirect") || "/";
          router.push(redirectTo);
        } else {
          const errorMessage =
            data.error || data.message || "Login failed. Please try again.";
          setError(errorMessage);

          if (data.requiresVerification) {
            setError(
              "Please verify your email address before logging in. Check your inbox for the verification link."
            );
          }

          message.error(errorMessage);
        }
      } catch (error) {
        console.error("Login error:", error);
        const errorMessage =
          "Network error. Please check your connection and try again.";
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [login, router, searchParams]
  );

  const handleGoogleAuth = useCallback(async () => {
    try {
      setGoogleLoading(true);
      setError("");

      // Get Google OAuth URL
      const response = await fetch("/api/v1/auth/google", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to get Google OAuth URL");
      }

      const data = await response.json();

      if (data.url) {
        // Store current page for redirect after auth
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem("authRedirect", currentPath);

        // Redirect to Google OAuth
        window.location.href = data.url;
      } else {
        throw new Error("Invalid OAuth URL received");
      }
    } catch (error) {
      console.error("Google OAuth error:", error);
      const errorMessage = "Google authentication failed. Please try again.";
      setError(errorMessage);
      message.error(errorMessage);
      setGoogleLoading(false);
    }
  }, []);

  const handleForgotPassword = useCallback(() => {
    const email = form.getFieldValue("email");
    if (email) {
      router.push(`/auth/forgot-password?email=${encodeURIComponent(email)}`);
    } else {
      router.push("/auth/forgot-password");
    }
  }, [form, router]);

  // Memoized validation rules
  const validationRules = useMemo(
    () => ({
      email: [
        { required: true, message: "Please enter your email address" },
        {
          type: "email" as const,
          message: "Please enter a valid email address",
        },
      ],
      password: [
        { required: true, message: "Please enter your password" },
        { min: 8, message: "Password must be at least 8 characters" },
      ],
    }),
    []
  );

  // Memoized animation variants
  const animationVariants = useMemo(
    () => ({
      container: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 },
      },
      error: {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: "auto" },
        transition: { duration: 0.3 },
      },
      success: {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: "auto" },
        transition: { duration: 0.3 },
      },
    }),
    []
  );

  // Auto-fill remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const rememberMe = localStorage.getItem("rememberMe") === "true";

    if (rememberedEmail && rememberMe) {
      form.setFieldsValue({
        email: rememberedEmail,
        rememberMe: true,
      });
    }
  }, [form]);

  return (
    <div className="auth-page">
      <motion.div
        className="auth-page__container"
        {...animationVariants.container}
      >
        {(loading || googleLoading) && (
          <div className="auth-page__loading">
            <Spin size="large" />
          </div>
        )}

        <div className="auth-page__header">
          <div className="auth-page__logo">BO</div>
          <h1 className="auth-page__title">Welcome Back</h1>
          <p className="auth-page__subtitle">
            Sign in to your Blue Ocean Export account
          </p>
        </div>

        <div className="auth-page__form">
          {error && (
            <motion.div {...animationVariants.error}>
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                onClose={() => setError("")}
                style={{ marginBottom: "1rem" }}
              />
            </motion.div>
          )}

          {success && (
            <motion.div {...animationVariants.success}>
              <Alert
                message={success}
                type="success"
                showIcon
                closable
                onClose={() => setSuccess("")}
                style={{ marginBottom: "1rem" }}
              />
            </motion.div>
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={validationRules.email}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email address"
                autoComplete="email"
                onChange={(e) => {
                  // Store email for remember me functionality
                  if (e.target.value) {
                    localStorage.setItem("rememberedEmail", e.target.value);
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={validationRules.password}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                autoComplete="current-password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <Form.Item
                name="rememberMe"
                valuePropName="checked"
                style={{ margin: 0 }}
              >
                <Checkbox>Remember me</Checkbox>
              </Form.Item>

              <Button
                type="link"
                onClick={handleForgotPassword}
                style={{ padding: 0, color: "#1e9df1" }}
              >
                Forgot password?
              </Button>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="auth-form__submit"
                loading={loading}
                disabled={loading || googleLoading}
                block
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-form__divider">
            <span>Or continue with</span>
          </div>

          <div className="auth-form__social">
            <Button
              className="google-btn"
              onClick={handleGoogleAuth}
              icon={<GoogleOutlined />}
              loading={googleLoading}
              disabled={loading || googleLoading}
              block
              size="large"
            >
              Continue with Google
            </Button>
          </div>

          <div className="auth-form__terms">
            By signing in, you agree to our{" "}
            <Link href="/terms" style={{ color: "#1e9df1" }}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" style={{ color: "#1e9df1" }}>
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="auth-page__footer">
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              style={{ color: "#1e9df1", fontWeight: 500 }}
            >
              Create one here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
});

LoginContent.displayName = "LoginContent";

const LoginPage = () => {
  return (
    <Suspense fallback={<div className="login-container"><Spin size="large" /></div>}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
