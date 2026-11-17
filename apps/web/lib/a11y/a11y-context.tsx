"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import type {
  A11yPreferences,
  TextSize,
  LineHeight,
  LetterSpacing,
  ContrastMode,
  AccessibilityProfileId,
} from "./types";
import {
  DEFAULT_A11Y_PREFERENCES,
  ACCESSIBILITY_PROFILES,
} from "./types";

interface A11yContextValue {
  prefs: A11yPreferences;
  setTextSize: (size: TextSize) => void;
  setLineHeight: (lh: LineHeight) => void;
  setLetterSpacing: (ls: LetterSpacing) => void;
  setContrast: (contrast: ContrastMode) => void;
  toggleDyslexiaFont: () => void;
  toggleReducedMotion: () => void;
  togglePauseAnimations: () => void;
  toggleHighlightLinks: () => void;
  toggleBigCursor: () => void;
  applyProfile: (profileId: AccessibilityProfileId) => void;
  resetPreferences: () => void;
  isA11yModalOpen: boolean;
  openA11yModal: () => void;
  closeA11yModal: () => void;

  // Screen Reader & Text-To-Speech
  isSpeaking: boolean;
  isPaused: boolean;
  speechSupported: boolean;
  speakText: (text: string, lang?: string) => void;
  readCurrentPage: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  stopSpeaking: () => void;

  // Voice Navigation
  voiceNavActive: boolean;
  voiceNavSupported: boolean;
  voiceNavStatus: "idle" | "listening" | "processing" | "unsupported";
  lastVoiceCommand: string;
  startVoiceNav: () => void;
  stopVoiceNav: () => void;
}

const A11yContext = createContext<A11yContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = "ishti_a11y_prefs_v1";

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<A11yPreferences>(DEFAULT_A11Y_PREFERENCES);
  const [isA11yModalOpen, setIsA11yModalOpen] = useState(false);

  // Text-To-Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Voice Navigation State
  const [voiceNavActive, setVoiceNavActive] = useState(false);
  const [voiceNavSupported, setVoiceNavSupported] = useState(false);
  const [voiceNavStatus, setVoiceNavStatus] = useState<"idle" | "listening" | "processing" | "unsupported">("idle");
  const [lastVoiceCommand, setLastVoiceCommand] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSpeechSupported("speechSynthesis" in window);
      setVoiceNavSupported("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPrefs({ ...DEFAULT_A11Y_PREFERENCES, ...parsed });
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // 2. Apply Preferences to Document Elements
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.setAttribute("data-a11y-text-size", String(prefs.textSize));
    root.setAttribute("data-a11y-contrast", prefs.contrast);
    root.setAttribute("data-a11y-line-height", prefs.lineHeight);
    root.setAttribute("data-a11y-letter-spacing", prefs.letterSpacing);
    root.setAttribute("data-a11y-dyslexia", String(prefs.dyslexiaFont));
    root.setAttribute("data-a11y-reduced-motion", String(prefs.reducedMotion));
    root.setAttribute("data-a11y-pause-animations", String(prefs.pauseAnimations));
    root.setAttribute("data-a11y-highlight-links", String(prefs.highlightLinks));
    root.setAttribute("data-a11y-big-cursor", String(prefs.bigCursor));

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  // Setters
  const setTextSize = useCallback((size: TextSize) => {
    setPrefs((prev) => ({ ...prev, textSize: size, activeProfile: "default" }));
  }, []);

  const setLineHeight = useCallback((lh: LineHeight) => {
    setPrefs((prev) => ({ ...prev, lineHeight: lh, activeProfile: "default" }));
  }, []);

  const setLetterSpacing = useCallback((ls: LetterSpacing) => {
    setPrefs((prev) => ({ ...prev, letterSpacing: ls, activeProfile: "default" }));
  }, []);

  const setContrast = useCallback((contrast: ContrastMode) => {
    setPrefs((prev) => ({ ...prev, contrast, activeProfile: "default" }));
  }, []);

  const toggleDyslexiaFont = useCallback(() => {
    setPrefs((prev) => ({ ...prev, dyslexiaFont: !prev.dyslexiaFont, activeProfile: "default" }));
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setPrefs((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion, activeProfile: "default" }));
  }, []);

  const togglePauseAnimations = useCallback(() => {
    setPrefs((prev) => ({ ...prev, pauseAnimations: !prev.pauseAnimations, activeProfile: "default" }));
  }, []);

  const toggleHighlightLinks = useCallback(() => {
    setPrefs((prev) => ({ ...prev, highlightLinks: !prev.highlightLinks, activeProfile: "default" }));
  }, []);

  const toggleBigCursor = useCallback(() => {
    setPrefs((prev) => ({ ...prev, bigCursor: !prev.bigCursor, activeProfile: "default" }));
  }, []);

  const applyProfile = useCallback((profileId: AccessibilityProfileId) => {
    if (profileId === "default") {
      setPrefs(DEFAULT_A11Y_PREFERENCES);
      return;
    }
    const profile = ACCESSIBILITY_PROFILES.find((p) => p.id === profileId);
    if (profile) {
      setPrefs((prev) => ({ ...prev, ...profile.settings, activeProfile: profileId }));
    }
  }, []);

  const resetPreferences = useCallback(() => {
    setPrefs(DEFAULT_A11Y_PREFERENCES);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const openA11yModal = useCallback(() => setIsA11yModalOpen(true), []);
  const closeA11yModal = useCallback(() => setIsA11yModalOpen(false), []);

  // 3. Speech Synthesis (Read Aloud)
  const speakText = useCallback((text: string, lang = "en-IN") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // Gentle pace for senior seekers

    // Select suitable voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const readCurrentPage = useCallback(() => {
    if (typeof document === "undefined") return;
    const main = document.getElementById("main-content") || document.querySelector("main") || document.body;
    // Extract readable text from main landmark
    const clone = main.cloneNode(true) as HTMLElement;
    // Remove decorative aria-hidden or script tags
    clone.querySelectorAll("[aria-hidden='true'], script, style").forEach((el) => el.remove());
    const rawText = clone.innerText || clone.textContent || "";
    const cleanText = rawText.replace(/\s+/g, " ").trim();
    const docLang = document.documentElement.lang === "hi" ? "hi-IN" : "en-IN";
    speakText(cleanText, docLang);
  }, [speakText]);

  const pauseSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  // 4. Voice Command Navigation
  const executeVoiceCommand = useCallback(
    (cmd: string) => {
      const lower = cmd.toLowerCase().trim();
      setLastVoiceCommand(cmd);

      if (lower.includes("home") || lower.includes("गृह") || lower.includes("घर")) {
        router.push("/");
      } else if (lower.includes("bhakti") || lower.includes("भक्ति") || lower.includes("शास्त्र")) {
        router.push("/bhakti");
      } else if (lower.includes("panchang") || lower.includes("पंचांग") || lower.includes("पञ्चाङ्ग")) {
        router.push("/panchang");
      } else if (lower.includes("puja") || lower.includes("पूजा") || lower.includes("हवन")) {
        router.push("/puja");
      } else if (lower.includes("astro") || lower.includes("कुंडली") || lower.includes("ज्योतिष")) {
        router.push("/astro");
      } else if (lower.includes("expert") || lower.includes("विद्वान") || lower.includes("पंडित") || lower.includes("आचार्य")) {
        router.push("/experts");
      } else if (lower.includes("community") || lower.includes("सत्संग") || lower.includes("मण्डल")) {
        router.push("/community");
      } else if (lower.includes("profile") || lower.includes("प्रोफ़ाइल") || lower.includes("खाता")) {
        router.push("/profile");
      } else if (lower.includes("large text") || lower.includes("बड़ा पाठ") || lower.includes("बड़ा अक्षर")) {
        setTextSize(140);
      } else if (lower.includes("normal text") || lower.includes("सामान्य पाठ")) {
        setTextSize(100);
      } else if (lower.includes("contrast") || lower.includes("कंट्रास्ट") || lower.includes("dark mode")) {
        setContrast("high_contrast");
      } else if (lower.includes("read") || lower.includes("सुनाओ") || lower.includes("पढ़ो")) {
        readCurrentPage();
      } else if (lower.includes("stop") || lower.includes("रुको") || lower.includes("शांत")) {
        stopSpeaking();
      } else if (lower.includes("accessibility") || lower.includes("सुगमता")) {
        openA11yModal();
      } else if (lower.includes("close") || lower.includes("बंद")) {
        closeA11yModal();
      } else if (lower.includes("back") || lower.includes("पीछे")) {
        window.history.back();
      }
    },
    [router, setTextSize, setContrast, readCurrentPage, stopSpeaking, openA11yModal, closeA11yModal]
  );

  const startVoiceNav = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNavStatus("unsupported");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      const docLang = document.documentElement.lang === "hi" ? "hi-IN" : "en-IN";
      recognition.lang = docLang;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult[0]) {
          const transcript = lastResult[0].transcript;
          executeVoiceCommand(transcript);
        }
      };

      recognition.onerror = () => {
        setVoiceNavStatus("idle");
        setVoiceNavActive(false);
      };

      recognition.onend = () => {
        setVoiceNavStatus("idle");
        setVoiceNavActive(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setVoiceNavActive(true);
      setVoiceNavStatus("listening");
    } catch {
      setVoiceNavStatus("unsupported");
    }
  }, [executeVoiceCommand]);

  const stopVoiceNav = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setVoiceNavActive(false);
    setVoiceNavStatus("idle");
  }, []);

  const value = useMemo(
    () => ({
      prefs,
      setTextSize,
      setLineHeight,
      setLetterSpacing,
      setContrast,
      toggleDyslexiaFont,
      toggleReducedMotion,
      togglePauseAnimations,
      toggleHighlightLinks,
      toggleBigCursor,
      applyProfile,
      resetPreferences,
      isA11yModalOpen,
      openA11yModal,
      closeA11yModal,
      isSpeaking,
      isPaused,
      speechSupported,
      speakText,
      readCurrentPage,
      pauseSpeaking,
      resumeSpeaking,
      stopSpeaking,
      voiceNavActive,
      voiceNavSupported,
      voiceNavStatus,
      lastVoiceCommand,
      startVoiceNav,
      stopVoiceNav,
    }),
    [
      prefs,
      setTextSize,
      setLineHeight,
      setLetterSpacing,
      setContrast,
      toggleDyslexiaFont,
      toggleReducedMotion,
      togglePauseAnimations,
      toggleHighlightLinks,
      toggleBigCursor,
      applyProfile,
      resetPreferences,
      isA11yModalOpen,
      openA11yModal,
      closeA11yModal,
      isSpeaking,
      isPaused,
      speechSupported,
      speakText,
      readCurrentPage,
      pauseSpeaking,
      resumeSpeaking,
      stopSpeaking,
      voiceNavActive,
      voiceNavSupported,
      voiceNavStatus,
      lastVoiceCommand,
      startVoiceNav,
      stopVoiceNav,
    ]
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11y() {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error("useA11y must be used within an A11yProvider");
  }
  return context;
}
