/**
 * Centralized Human-Readable Error Mapper
 * Maps internal, network, database, and infrastructure errors into
 * calm, respectful, human-understandable messages for seekers.
 * Full technical diagnostics are strictly routed to protected server logs.
 */

export interface FriendlyError {
  en: string;
  hi: string;
}

const ERROR_MAP: Record<string, FriendlyError> = {
  // Database & connectivity
  ECONNREFUSED: {
    en: "Our sacred services are temporarily unable to connect. Please try again in a few moments.",
    hi: "हमारी सेवाएं इस समय संपर्क स्थापित करने में असमर्थ हैं। कृपया कुछ समय पश्चात पुनः प्रयास करें।",
  },
  ETIMEDOUT: {
    en: "The request took longer than expected. Please check your connection and try again.",
    hi: "अनुरोध में अपेक्षा से अधिक समय लगा। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।",
  },
  PGRST205: {
    en: "This service is currently undergoing routine maintenance. Please check back shortly.",
    hi: "यह सेवा इस समय नियमित रखरखाव के अंतर्गत है। कृपया शीघ्र ही पुनः देखें।",
  },
  "42P01": {
    en: "This service is currently undergoing routine maintenance. Please check back shortly.",
    hi: "यह सेवा इस समय नियमित रखरखाव के अंतर्गत है। कृपया शीघ्र ही पुनः देखें।",
  },
  "23505": {
    en: "This record has already been registered with ISHTI.",
    hi: "यह विवरण पहले से ही इष्टि में पंजीकृत है।",
  },

  // Security & Rate Limiting
  RATE_LIMITED: {
    en: "For security and peace of mind, please wait a few moments before trying again.",
    hi: "सुरक्षा एवं सुचारू व्यवस्था हेतु, कृपया कुछ समय प्रतीक्षा करके पुनः प्रयास करें।",
  },
  UNTRUSTED_PROXY_PROVENANCE: {
    en: "Your request could not be safely verified. Please refresh the page and try again.",
    hi: "आपके अनुरोध का सुरक्षित सत्यापन नहीं हो सका। कृपया पृष्ठ को रीफ्रेश करके पुनः प्रयास करें।",
  },
  UNTRUSTED_PROVENANCE: {
    en: "Your request could not be safely verified. Please refresh the page and try again.",
    hi: "आपके अनुरोध का सुरक्षित सत्यापन नहीं हो सका। कृपया पृष्ठ को रीफ्रेश करके पुनः प्रयास करें।",
  },

  // Authentication & OTP
  INVALID_CREDENTIALS: {
    en: "The verification code entered does not match our records. Please check and try again.",
    hi: "दर्ज किया गया सत्यापन कोड मेल नहीं खाता। कृपया जांच कर पुनः प्रयास करें।",
  },
  OTP_EXPIRED: {
    en: "The verification code has expired. Please request a new code.",
    hi: "सत्यापन कोड की समयावधि समाप्त हो गई है। कृपया नया कोड प्राप्त करें।",
  },
  MIGRATION_PENDING: {
    en: "Registration is temporarily paused for a brief scheduled update. Please try again soon.",
    hi: "निर्धारित तकनीकी अद्यतन के कारण पंजीकरण कुछ समय के लिए स्थगित है। कृपया शीघ्र पुनः प्रयास करें।",
  },
};

/**
 * Transforms any raw error into a dignified, senior-friendly message.
 * Emits full diagnostics only to internal server logs.
 */
export function toHumanReadableError(
  error: unknown,
  fallbackMessage = "We were unable to complete your request. Please try again."
): string {
  if (!error) return fallbackMessage;

  // Log full diagnostic for authorized operations
  if (typeof window === "undefined") {
    console.error("[INTERNAL_DIAGNOSTIC]", error);
  }

  const rawMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as { code?: string })?.code;

  if (errorCode && ERROR_MAP[errorCode]) {
    return ERROR_MAP[errorCode].en;
  }

  // Scan for known signatures
  for (const [key, mapping] of Object.entries(ERROR_MAP)) {
    if (rawMessage.includes(key)) {
      return mapping.en;
    }
  }

  if (rawMessage.toLowerCase().includes("database") || rawMessage.toLowerCase().includes("connection")) {
    return "Our services are momentarily unreachable. Please try again in a few moments.";
  }

  if (rawMessage.toLowerCase().includes("otp") || rawMessage.toLowerCase().includes("sms")) {
    return "Phone verification is temporarily taking longer than expected. Please try again shortly.";
  }

  return fallbackMessage;
}
