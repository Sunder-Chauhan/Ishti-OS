"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Search, Check, Globe } from "lucide-react";
import { useI18n } from "../../../lib/i18n/context";
import type { Locale } from "../../../lib/i18n/types";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LanguageModal({ isOpen, onClose }: LanguageModalProps) {
  const { locale, setLocale, supportedLanguages, dict } = useI18n();
  const [search, setSearch] = useState("");
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      setSearch("");
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

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
      onClose();
    }
  };

  const filtered = supportedLanguages.filter(
    (lang) =>
      lang.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      lang.englishName.toLowerCase().includes(search.toLowerCase()) ||
      lang.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={handleDialogClick}
      className="langDialog"
      aria-labelledby="langDialogTitle"
      aria-modal="true"
    >
      <div className="langPanelInner">
        {/* Header */}
        <div className="langPanelHeader">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="langGlobeBadge" aria-hidden="true">
              <Globe size={18} strokeWidth={1.8} />
            </div>
            <div>
              <h2 id="langDialogTitle" className="langDialogTitle">
                {dict.common.selectLanguage}
              </h2>
              <p className="langDialogSubtitle">
                Choose your preferred regional Indian language or English
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="a11yCloseBtn"
            aria-label={dict.common.close}
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* Search Input */}
        <div className="langSearchWrapper">
          <Search size={16} strokeWidth={1.8} className="langSearchIcon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search language / भाषा खोजें..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="langSearchInput"
            autoFocus
          />
        </div>

        {/* Languages List */}
        <div className="langListGrid" role="listbox" aria-label="Available Languages">
          {filtered.map((lang) => {
            const isSelected = locale === lang.code;
            const isFullyTranslated = lang.coveragePercent === 100;

            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLocale(lang.code as Locale);
                  onClose();
                }}
                className={`langOptionCard ${isSelected ? "langOptionActive" : ""}`}
              >
                <div className="langCardText">
                  <div className="langNativeTitle">{lang.nativeName}</div>
                  <div className="langEnglishTitle">
                    {lang.englishName} &bull; {lang.script}
                  </div>
                </div>

                <div className="langCardMeta">
                  {isFullyTranslated ? (
                    <span className="langBadgeComplete">Complete (100%)</span>
                  ) : (
                    <span className="langBadgeScaffold">Roadmap (English fallback)</span>
                  )}
                  {isSelected && (
                    <span className="langSelectedIcon" aria-hidden="true">
                      <Check size={16} strokeWidth={2.4} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Note on Religious Content Integrity */}
        <div className="langFooterNotice">
          <p>
            <strong>Religious Content Integrity:</strong> Sacred Sanskrit mantras and canonical verses are always preserved in original Devanagari and authenticated IAST transliteration regardless of interface language.
          </p>
        </div>
      </div>
    </dialog>
  );
}
