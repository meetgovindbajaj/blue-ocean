"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Button, message, Spin, Result } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import "@/styles/auth.scss";

interface VerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const VerifyEmailContent = React.memo(() => {
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Countdown for resend button
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const verifyEmail = useCallback(
    async (verificationToken: string) => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: verificationToken }),
        });

        const data: VerificationResponse = await response.json();

        if (response.ok && data.success) {
          setVerified(true);
          message.success("Email verified successfully!");

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/auth/login?message=verified");
          }, 3000);
        } else {
          const errorMessage =
            data.error || "Email verification failed. Please try again.";
          setError(errorMessage);
          setCanResend(true);
        }
      } catch (error) {
        console.error("Email verification error:", error);
        const errorMessage =
          "Network error. Please check your connection and try again.";
        setError(errorMessage);
        setCanResend(true);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const handleResendVerification = useCallback(async () => {
    try {
      setResendLoading(true);
      setError("");

      // Extract email from token or ask user to provide it
      const response = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success("Verification email sent! Please check your inbox.");
        setCanResend(false);
        setCountdown(60);
      } else {
        setError(data.error || "Failed to resend verification email.");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      setError("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }, [token]);

  // Verify email on component mount if token is present
  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setLoading(false);
      setError("No verification token provided.");
      setCanResend(true);
    }
  }, [token, verifyEmail]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-page__container">
          <div className="auth-page__loading">
            <Spin size="large" />
            <p style={{ marginTop: "1rem", textAlign: "center" }}>
              Verifying your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-page__container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-page__header">
          <div className="auth-page__logo">BO</div>
        </div>

        <div className="auth-page__form">
          {verified ? (
            <Result
              icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              title="Email Verified Successfully!"
              subTitle="Your email address has been verified. You can now log in to your account."
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
          ) : error ? (
            <Result
              icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
              title="Email Verification Failed"
              subTitle={error}
              extra={[
                canResend && (
                  <Button
                    type="primary"
                    key="resend"
                    icon={<MailOutlined />}
                    loading={resendLoading}
                    onClick={handleResendVerification}
                    disabled={!canResend}
                  >
                    {canResend
                      ? "Resend Verification Email"
                      : `Resend in ${countdown}s`}
                  </Button>
                ),
                <Button key="login" onClick={() => router.push("/auth/login")}>
                  Back to Login
                </Button>,
              ].filter(Boolean)}
            />
          ) : (
            <Result
              icon={<MailOutlined style={{ color: "#1890ff" }} />}
              title="Check Your Email"
              subTitle="We've sent a verification link to your email address. Please click the link to verify your account."
              extra={[
                <Button
                  type="primary"
                  key="resend"
                  loading={resendLoading}
                  onClick={handleResendVerification}
                  disabled={!canResend}
                >
                  {canResend
                    ? "Resend Verification Email"
                    : `Resend in ${countdown}s`}
                </Button>,
                <Button key="login" onClick={() => router.push("/auth/login")}>
                  Back to Login
                </Button>,
              ]}
            />
          )}
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

VerifyEmailContent.displayName = "VerifyEmailContent";

const VerifyEmailPage = () => {
  return (
    <Suspense
      fallback={
        <div className="verify-container">
          <Spin size="large" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmailPage;
