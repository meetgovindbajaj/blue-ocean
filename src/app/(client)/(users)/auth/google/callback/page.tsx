"use client";

import React, { useEffect, useState, Suspense } from "react";
import { Spin, Result, Button } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import "@/styles/auth.scss";

const GoogleCallbackContent = React.memo(() => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const _state = searchParams.get("state"); // For future CSRF protection

        if (error) {
          setError(`Google authentication failed: ${error}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError("No authorization code received from Google");
          setLoading(false);
          return;
        }

        // Exchange code for tokens
        const response = await fetch("/api/v1/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (response.ok && data.token) {
          await login(data.token);
          setSuccess(true);

          // Get redirect URL from session storage or default to home
          const redirectTo = sessionStorage.getItem("authRedirect") || "/";
          sessionStorage.removeItem("authRedirect");

          setTimeout(() => {
            router.push(redirectTo);
          }, 2000);
        } else {
          setError(data.error || "Google authentication failed");
        }
      } catch (error) {
        console.error("Google callback error:", error);
        setError("Network error during Google authentication");
      } finally {
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, login, router]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-page__container">
          <div className="auth-page__loading">
            <Spin size="large" />
            <p style={{ marginTop: "1rem", textAlign: "center" }}>
              Completing Google authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-page__container">
          <div className="auth-page__form">
            <Result
              icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              title="Authentication Successful!"
              subTitle="You have been successfully authenticated with Google. Redirecting you now..."
              extra={[
                <Button
                  type="primary"
                  key="home"
                  onClick={() => router.push("/")}
                >
                  Go to Home
                </Button>,
              ]}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__container">
        <div className="auth-page__form">
          <Result
            icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
            title="Authentication Failed"
            subTitle={error}
            extra={[
              <Button
                type="primary"
                key="retry"
                onClick={() => router.push("/auth/login")}
              >
                Try Again
              </Button>,
              <Button key="home" onClick={() => router.push("/")}>
                Go to Home
              </Button>,
            ]}
          />
        </div>
      </div>
    </div>
  );
});

GoogleCallbackContent.displayName = "GoogleCallbackContent";

const GoogleCallbackPage = () => {
  return (
    <Suspense
      fallback={
        <div className="callback-container">
          <Spin size="large" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
};

export default GoogleCallbackPage;
