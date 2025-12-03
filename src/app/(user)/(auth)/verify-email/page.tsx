"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "../auth.module.css";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { toast } from "sonner";

const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerifying(false);
        setError("No verification token provided");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setVerified(true);
          toast.success("Email verified successfully!");
        } else {
          setError(data.error || "Verification failed");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.error(data.error || "Failed to send verification email");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (verifying) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.loadingState}>
              <Loader2 size={48} className={styles.spinner} />
              <p>Verifying your email...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.successIcon}>
              <CheckCircle size={64} />
            </div>
            <div className={styles.header}>
              <h1 className={styles.title}>Email Verified!</h1>
              <p className={styles.subtitle}>
                Your email has been successfully verified. You can now sign in to your account.
              </p>
            </div>
            <Link href="/login" className={styles.submitButton}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.errorIcon}>
            <XCircle size={64} />
          </div>
          <div className={styles.header}>
            <h1 className={styles.title}>Verification Failed</h1>
            <p className={styles.subtitle}>
              {error || "We couldn't verify your email. The link may be invalid or expired."}
            </p>
          </div>

          <div className={styles.resendSection}>
            <p className={styles.resendText}>
              Enter your email to receive a new verification link:
            </p>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={styles.input}
                  disabled={resending}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleResendVerification}
              className={styles.submitButton}
              disabled={resending}
            >
              {resending ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </button>
          </div>

          <p className={styles.footer}>
            <Link href="/login" className={styles.link}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const VerifyEmailPage = () => {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.card}>
              <div className={styles.loadingState}>
                <Loader2 size={48} className={styles.spinner} />
                <p>Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmailPage;
