"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  Suspense,
} from "react";
import { Form, Input, Button, message, Alert, Result, Spin } from "antd";
import {
  LockOutlined,
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import "@/styles/auth.scss";

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const ResetPasswordContent = React.memo(() => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError(
          "No reset token provided. Please request a new password reset link."
        );
        setValidating(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
        } else {
          setError(
            data.error ||
              "Invalid or expired reset token. Please request a new password reset link."
          );
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setError("Failed to validate reset token. Please try again.");
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleResetPassword = useCallback(
    async (values: ResetPasswordFormValues) => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/v1/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password: values.password,
          }),
        });

        const data: ApiResponse = await response.json();

        if (response.ok && data.success) {
          setPasswordReset(true);
          message.success("Password reset successfully!");

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/auth/login?message=password-reset");
          }, 3000);
        } else {
          const errorMessage =
            data.error || "Failed to reset password. Please try again.";
          setError(errorMessage);
          message.error(errorMessage);
        }
      } catch (error) {
        console.error("Reset password error:", error);
        const errorMessage =
          "Network error. Please check your connection and try again.";
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [token, router]
  );

  // Memoized validation rules
  const validationRules = useMemo(
    () => ({
      password: [
        { required: true, message: "Please enter your new password" },
        { min: 8, message: "Password must be at least 8 characters" },
        {
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        },
      ],
      confirmPassword: [
        { required: true, message: "Please confirm your new password" },
        ({ getFieldValue }: { getFieldValue: (name: string) => string }) => ({
          validator(_: unknown, value: string) {
            if (!value || getFieldValue("password") === value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error("Passwords do not match"));
          },
        }),
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
    }),
    []
  );

  if (validating) {
    return (
      <div className="auth-page">
        <div className="auth-page__container">
          <div className="auth-page__loading">
            <div className="spinner" />
            <p style={{ marginTop: "1rem", textAlign: "center" }}>
              Validating reset token...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="auth-page">
        <motion.div
          className="auth-page__container"
          {...animationVariants.container}
        >
          <div className="auth-page__header">
            <div className="auth-page__logo">BO</div>
          </div>

          <div className="auth-page__form">
            <Result
              icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              title="Password Reset Successfully!"
              subTitle="Your password has been reset successfully. You can now log in with your new password."
              extra={[
                <Button
                  type="primary"
                  key="login"
                  onClick={() => router.push("/auth/login")}
                >
                  Go to Login
                </Button>,
                <Button key="home" onClick={() => router.push("/")}>
                  Go to Home
                </Button>,
              ]}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="auth-page">
        <motion.div
          className="auth-page__container"
          {...animationVariants.container}
        >
          <div className="auth-page__header">
            <div className="auth-page__logo">BO</div>
          </div>

          <div className="auth-page__form">
            <Result
              status="error"
              title="Invalid Reset Link"
              subTitle={error}
              extra={[
                <Button
                  type="primary"
                  key="forgot"
                  onClick={() => router.push("/auth/forgot-password")}
                >
                  Request New Reset Link
                </Button>,
                <Button key="login" onClick={() => router.push("/auth/login")}>
                  Back to Login
                </Button>,
              ]}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-page__container"
        {...animationVariants.container}
      >
        <div className="auth-page__header">
          <div className="auth-page__logo">BO</div>
          <h1 className="auth-page__title">Reset Password</h1>
          <p className="auth-page__subtitle">Enter your new password below</p>
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

          <Form
            form={form}
            layout="vertical"
            onFinish={handleResetPassword}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="password"
              label="New Password"
              rules={validationRules.password}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your new password"
                autoComplete="new-password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={["password"]}
              rules={validationRules.confirmPassword}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="auth-form__submit"
                loading={loading}
                disabled={loading}
                block
              >
                Reset Password
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/auth/login" style={{ color: "#1e9df1" }}>
              Back to Login
            </Link>
          </div>
        </div>

        <div className="auth-page__footer">
          <p>
            Need help?{" "}
            <Link href="/contact" style={{ color: "#1e9df1" }}>
              Contact Support
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
});

ResetPasswordContent.displayName = "ResetPasswordContent";

const ResetPasswordPage = () => {
  return (
    <Suspense
      fallback={
        <div className="reset-container">
          <Spin size="large" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;
