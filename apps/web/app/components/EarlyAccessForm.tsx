"use client";

import React, { useActionState } from "react";
import { submitEarlyAccess, type EarlyAccessResult } from "../actions/early-access";

const initialState: EarlyAccessResult | null = null;

export function EarlyAccessForm() {
  const [state, formAction, isPending] = useActionState(submitEarlyAccess, initialState);

  return (
    <div className="earlyAccessCard">
      <div className="earlyAccessCardHeader">
        <h3 className="earlyAccessTitle">Request Early Access to ISHTI</h3>
        <p className="earlyAccessDesc">
          Join our inaugural cohort of devotees, scholars, and practitioners. We respect your sacred attention and privacy under the DPDP Act 2023.
        </p>
      </div>

      {state?.success ? (
        <div className="statusAlertSuccess" role="status">
          <p>
            <strong>Dhanyavad!</strong> {state.message}
          </p>
        </div>
      ) : (
        <form action={formAction} className="earlyAccessForm">
          {/* Honeypot field for spam prevention */}
          <input
            type="text"
            name="hp_field"
            tabIndex={-1}
            autoComplete="off"
            style={{ display: "none" }}
            aria-hidden="true"
          />

          <div className="formRow">
            <div className="fieldGroup">
              <label htmlFor="earlyAccessEmail" className="fieldLabel">
                Email Address
              </label>
              <input
                id="earlyAccessEmail"
                type="email"
                name="email"
                placeholder="devotee@example.com"
                className="fieldInput"
                autoComplete="email"
              />
            </div>

            <div className="fieldGroup">
              <label htmlFor="earlyAccessPhone" className="fieldLabel">
                Mobile Number (Optional)
              </label>
              <input
                id="earlyAccessPhone"
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                className="fieldInput"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="fieldGroup">
            <label htmlFor="earlyAccessTradition" className="fieldLabel">
              Tradition / Sampradaya of Primary Interest
            </label>
            <select id="earlyAccessTradition" name="tradition" className="fieldSelect" defaultValue="">
              <option value="">All Indian Spiritual Traditions (Universal)</option>
              <option value="Smartha">Smartha / Vedic Universal</option>
              <option value="Vaishnava">Vaishnava (Ramanuja, Madhva, Gaudiya, Vallabha)</option>
              <option value="Shaiva">Shaiva (Shaiva Siddhanta, Kashmir Shaivism, Lingayat)</option>
              <option value="Shakta">Shakta (Devi Worship & Tantra)</option>
              <option value="Vedanta">Advaita / Vishishtadvaita / Dvaita Philosophy</option>
            </select>
          </div>

          <div className="interestsSection">
            <p className="interestsTitle">Select Modules You Wish to Preview:</p>
            <div className="interestsGrid">
              <label className="interestCheckboxLabel">
                <input type="checkbox" name="interests" value="panchang" defaultChecked />
                <span>Panchang & Muhurat</span>
              </label>
              <label className="interestCheckboxLabel">
                <input type="checkbox" name="interests" value="puja" defaultChecked />
                <span>Puja Guides</span>
              </label>
              <label className="interestCheckboxLabel">
                <input type="checkbox" name="interests" value="astro" />
                <span>Kundli & Astrology</span>
              </label>
              <label className="interestCheckboxLabel">
                <input type="checkbox" name="interests" value="bhakti" />
                <span>Devotional Music & Stotras</span>
              </label>
              <label className="interestCheckboxLabel">
                <input type="checkbox" name="interests" value="experts" />
                <span>Verified Pandits</span>
              </label>
            </div>
          </div>

          {state && !state.success && (
            <div
              className={state.code === "MIGRATION_PENDING" ? "statusAlertPending" : "statusAlertError"}
              role="alert"
            >
              <p>
                <strong>{state.code === "MIGRATION_PENDING" ? "Setup Notice:" : "Submission Notice:"}</strong>{" "}
                {state.message}
              </p>
            </div>
          )}

          <div className="formActions">
            <p className="privacyDisclaimer">
              Your details are encrypted and will never be shared or used for unsolicited commercial marketing.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="ctaSubmitButton"
              aria-busy={isPending}
            >
              {isPending ? "Registering..." : "Request Early Access"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
