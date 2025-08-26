"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  Suspense,
} from "react";
import { Form, Input, Button, message, Alert, Result, Spin } from "antd";
import { MailOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import "@/styles/auth.scss";

interface ForgotPasswordFormValues {
  email: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const ForgotPasswordContent = React.memo(() => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill email from URL params
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      form.setFieldsValue({ email: emailParam });
    }
  }, [searchParams, form]);

  // Countdown for resend button
  useEffect(() => {
    if (emailSent && countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend, emailSent]);

  const handleForgotPassword = useCallback(
    async (values: ForgotPasswordFormValues) => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/v1/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: values.email,
          }),
        });

        const data: ApiResponse = await response.json();

        if (response.ok && data.success) {
          setEmailSent(true);
          setCanResend(false);
          setCountdown(60);
          message.success(
            "Password reset email sent! Please check your inbox."
          );
        } else {
          const errorMessage =
            data.error ||
            "Failed to send password reset email. Please try again.";
          setError(errorMessage);
          message.error(errorMessage);
        }
      } catch (error) {
        console.error("Forgot password error:", error);
        const errorMessage =
          "Network error. Please check your connection and try again.";
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleResend = useCallback(() => {
    const email = form.getFieldValue("email");
    if (email) {
      handleForgotPassword({ email });
    }
  }, [form, handleForgotPassword]);

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

  if (emailSent) {
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
              icon={<MailOutlined style={{ color: "#1890ff" }} />}
              title="Check Your Email"
              subTitle={`We&apos;ve sent a password reset link to ${form.getFieldValue(
                "email"
              )}. Please check your inbox and follow the instructions to reset your password.`}
              extra={[
                <Button
                  key="resend"
                  type="primary"
                  onClick={handleResend}
                  loading={loading}
                  disabled={!canResend}
                >
                  {canResend ? "Resend Email" : `Resend in ${countdown}s`}
                </Button>,
                <Button key="back" onClick={() => router.push("/auth/login")}>
                  Back to Login
                </Button>,
              ]}
            />
          </div>

          <div className="auth-page__footer">
            <p>
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <Link href="/contact" style={{ color: "#1e9df1" }}>
                contact support
              </Link>
            </p>
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
          <h1 className="auth-page__title">Forgot Password</h1>
          <p className="auth-page__subtitle">
            Enter your email address and we&apos;ll send you a link to reset
            your password
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

          <Form
            form={form}
            layout="vertical"
            onFinish={handleForgotPassword}
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
                Send Reset Link
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/auth/login")}
              style={{ color: "#1e9df1" }}
            >
              Back to Login
            </Button>
          </div>
        </div>

        <div className="auth-page__footer">
          <p>
            Remember your password?{" "}
            <Link
              href="/auth/login"
              style={{ color: "#1e9df1", fontWeight: 500 }}
            >
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
});

ForgotPasswordContent.displayName = "ForgotPasswordContent";

const ForgotPasswordPage = () => {
  return (
    <Suspense
      fallback={
        <div className="forgot-container">
          <Spin size="large" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
};

export default ForgotPasswordPage;
