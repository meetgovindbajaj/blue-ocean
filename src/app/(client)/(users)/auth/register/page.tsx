"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Form, Input, Button, message, Spin, Checkbox } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  GoogleOutlined,
  FacebookOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { debounce } from "@/lib/functions";
import "@/styles/auth.scss";

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string[];
  user?: {
    id: string;
    email: string;
    name: string;
    isVerified: boolean;
  };
}

const RegisterPage = React.memo(() => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [_googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [_emailChecking, setEmailChecking] = useState(false);
  const router = useRouter();

  // Debounced email availability check
  const _checkEmailAvailability = useMemo(
    () =>
      debounce((...args: unknown[]) => {
        const email = args[0] as string;
        if (!email || !email.includes("@")) return;

        const checkEmail = async () => {
          try {
            setEmailChecking(true);
            const response = await fetch(
              `/api/v1/auth/register?email=${encodeURIComponent(email)}`
            );
            const data = await response.json();

            if (!data.available) {
              form.setFields([
                {
                  name: "email",
                  errors: ["This email is already registered"],
                },
              ]);
            }
          } catch (error) {
            console.error("Email check error:", error);
          } finally {
            setEmailChecking(false);
          }
        };

        checkEmail();
      }, 500),
    [form]
  );

  const handleRegister = useCallback(
    async (values: RegisterFormValues) => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
          }),
        });

        const data: ApiResponse = await response.json();

        if (response.ok && data.success) {
          setSuccess(
            data.message ||
              "Registration successful! Please check your email to verify your account."
          );
          form.resetFields();
          message.success(
            "Registration successful! Check your email for verification."
          );

          // Redirect to login page after successful registration
          setTimeout(() => {
            router.push("/auth/login?message=verify-email");
          }, 3000);
        } else {
          const errorMessage =
            data.error || "Registration failed. Please try again.";
          setError(errorMessage);

          // Handle validation errors
          if (data.details && Array.isArray(data.details)) {
            message.error(data.details.join(", "));
          } else {
            message.error(errorMessage);
          }
        }
      } catch (error) {
        console.error("Registration error:", error);
        const errorMessage =
          "Network error. Please check your connection and try again.";
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [form, router]
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

  const handleSocialLogin = useCallback(
    (provider: string) => {
      if (provider === "Google") {
        handleGoogleAuth();
      } else {
        message.info(`${provider} registration will be implemented soon`);
      }
    },
    [handleGoogleAuth]
  );

  // Memoized form validation rules
  const _validationRules = useMemo(
    () => ({
      firstName: [
        { required: true, message: "Please enter your first name" },
        { min: 2, message: "First name must be at least 2 characters" },
        { max: 50, message: "First name must be less than 50 characters" },
      ],
      lastName: [
        { required: true, message: "Please enter your last name" },
        { min: 2, message: "Last name must be at least 2 characters" },
        { max: 50, message: "Last name must be less than 50 characters" },
      ],
      email: [
        { required: true, message: "Please enter your email" },
        { type: "email" as const, message: "Please enter a valid email" },
      ],
      password: [
        { required: true, message: "Please enter your password" },
        { min: 8, message: "Password must be at least 8 characters" },
        {
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        },
      ],
      confirmPassword: [
        { required: true, message: "Please confirm your password" },
        ({ getFieldValue }: { getFieldValue: (name: string) => string }) => ({
          validator(_: unknown, value: string) {
            if (!value || getFieldValue("password") === value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error("Passwords do not match"));
          },
        }),
      ],
      agreeToTerms: [
        {
          validator: (_: unknown, value: boolean) =>
            value
              ? Promise.resolve()
              : Promise.reject(
                  new Error("Please accept the terms and conditions")
                ),
        },
      ],
    }),
    []
  );

  // Memoized animation variants
  const _animationVariants = useMemo(
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

  return (
    <div className="auth-page">
      <motion.div
        className="auth-page__container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {loading && (
          <div className="auth-page__loading">
            <Spin size="large" />
          </div>
        )}

        <div className="auth-page__header">
          <div className="auth-page__logo">BO</div>
          <h1 className="auth-page__title">Create Account</h1>
          <p className="auth-page__subtitle">
            Join Blue Ocean Export for premium furniture
          </p>
        </div>

        <div className="auth-page__form">
          {error && (
            <motion.div
              className="auth-page__error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              className="auth-page__success"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              {success}
            </motion.div>
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleRegister}
            autoComplete="off"
          >
            <div style={{ display: "flex", gap: "1rem" }}>
              <Form.Item
                name="firstName"
                label="First Name"
                style={{ flex: 1 }}
                rules={[
                  { required: true, message: "Please enter your first name" },
                  {
                    min: 2,
                    message: "First name must be at least 2 characters",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="First name"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="lastName"
                label="Last Name"
                style={{ flex: 1 }}
                rules={[
                  { required: true, message: "Please enter your last name" },
                  {
                    min: 2,
                    message: "Last name must be at least 2 characters",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Last name"
                  size="large"
                />
              </Form.Item>
            </div>

            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email address"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter your password" },
                { min: 8, message: "Password must be at least 8 characters" },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message:
                    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Create a strong password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm your password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="agreeToTerms"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error("Please accept the terms and conditions")
                        ),
                },
              ]}
            >
              <Checkbox>
                I agree to the{" "}
                <Link href="/terms" style={{ color: "#1e9df1" }}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" style={{ color: "#1e9df1" }}>
                  Privacy Policy
                </Link>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="auth-form__submit"
                loading={loading}
                disabled={loading}
              >
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-form__divider">
            <span>Or continue with</span>
          </div>

          <div className="auth-form__social">
            <Button
              className="google-btn"
              onClick={() => handleSocialLogin("Google")}
              icon={<GoogleOutlined />}
            >
              Google
            </Button>
            <Button
              className="facebook-btn"
              onClick={() => handleSocialLogin("Facebook")}
              icon={<FacebookOutlined />}
            >
              Facebook
            </Button>
          </div>

          <div className="auth-form__terms">
            By creating an account, you agree to receive marketing emails from
            Blue Ocean Export. You can unsubscribe at any time.
          </div>
        </div>

        <div className="auth-page__footer">
          <p>
            Already have an account?
            <Link href="/auth/login">Sign in here</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
});

RegisterPage.displayName = "RegisterPage";

export default RegisterPage;
