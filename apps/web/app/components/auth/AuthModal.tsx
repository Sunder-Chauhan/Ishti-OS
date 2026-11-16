"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../lib/auth/auth-context";
import { IshtiLogo } from "../brand";

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMessage,
    isSandboxMode,
    closeAuthModal,
    sendPhoneOtp,
    verifyPhoneOtp,
  } = useAuth();

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Form state
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [infoMessage, setInfoMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Manage native dialog open/close lifecycle
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isAuthModalOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      // Reset form state when opened
      setStep("phone");
      setOtpCode("");
      setErrorMessage("");
      setInfoMessage("");
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isAuthModalOpen]);

  // Handle native cancel event (Escape key)
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    closeAuthModal();
  };

  // Modern Web Guidance: Click-outside dismiss fallback for <dialog>
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      closeAuthModal();
    }
  };

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    const fullPhone = `+91${cleaned}`;
    setIsSubmitting(true);

    try {
      const res = await sendPhoneOtp(fullPhone);
      if (res.success) {
        setStep("otp");
        setCountdown(60);
        if (res.message) {
          setInfoMessage(res.message);
        }
      } else {
        setErrorMessage(res.message || "Failed to dispatch verification code.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanedOtp = otpCode.replace(/\D/g, "");
    if (cleanedOtp.length !== 6) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    const fullPhone = `+91${phoneNumber.replace(/\D/g, "")}`;
    setIsSubmitting(true);

    try {
      const res = await verifyPhoneOtp(fullPhone, cleanedOtp);
      if (!res.success) {
        setErrorMessage(res.error || "Invalid verification code.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    const fullPhone = `+91${phoneNumber.replace(/\D/g, "")}`;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await sendPhoneOtp(fullPhone);
      if (res.success) {
        setCountdown(60);
        setInfoMessage(res.message || "New code sent.");
      } else {
        setErrorMessage(res.message || "Failed to resend code.");
      }
    } catch {
      setErrorMessage("Failed to resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthModalOpen) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="authModal"
      aria-labelledby="authModalTitle"
      onCancel={handleCancel}
      onClick={handleDialogClick}
      // Progressive enhancement for modern light-dismiss
      {...({ closedby: "any" } as Record<string, unknown>)}
    >
      <div className="authModalContent" onClick={(e) => e.stopPropagation()}>
        {/* Header with Emblem & Close Button */}
        <div className="authModalHeader">
          <div className="authModalBrand">
            <IshtiLogo
              variant="secondary"
              decorative
              className="authModalBrandLogo"
            />
          </div>
          <button
            type="button"
            className="authModalCloseBtn"
            onClick={closeAuthModal}
            aria-label="Close sign-in dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Title and Context */}
        <div className="authModalHeadingGroup">
          <h2 id="authModalTitle" className="authModalTitle">
            {step === "phone" ? "Devotee Sign In" : "Verify Mobile Number"}
          </h2>
          <p className="authModalSubtitle">
            {step === "phone"
              ? authModalMessage || "Access personalized Kundli, consultations, and ritual seva."
              : `Enter the 6-digit code sent to +91 ${phoneNumber}`}
          </p>
        </div>

        {/* Sandbox Notice Banner if active */}
        {isSandboxMode && (
          <div className="authModalSandboxBanner" role="status">
            <span className="authSandboxBadge">STAGING SANDBOX</span>
            <p className="authSandboxText">
              SMS gateway is in staging sandbox mode. Enter any 10-digit number and use verification code:{" "}
              <strong>123456</strong>
            </p>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="authModalError" role="alert">
            {errorMessage}
          </div>
        )}
        {infoMessage && (
          <div className="authModalInfo" role="status">
            {infoMessage}
          </div>
        )}

        {/* STEP 1: Phone Entry */}
        {step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="authModalForm">
            <div className="formFieldGroup">
              <label htmlFor="authPhoneNumber" className="formLabel">
                Mobile Number (India)
              </label>
              <div className="phoneInputWrapper">
                <span className="countryCodePrefix">+91</span>
                <input
                  id="authPhoneNumber"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  className="authInput phoneInput"
                  autoFocus
                  required
                />
              </div>
              <span className="formFieldHint">
                We will send a one-time verification code via SMS.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || phoneNumber.replace(/\D/g, "").length !== 10}
              className="btnAuthPrimary"
            >
              {isSubmitting ? "Dispatching Code..." : "Continue with Mobile"}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Entry */}
        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="authModalForm">
            <div className="formFieldGroup">
              <div className="otpLabelRow">
                <label htmlFor="authOtpCode" className="formLabel">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="btnChangePhone"
                >
                  Change number
                </button>
              </div>
              <input
                id="authOtpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="authInput otpInput"
                autoFocus
                required
              />
              <div className="resendRow">
                {countdown > 0 ? (
                  <span className="resendCountdown">
                    Resend code in {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isSubmitting}
                    className="btnResendOtp"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpCode.replace(/\D/g, "").length !== 6}
              className="btnAuthPrimary"
            >
              {isSubmitting ? "Verifying..." : "Verify & Sign In"}
            </button>
          </form>
        )}

        {/* Guest Continuance Option */}
        <div className="authModalFooter">
          <button
            type="button"
            onClick={closeAuthModal}
            className="btnContinueGuest"
          >
            Explore as Guest
          </button>
          <span className="dpdpNotice">
            By signing in, you agree to ISHTI&apos;s privacy governance under the DPDP Act 2023.
          </span>
        </div>
      </div>
    </dialog>
  );
}
