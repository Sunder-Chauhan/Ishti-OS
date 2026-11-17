# ISHTI — Vendor & Data Processor Register

**Document Reference:** `docs/legal/ISHTI_VENDOR_AND_PROCESSOR_REGISTER.md`  
**Milestone:** M05 — Legal, Privacy & Trust Foundation  
**Version:** 1.0.0  
**Last Updated:** 2026-11-17  
**Governance Classification:** SUBPROCESSOR INVENTORY (DPDP §8(1) / GDPR Art. 28)  

---

## 1. Statutory Context & Purpose

Under the **Digital Personal Data Protection Act, 2023** (Section 8(1)), the Data Fiduciary remains legally responsible for all processing of personal data carried out on its behalf by a Data Processor. Under the **General Data Protection Regulation (GDPR)** (Article 28), controllers must only use processors providing sufficient guarantees and governed by a binding contract.

This register catalogs all third-party cloud infrastructure vendors, payment aggregators, communication gateways, and AI model providers engaged or planned for **ISHTI**.

> [!CRITICAL]
> **No third-party vendor may process production devotee data without an executed, legally binding Data Processing Agreement (DPA) containing standard confidentiality, security, sub-processing authorization, audit, and deletion covenants.**

---

## 2. Third-Party Vendor & Subprocessor Inventory

| Vendor ID | Vendor Legal Entity & Location | Platform Function & Service Scope | Personal Data Categories Processed | Subprocessor Classification | Hosting Region / Data Location | Cross-Border Transfer Status | Governing Contract & DPA Status | Minimum Security Certifications | Founder Confirmation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VEND-01** | **Supabase, Inc.**<br/>970 Toa Payoh North, Singapore / San Francisco, CA, USA | Managed PostgreSQL database, Supabase Auth, Row-Level Security, Encrypted Storage | Devotee profiles, phone numbers, encrypted Kundli birth data, consultation bookings, consent logs | **Data Processor** (Technical Infrastructure) | **AWS ap-south-1 (Mumbai, India)** | **In-Country Processing** (Primary data resides in India) | Supabase Cloud Terms; DPA pending formal corporate execution | SOC 2 Type II, ISO 27001, HIPAA compliant | **FOUNDER CONFIRMATION REQUIRED** (Execute Enterprise DPA) |
| **VEND-02** | **Vercel, Inc.**<br/>440 N Barranca Ave, Covina, CA 91723, USA | Next.js 15 web application hosting, SSR edge routing, dynamic API route execution | IP addresses, HTTP headers, ephemeral server session cookies, edge request logs | **Data Processor** (Application Hosting) | Global Edge Network + AWS Mumbai region | **Cross-Border Transfer** (Edge routing; covered by SCCs) | Vercel Enterprise Terms; DPA pending formal execution | SOC 2 Type II, ISO 27001 | **FOUNDER CONFIRMATION REQUIRED** (Execute Enterprise DPA) |
| **VEND-03** | **Razorpay Software Private Limited**<br/>Bengaluru, Karnataka, India | Payment Aggregator: Indian domestic INR payments (UPI, RuPay, Visa, Mastercard, Netbanking) | Complainant name, email, billing address, masked card numbers, UPI VPA, transaction amounts | **Independent Data Fiduciary** (Regulated Payment Entity) | India (Data localization compliant with RBI mandates) | **In-Country Processing** | Merchant Agreement; KYC verification required | PCI-DSS Level 1, RBI Authorized Payment Aggregator | **FOUNDER CONFIRMATION REQUIRED** (Complete Entity KYC) |
| **VEND-04** | **Stripe Payments India Private Limited / Stripe, Inc.**<br/>San Francisco, CA, USA | International Payment Aggregator: Foreign currency diaspora transactions (USD, EUR, GBP, AED, SGD) | Devotee name, billing address, non-Indian credit cards, currency conversion details | **Independent Data Fiduciary** (Regulated Payment Entity) | USA / Global Cloud Infrastructure | **Cross-Border Transfer** (Inward remittance; FEMA compliant) | Stripe Services Agreement; DPA with Standard Contractual Clauses | PCI-DSS Level 1, SOC 1/2 | **FOUNDER CONFIRMATION REQUIRED** (Approve International Gateway) |
| **VEND-05** | **Twilio Inc. / Gupshup Technologies India Pvt Ltd**<br/>San Francisco, USA / Mumbai, India | Telecommunications Gateway: Phone OTP SMS delivery, WhatsApp ritual reminders | Mobile telephone numbers, verification OTPs, transactional temple notifications | **Data Processor** (Telecom Delivery) | India (TRAI DLT compliant) | **In-Country Delivery** (TRAI telecom routing) | Enterprise Messaging Agreement; TRAI DLT header registration | ISO 27001, TRAI DLT Registration | **FOUNDER CONFIRMATION REQUIRED** (Register DLT Templates) |
| **VEND-06** | **Google Cloud Platform (Google LLC)**<br/>1600 Amphitheatre Pkwy, Mountain View, CA, USA | Gemini API / Vertex AI: Spiritual conversational assistant, Shastric Q&A semantic embeddings | Ephemeral conversational prompts, spiritual questions (PII-scrubbed before transit) | **Data Processor** (AI Service Provider) | Google Cloud India (Delhi/Mumbai) or US Vertex endpoints | **Cross-Border Processing** (Model inference; covered by SCCs) | Google Cloud Enterprise Master Agreement with Zero-Training Addendum | SOC 2 Type II, ISO 27001, ISO 27701 | **FOUNDER CONFIRMATION REQUIRED** (Execute Enterprise Zero-Retention Terms) |
| **VEND-07** | **Cloudflare, Inc.**<br/>101 Townsend St, San Francisco, CA 94107, USA | Reverse Proxy, DDoS mitigation, Web Application Firewall (WAF), Edge SSL/TLS termination | Client IP addresses, network telemetry, Cloudflare Ray IDs, attack signatures | **Data Processor** (Network Security) | Global Anycast Edge Network | **Cross-Border Routing** (Ephemeral network transit) | Cloudflare Standard Enterprise Agreement & DPA | SOC 2 Type II, ISO 27001, PCI-DSS | **FOUNDER CONFIRMATION REQUIRED** (Configure Production WAF Rules) |

---

## 3. Subprocessor Review & Audit Protocol

1. **Annual Security Review:** Every vendor in this register must be reviewed annually for valid SOC 2 Type II, ISO 27001, and PCI-DSS (for payments) compliance.
2. **Breach Notification SLA:** Vendor DPAs must contractually require vendors to notify ISHTI of any security incident or personal data breach affecting platform data within **24 hours**, enabling ISHTI to meet its CERT-In 6-hour and DPDP §8(6) statutory reporting obligations.
3. **Data Return & Destruction:** Upon contract termination, vendors must guarantee complete deletion or return of all personal data within **30 days** and furnish a formal cryptographic Destruction Certificate.
4. **No-Training Covenant:** Specific to AI vendors (Google Cloud), contract terms must strictly prohibit using ISHTI queries, user inputs, or generated responses for foundation model retraining or human review.
