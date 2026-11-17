import type { PolicyDocument } from "@spiritual-os/types";

/**
 * ISHTI Global Legal & Trust Policy Registry
 *
 * Grounded in:
 * - Master Policy Structure with Regional Schedules (Schedule A: India, B: EU/UK, C: US, D: Global)
 * - Information Technology Act, 2000 & IT Rules 2021 (as amended Feb 2026: 24h ack, 7d resolve)
 * - Digital Personal Data Protection Act, 2023 (G.S.R. 843(E) commencement timeline)
 * - General Data Protection Regulation (GDPR) Regulation (EU) 2016/679 (Special Category Art 9)
 * - California Consumer Privacy Act (CCPA) as amended by CPRA ($26.625M gross revenue threshold)
 * - Income-tax Act, 2025 (§62 / Rule 46) & Companies Act, 2013 (§128)
 *
 * NOTE: All statutory officer designations and legal entity references are designated with
 * [LEGAL_REVIEW_REQUIRED: ...] placeholders pending formal operator and legal counsel sign-off.
 */
export const POLICIES: PolicyDocument[] = [
  {
    slug: "terms",
    title: "Master Terms of Service",
    category: "legal",
    status: "LEGAL_REVIEW",
    version: "1.0.0-draft",
    effectiveDate: "Pending Formal Legal Review",
    lastReviewedDate: "2026-11-17",
    summary:
      "Global master terms governing access to ISHTI spiritual services, content, AI guidance, and marketplace consultations, structured with jurisdiction-specific regional schedules.",
    statutoryBasis: [
      "Indian Contract Act, 1872",
      "Information Technology Act, 2000",
      "Consumer Protection (E-Commerce) Rules, 2020",
      "EU Digital Services Act (DSA)",
      "Uniform Commercial Code (UCC)",
    ],
    dpoContactRequired: false,
    sections: [
      {
        id: "terms-acceptance",
        title: "1. Acceptance of Terms & Eligibility",
        order: 1,
        content: `These Master Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "Devotee", or "You") and [LEGAL_REVIEW_REQUIRED: Registered Corporate Entity Name, e.g. ISHTI Spiritual Technologies Private Limited] ("ISHTI", "we", "our", or "us"). By accessing or using the ISHTI web portal, mobile applications, APIs, or services (collectively, the "Platform"), you confirm that you have attained the age of majority in your jurisdiction (at least 18 years of age in India and the United States) and possess the legal capacity to enter into this agreement. If accessing on behalf of a minor, you represent that you are the lawful parent or legal guardian.`,
      },
      {
        id: "terms-scope",
        title: "2. Nature & Scope of the Spiritual Ecosystem",
        order: 2,
        content: `ISHTI is a modern spiritual platform connecting devotees with authentic Vedic traditions, canonical scriptures, devotional music, Panchang calculations, astrological ephemeris, and accredited spiritual experts. ISHTI operates as both a direct provider of curated spiritual content and software tools, and as a digital intermediary platform connecting independent spiritual service providers (such as Pandits, Acharyas, and Astrologers) with seekers. ISHTI does not own, endorse, or guarantee the spiritual, personal, or metaphysical efficacy of any ritual, prayer, or astrological reading.`,
      },
      {
        id: "terms-account",
        title: "3. User Account Security & Devotee Identity",
        order: 3,
        content: `To access personalized sadhana tracking, astrological charts, or consultation bookings, you may create an account using phone-based OTP or verified credentials. You are solely responsible for maintaining the confidentiality of your session credentials and for all activities conducted through your account. You agree to notify ISHTI immediately of any unauthorized access. ISHTI employs cryptographic rate-limiting and secure session tokens to protect your digital sanctuary.`,
      },
      {
        id: "terms-intellectual-property",
        title: "4. Sacred Content, Trademarks & Intellectual Property",
        order: 4,
        content: `All software, algorithms, UI designs, brand marks, and curated spiritual editorial content on ISHTI are protected by copyright, trademark, and intellectual property laws. Canonical Vedic root texts are recognized as timeless heritage; our curated translations, scholarly commentaries, structural annotations, and audio recordings represent proprietary works. Unauthorized web scraping, bulk extraction, or reverse engineering of ISHTI software or datasets is strictly prohibited.`,
      },
      {
        id: "terms-disclaimers",
        title: "5. Comprehensive Spiritual & Metaphysical Disclaimers",
        order: 5,
        content: `ASTROLOGICAL READINGS, KUNDLI GENERATION, PANCHANG CALCULATIONS, AND PUJA GUIDANCE ARE PROVIDED FOR CULTURAL, DEVOTIONAL, AND EDUCATIONAL PURPOSES ONLY. THEY DO NOT CONSTITUTE PROFESSIONAL MEDICAL, PSYCHIATRIC, LEGAL, FINANCIAL, OR MARITAL ADVICE. YOU SHOULD NEVER RELY UPON ASTROLOGICAL ASSESSMENTS OR SPIRITUAL CONSULTATIONS AS A SUBSTITUTE FOR SOUND MEDICAL TREATMENT OR COMPETENT PROFESSIONAL COUNSEL. ISHTI EXPRESSLY DISCLAIMS ANY LIABILITY FOR ACTIONS TAKEN OR OMITTED BASED ON PLATFORM CONTENT.`,
      },
      {
        id: "terms-limitation-liability",
        title: "6. Limitation of Liability",
        order: 6,
        content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ISHTI, ITS DIRECTORS, EMPLOYEES, AFFILIATES, OR EXPERTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR ACCESS TO OR INABILITY TO USE THE PLATFORM. ISHTI'S AGGREGATE LIABILITY ARISING FROM ALL CLAIMS RELATING TO THE PLATFORM SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY YOU TO ISHTI IN THE PRECEDING THREE (3) MONTHS OR INR 1,000 (WHICHEVER IS GREATER).`,
      },
      {
        id: "terms-governing-law",
        title: "7. Governing Law & Dispute Resolution",
        order: 7,
        content: `Except as modified by applicable Regional Schedules: These Terms shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts at [LEGAL_REVIEW_REQUIRED: City, State, e.g. New Delhi, India]. Where permissible by law, parties agree to attempt amicable conciliation before instituting formal legal proceedings.`,
      },
    ],
    schedules: [
      {
        id: "schedule-in",
        slug: "schedule-a-india",
        title: "Schedule A: India Specific Provisions",
        jurisdiction: "IN",
        description: "Mandatory terms applicable to users accessing ISHTI within India.",
        sections: [
          {
            id: "sched-in-it-rules",
            title: "A.1 Intermediary Due Diligence (IT Rules 2021)",
            order: 1,
            content: `ISHTI complies with the due diligence requirements under Rule 3 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (as amended February 2026). ISHTI designates a Statutory Grievance Officer resident in India who acknowledges user complaints within 24 hours and resolves them within seven (7) days. Takedown requests for specified unlawful content under Rule 3(1)(d) are processed within 36 hours of receipt of court order or government notification.`,
            legalBasisRef: "Information Technology (Intermediary Guidelines) Rules, 2021 Rule 3",
          },
          {
            id: "sched-in-ecom",
            title: "A.2 Consumer Protection (E-Commerce) Rules, 2020",
            order: 2,
            content: `In compliance with the Consumer Protection (E-Commerce) Rules, 2020: ISHTI provides unambiguous disclosures regarding total pricing inclusive of all taxes (GST 18%), country of origin, cancellation windows, refund timelines, and verified credentials of onboarded Pandits and Acharyas. No deceptive dark patterns or pre-ticked consent boxes are utilized.`,
            legalBasisRef: "Consumer Protection (E-Commerce) Rules, 2020",
          },
        ],
      },
      {
        id: "schedule-eu-uk",
        slug: "schedule-b-eu-uk",
        title: "Schedule B: European Union & United Kingdom Provisions",
        jurisdiction: "EU_UK",
        description: "Special provisions for consumers in the EU/EEA and United Kingdom.",
        sections: [
          {
            id: "sched-eu-withdrawal",
            title: "B.1 Statutory Right of Withdrawal (14-Day Cooling Off)",
            order: 1,
            content: `If you are an EU/EEA or UK consumer purchasing digital content (e.g. downloadable chant tracks or digital scripture commentaries), you expressly acknowledge and agree that performance begins immediately upon purchase, and you expressly waive your 14-day statutory right of withdrawal once digital transmission has begun. For scheduled live video consultations with Pandits, you retain the right to withdraw up to 14 days after purchase, provided the consultation has not yet occurred.`,
            legalBasisRef: "EU Consumer Rights Directive 2011/83/EU Article 16(m)",
          },
          {
            id: "sched-eu-dsa",
            title: "B.2 Digital Services Act & Dispute Resolution",
            order: 2,
            content: `Pursuant to Regulation (EU) 2022/2065 (Digital Services Act), users have access to internal complaint-handling mechanisms and the right to select out-of-court dispute settlement bodies certified under the DSA. EU consumers may also access the European Commission's Online Dispute Resolution (ODR) platform.`,
            legalBasisRef: "Regulation (EU) 2022/2065 (DSA)",
          },
        ],
      },
      {
        id: "schedule-us",
        slug: "schedule-c-us",
        title: "Schedule C: United States Specific Provisions",
        jurisdiction: "US",
        description: "Terms and statutory notices for devotees residing in the United States.",
        sections: [
          {
            id: "sched-us-arbitration",
            title: "C.1 Mandatory Binding Arbitration & Class Action Waiver",
            order: 1,
            content: `FOR DEVOTEES RESIDING IN THE UNITED STATES: YOU AND ISHTI MUTUALLY AGREE THAT ALL DISPUTES SHALL BE RESOLVED BY BINDING INDIVIDUAL ARBITRATION ADMINISTERED BY THE AMERICAN ARBITRATION ASSOCIATION (AAA) UNDER ITS CONSUMER ARBITRATION RULES. YOU WAIVE ANY RIGHT TO COMMENCE OR PARTICIPATE IN ANY CLASS ACTION, COLLECTIVE ACTION, OR REPRESENTATIVE PROCEEDING AGAINST ISHTI.`,
          },
          {
            id: "sched-us-disclaimers",
            title: "C.2 Astrological & Spiritual First Amendment Notice",
            order: 2,
            content: `Astrological calculations and spiritual interpretations offered on ISHTI are expressions of philosophical belief, cultural heritage, and entertainment protected under the First Amendment of the United States Constitution. In jurisdictions such as California and New York, metaphysical consultations are classified as entertainment and educational introspection; no guarantees of material outcomes are made.`,
          },
        ],
      },
      {
        id: "schedule-global",
        slug: "schedule-d-global",
        title: "Schedule D: Global & International Remittance",
        jurisdiction: "GLOBAL",
        description: "Provisions for devotees in other international jurisdictions.",
        sections: [
          {
            id: "sched-global-compliance",
            title: "D.1 Currency Conversion, Remittance & Export Controls",
            order: 1,
            content: `International cross-border transactions are processed via accredited multi-currency payment providers in supported currencies (USD, EUR, GBP, AED, SGD). Currency conversion rates and foreign exchange fees imposed by your issuing bank are your sole responsibility. You agree to comply with all applicable local import/export regulations and tax obligations in your jurisdiction.`,
          },
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Global Privacy Notice & Data Sanctuary",
    category: "privacy",
    status: "LEGAL_REVIEW",
    version: "1.0.0-draft",
    effectiveDate: "Pending Formal Legal Review",
    lastReviewedDate: "2026-11-17",
    summary:
      "Comprehensive global privacy notice outlining data fiduciary obligations, special-category religious data handling, server-side envelope encryption, and cross-border protections.",
    statutoryBasis: [
      "Digital Personal Data Protection Act, 2023 (DPDP Act)",
      "General Data Protection Regulation (GDPR) (EU) 2016/679",
      "California Consumer Privacy Act (CCPA) / CPRA",
      "Singapore Personal Data Protection Act (PDPA)",
    ],
    dpoContactRequired: true,
    sections: [
      {
        id: "privacy-commitment",
        title: "1. Sacred Trust & The ISHTI Data Sanctuary",
        order: 1,
        content: `At ISHTI, we recognize that spiritual information—your birth coordinates, astrological charts, sacred ritual intentions (Sankalpa), and personal prayers—embodies the most deeply personal reflections of your soul. We treat all spiritual data with the sanctity of a temple sanctum sanctorum. We never sell, rent, monetize, or broker your personal or devotional data to third-party ad networks or data brokers.`,
      },
      {
        id: "privacy-categories",
        title: "2. Categories of Data Processed & Classification",
        order: 2,
        content: `ISHTI processes data under strict classification levels:
1. Spiritual & Devotional Data (Confidential): Ritual intentions, puja bookings, deity preferences, prayer notes, and spiritual study progress. Under GDPR Article 9, data revealing religious or philosophical beliefs constitutes 'Special Category Personal Data' processed exclusively upon your explicit, granular consent.
2. Astrological & Ephemeris Data (Confidential / Encrypted): Date of birth, exact time of birth, and geographic coordinates of birth. Protected under server-side AES-256-GCM envelope encryption with tenant-bound authentication tags (AAD).
3. Devotee Profile Data: Full name, mobile number, email address, language preference, and sampradaya tradition.
4. Transactional Data (Restricted): Payment transaction identifiers, billing address, currency, and tax invoice metadata. Raw credit card numbers and bank credentials are never stored on ISHTI servers; they are processed by PCI-DSS Level 1 certified gateways.
5. Technical Diagnostics & Telemetry (Internal): Salted HMAC-SHA-256 anonymized IP hashes, device browser type, and aggregate reader latency metrics (strictly opt-in).`,
      },
      {
        id: "privacy-legal-bases",
        title: "3. Legal Bases for Processing Across Jurisdictions",
        order: 3,
        content: `We process personal data only when an authorized legal basis exists:
- India (DPDP Act 2023): Granular, unbundled, verifiable consent (§6) for spiritual, astrological, and communication purposes; legitimate uses (§7) for order fulfillment and statutory accounting.
- European Union & UK (GDPR): Explicit Consent (Art. 6(1)(a) & Art. 9(2)(a)) for religious data and astrological profiling; Performance of a Contract (Art. 6(1)(b)) for booking fulfillment and digital content delivery; Legal Obligation (Art. 6(1)(c)) for statutory accounting and tax retention.
- United States (State Privacy Laws): We provide notice at collection, explicit opt-out rights, and do not 'sell' or 'share' personal data as defined by CCPA/CPRA.`,
      },
      {
        id: "privacy-encryption",
        title: "4. Cryptographic Security & Server-Side Envelope Architecture",
        order: 4,
        content: `Astrological records (date of birth, time of birth, and exact geographic coordinates) are encrypted prior to database persistence using server-side AES-256-GCM authenticated envelope encryption. Decryption keys are loaded securely into isolated server runtime environments and never exposed to client browsers or unauthenticated database viewers. Additional cryptographic safeguards include HMAC-SHA-256 salted IP masking and PostgreSQL Row-Level Security (RLS) enforcing strict tenant isolation.`,
      },
      {
        id: "privacy-sharing",
        title: "5. Data Sharing & Third-Party Processors",
        order: 5,
        content: `We disclose personal data strictly on a need-to-know basis to:
1. Verified Pandits & Acharyas: Only when you book a live consultation or puja service. The assigned Pandit receives your astrological chart and stated Sankalpa strictly for officiating the ritual. Access automatically expires upon completion of the service.
2. Infrastructure & Cloud Providers: Scalable cloud hosting, relational database infrastructure, and content delivery networks bound by rigorous Data Processing Agreements (DPAs).
3. Payment Processors: PCI-DSS certified payment aggregators (e.g. Razorpay, Stripe) for executing transactions.
4. Statutory Authorities: When mandated by binding court order or lawful process under applicable jurisdiction.`,
      },
      {
        id: "privacy-transfers",
        title: "6. Cross-Border International Transfers",
        order: 6,
        content: `ISHTI operates across global cloud infrastructure. When personal data originates in the EU, UK, or Switzerland and is transferred internationally, we implement European Commission Standard Contractual Clauses (SCCs) and supplementary technical security measures. For Indian residents, cross-border transfers adhere to Section 16 of the DPDP Act 2023 and applicable Central Government transfer rules.`,
      },
      {
        id: "privacy-retention",
        title: "7. Data Retention & Statutory Locks",
        order: 7,
        content: `Personal data is retained only as long as necessary for the specified purposes:
- Devotee Account & Profile: Retained while account remains active; deleted within 30 days of verified erasure request.
- Kundli Birth Charts: Retained until devotee deletes the chart or closes their account.
- Inactive Session & Rate Limiter Logs: Purged after 30 to 90 days.
- Statutory Accounting & Tax Records: Tax invoices, payment references, and statutory audit trails are retained for 7 years under Income-tax Act, 2025 (§62 / Rule 46) and 8 financial years under Companies Act, 2013 (§128). When an erasure request is executed, personal identity is pseudonymized ('ANON-USER-DELETED') while financial records remain locked to satisfy statutory compliance.`,
      },
      {
        id: "privacy-officer",
        title: "8. Data Protection Officer & Grievance Contact",
        order: 8,
        content: `For any inquiries, rights requests, or privacy concerns, you may contact ISHTI's Data Protection Officer:
Attn: Data Protection Officer
[LEGAL_REVIEW_REQUIRED: Appointed DPO Name or Office]
Entity: [LEGAL_REVIEW_REQUIRED: Corporate Entity Name]
Address: [LEGAL_REVIEW_REQUIRED: Registered Postal Address]
Email: privacy@ishti.internal (or dpo@[LEGAL_REVIEW_REQUIRED: domain])
Response timeframe: We acknowledge inquiries within 24 hours and resolve statutory requests within applicable legal deadlines.`,
      },
    ],
  },
  {
    slug: "refunds",
    title: "Cancellation & Refund Policy",
    category: "commerce",
    status: "LEGAL_REVIEW",
    version: "1.0.0-draft",
    effectiveDate: "Pending Formal Legal Review",
    lastReviewedDate: "2026-11-17",
    summary:
      "Transparent governance for booking cancellations, consultation rescheduling, digital product returns, and automated refund processing timelines.",
    statutoryBasis: [
      "Consumer Protection (E-Commerce) Rules, 2020 (India)",
      "EU Consumer Rights Directive 2011/83/EU",
      "UK Consumer Rights Act 2015",
    ],
    dpoContactRequired: false,
    sections: [
      {
        id: "refunds-general",
        title: "1. General Principles of Commercial Trust",
        order: 1,
        content: `ISHTI upholds transparent, fair, and prompt refund practices. We recognize that sacred ceremonies, astrology consultations, and devotional services require careful preparation by accredited Pandits and Acharyas, while spiritual seekers deserve clear guarantees in the event of schedule changes, technical failures, or non-delivery.`,
      },
      {
        id: "refunds-consultations",
        title: "2. Live Consultations & Puja Bookings Cancellation Model (Proposed)",
        order: 2,
        content: `[PROPOSED COMMERCIAL POLICY — SUBJECT TO FORMAL OPERATOR & LEGAL REVIEW]:
For scheduled one-on-one video consultations, online puja ceremonies, and Jyotish sessions, ISHTI proposes the following illustrative cancellation cutoff framework:
- More than 24 hours prior to scheduled start (T > 24h): 100% full refund of the booking fee. [COMMERCIAL REVIEW REQUIRED: Whether payment gateway fees are absorbed by the platform or deducted, subject to applicable consumer protection laws].
- Between 4 hours and 24 hours prior (4h <= T <= 24h): 50% refund, acknowledging that the Pandit has reserved consecrated time and commenced ritual preparation.
- Less than 4 hours prior (T < 4h): Non-refundable, with one-time emergency rescheduling permitted up to 2 hours prior subject to the Pandit's calendar availability.
- Pandit No-Show or Cancellation: If an accredited expert fails to appear within 15 minutes of the scheduled start time, the devotee is entitled to an immediate 100% full refund with zero deductions or complimentary priority rescheduling.`,
      },
      {
        id: "refunds-digital",
        title: "3. Digital Content, E-Books & Audio Recordings",
        order: 3,
        content: `Purchases of instantly downloadable audio files, high-resolution yantra prints, or digital scripture commentaries are non-refundable once download or streaming has commenced. EU/UK consumers expressly agree to waive the 14-day statutory withdrawal period upon beginning digital content consumption, in accordance with Article 16(m) of EU Directive 2011/83/EU. If a digital asset is defective or corrupted, ISHTI will provide a corrected download or full refund upon verification.`,
      },
      {
        id: "refunds-processing",
        title: "4. Processing Timelines & Currency Settlement",
        order: 4,
        content: `Approved refunds are credited directly to the original payment method utilized at checkout:
- UPI and Net Banking (India): Processed within 3 to 5 business days.
- Domestic Credit & Debit Cards (India): Processed within 5 to 7 business days.
- International Cards & Multi-Currency Gateways (USD/EUR/GBP/AED/SGD): Processed within 7 to 10 business days, subject to the international correspondent banking network.
- Duplicate Debits & Failed Transactions: If funds are deducted from your account during a failed booking attempt, automated gateway reconciliation will restore funds within 48 to 72 business hours.`,
      },
      {
        id: "refunds-disputes",
        title: "5. Dispute Escalation & Grievance Contact",
        order: 5,
        content: `If your refund is delayed beyond 10 business days or you wish to dispute an expert consultation outcome, contact billing-trust@ishti.internal quoting your Booking Reference Number. All commercial disputes are reviewed by our Commerce Trust team within 48 hours.`,
      },
    ],
  },
  {
    slug: "payments",
    title: "Commercial Payment & Multi-Currency Terms",
    category: "commerce",
    status: "LEGAL_REVIEW",
    version: "1.0.0-draft",
    effectiveDate: "Pending Formal Legal Review",
    lastReviewedDate: "2026-11-17",
    summary:
      "Governance governing payment processing, multi-currency conversion, GST and indirect taxation, payment gateways, and chargeback prevention.",
    statutoryBasis: [
      "Payment and Settlement Systems Act, 2007 (India)",
      "Central Goods and Services Tax Act, 2017 (CGST Act)",
      "EU Payment Services Directive (PSD2 / PSD3)",
    ],
    dpoContactRequired: false,
    sections: [
      {
        id: "payments-methods",
        title: "1. Supported Payment Methods & Gateways",
        order: 1,
        content: `ISHTI partners with licensed payment aggregators to ensure bank-grade security:
- In India: Payments are processed via PCI-DSS compliant aggregators (e.g. Razorpay, Cashfree) supporting UPI, RuPay, Visa, MasterCard, Net Banking, and recognized wallets.
- International: Payments are processed in recognized foreign currencies (USD, EUR, GBP, AED, SGD) through international acquiring gateways with 3D-Secure 2.0 (3DS2) authentication.`,
      },
      {
        id: "payments-taxation",
        title: "2. Taxation & Invoicing (GST, VAT, Sales Tax)",
        order: 2,
        content: `All prices displayed to devotees in India are inclusive of applicable Goods and Services Tax (GST) at statutory rates (typically 18% for online information and consultation services). Tax invoices specifying ISHTI's GSTIN ([LEGAL_REVIEW_REQUIRED: GSTIN]), SAC codes, and statutory tax breakdown are delivered electronically upon transaction completion. For international customers, applicable local VAT or cross-border digital service taxes are collected where mandated by destination tax laws.`,
      },
      {
        id: "payments-chargebacks",
        title: "3. Chargebacks & Fraud Prevention",
        order: 3,
        content: `Initiating an unwarranted or fraudulent payment chargeback without first contacting ISHTI customer support violates these Terms. In the event of a disputed charge, ISHTI reserves the right to place a temporary administrative hold on associated bookings while providing transaction evidence (session logs, booking confirmation, Pandit attendance records) to the acquiring bank.`,
      },
    ],
  },
  {
    slug: "data-deletion",
    title: "Data Subject Rights & Deletion Guide",
    category: "privacy",
    status: "LEGAL_REVIEW",
    version: "1.0.0-draft",
    effectiveDate: "Pending Formal Legal Review",
    lastReviewedDate: "2026-11-17",
    summary:
      "Comprehensive self-service guide explaining how devotees can exercise statutory privacy rights, request data exports (SAR), and initiate permanent account erasure.",
    statutoryBasis: [
      "Digital Personal Data Protection Act, 2023 (§11–§14)",
      "General Data Protection Regulation (GDPR) (Articles 15, 17, 20)",
      "California Consumer Privacy Act (CCPA) §1798.105",
    ],
    dpoContactRequired: true,
    sections: [
      {
        id: "deletion-overview",
        title: "1. Your Statutory Privacy Rights",
        order: 1,
        content: `Under the DPDP Act 2023, GDPR, and global data protection frameworks, you have sovereign rights over your personal data:
- Right to Access & Data Portability: You may request a machine-readable JSON archive of all personal data held by ISHTI (Subject Access Request / SAR).
- Right to Correction & Rectification: You may update inaccurate personal or profile details at any time.
- Right to Erasure / Deletion: You may request complete erasure of your account, birth charts, prayer journals, and personal records.
- Right to Withdraw Consent: You may revoke specific consents without terminating your overall platform account.`,
      },
      {
        id: "deletion-procedure",
        title: "2. The 7-Stage Deletion Orchestration Process",
        order: 2,
        content: `To ensure complete and irreversible privacy protection without breaking downstream database integrity, ISHTI executes account erasure across a rigorous 7-stage pipeline:
1. Verification: Identity confirmation via authenticated session or multi-factor challenge.
2. Anti-Cascade Unlinking: Severing relational dependencies on marketplace reviews and community threads so historical scripture comments remain anonymous without referencing your profile.
3. Astrological Cryptographic Shredding: Immediate destruction of encrypted Kundli birth records and associated tenant encryption sub-keys.
4. Spiritual Content Scrubbing: Permanent deletion of personal Sankalpa notes, private prayer requests, and saved ritual preferences.
5. Financial Record Pseudonymization: In compliance with statutory tax retention mandates, billing and transaction records are severed from your identity and reassigned to 'ANON-USER-DELETED'.
6. Telemetry & Cache Purge: Removal of transient Redis session tokens and unhashed device references.
7. Proof Receipt: Generation of a cryptographically signed deletion certificate containing a SHA-256 confirmation hash for your records.`,
      },
      {
        id: "deletion-statutory-lock",
        title: "3. Mandatory Statutory Retention Exceptions",
        order: 3,
        content: `Data protection laws universally recognize statutory retention exceptions. While all spiritual, astrological, and personal identity data is permanently erased upon request, ISHTI is legally required to retain financial invoices, transaction records, and GST/income tax logs for 7 years under Income-tax Act, 2025 (§62 / Rule 46) and 8 financial years under Companies Act, 2013 (§128). These archived financial records are strictly isolated, locked against operational use, and retained solely to satisfy legal audit obligations.`,
      },
    ],
  },
  {
    slug: "acceptable-use",
    title: "Acceptable Use & Community Decorum Policy",
    category: "safety",
    status: "LEGAL_REVIEW",
    version: "1.0.0-draft",
    effectiveDate: "Pending Formal Legal Review",
    lastReviewedDate: "2026-11-17",
    summary:
      "Standards of conduct, sacred community decorum, content moderation rules under IT Rules 2021, and prohibitions against spiritual exploitation.",
    statutoryBasis: [
      "Information Technology Act, 2000 (§66A / §79)",
      "IT (Intermediary Guidelines) Rules, 2021 Rule 3(1)(b)",
      "Indian Penal Code / Bharatiya Nyaya Sanhita, 2023",
    ],
    dpoContactRequired: false,
    sections: [
      {
        id: "aup-decorum",
        title: "1. Sacred Community Decorum & Dharmic Conduct",
        order: 1,
        content: `ISHTI is dedicated to spiritual contemplation, sacred scholarship, and harmonious devotee communion. All users, community participants, scholars, and experts are expected to maintain the highest standards of courtesy, humility, and mutual respect (Samanvaya). Hostile sectarian polemics, derogatory remarks towards any sampradaya, faith, or tradition, and divisive rhetoric are strictly prohibited.`,
      },
      {
        id: "aup-prohibitions",
        title: "2. Prohibited Conduct & Content (Rule 3(1)(b) Compliance)",
        order: 2,
        content: `In compliance with Rule 3(1)(b) of the Information Technology (Intermediary Guidelines) Rules, 2021, users shall not host, display, upload, modify, publish, transmit, or share any information that:
- Belongs to another person and to which the user does not have any right;
- Is defamatory, obscene, pornographic, pedophilic, invasive of another's privacy, or religiously hateful;
- Promotes enmity between different groups on grounds of religion, race, place of birth, or caste;
- Harasses, abuses, or insults Pandits, Acharyas, scholars, or fellow devotees;
- Infringes any patent, trademark, copyright, or proprietary rights;
- Deceives or misleads about the origin of messages or communicates misinformation;
- Impersonates any religious organization, temple trust, guru, or scholar;
- Contains software viruses, malicious scripts, or automated scraping bots;
- Threatens the unity, integrity, defense, security, or sovereignty of India or public order.`,
      },
      {
        id: "aup-enforcement",
        title: "3. Moderation, Reporting & Suspension Protocols",
        order: 3,
        content: `ISHTI employs human moderation alongside automated safety classifiers to detect abusive or fraudulent behavior. Users may report violations via the platform reporting tool or directly to the Grievance Officer. Violations will result in warnings, temporary suspension, or permanent termination of platform access, along with reporting to lawful authorities where criminal conduct is suspected.`,
      },
    ],
  },
  {
    slug: "ai-usage",
    title: "Spiritual AI Guidance & Transparency Disclaimers",
    category: "safety",
    status: "LEGAL_REVIEW",
    version: "1.0.0-draft",
    effectiveDate: "Pending Formal Legal Review",
    lastReviewedDate: "2026-11-17",
    summary:
      "Ethical disclosures governing AI Pandit, automated astrological synthesis, canonical grounding, and non-substitutability for human Acharyas.",
    statutoryBasis: [
      "Advisory on Artificial Intelligence (MeitY India, 2024)",
      "EU Artificial Intelligence Act (Regulation (EU) 2024/1689)",
      "OECD AI Principles",
    ],
    dpoContactRequired: false,
    sections: [
      {
        id: "ai-transparency",
        title: "1. Clear Disclosure of Artificial Intelligence",
        order: 1,
        content: `ISHTI utilizes advanced artificial intelligence models (including Google Gemini and specialized retrieval engines) to power interactive features such as the AI Pandit, verse query assistant, and automated horoscope summaries. YOU ACKNOWLEDGE THAT INTERACTIVE RESPONSES ARE GENERATED BY AN ARTIFICIAL INTELLIGENCE SYSTEM AND DO NOT REPRESENT REAL-TIME COMMUNICATIONS FROM A LIVING HUMAN PANDIT OR ACHARYA. All AI features are explicitly badged with AI identity indicators.`,
      },
      {
        id: "ai-grounding",
        title: "2. Canonical Grounding & Epistemic Boundaries",
        order: 2,
        content: `Our AI assistants are strictly grounded in canonical Vedic literature, traditional commentary lineages, and verified astronomical ephemeris databases. Despite rigorous prompt engineering and safety filters, large language models may occasionally hallucinate or generate inaccurate scriptural cross-references. Devotees are encouraged to cross-reference AI-generated explanations with our verified Scripture Catalog and consult accredited human scholars for definitive doctrinal guidance.`,
      },
      {
        id: "ai-non-substitute",
        title: "3. Non-Substitutability & Sacred Deeksha",
        order: 3,
        content: `AI cannot confer spiritual initiation (Deeksha), officiate Vedic sacrifices (Yajnas), administer sacred vows (Sankalpa), or substitute for the living grace and wisdom of a genuine Guru. The AI Pandit is conceived strictly as an educational study aid and reference facilitator.`,
      },
      {
        id: "ai-crisis",
        title: "4. Crisis, Medical & Mental Health Boundaries",
        order: 4,
        content: `THE AI PANDIT IS NOT EQUIPPED OR AUTHORIZED TO PROVIDE CRISIS INTERVENTION, PSYCHOLOGICAL COUNSELING, OR MEDICAL DIAGNOSIS. If you or someone you know is experiencing acute emotional distress, depression, or thoughts of self-harm, please seek immediate assistance from qualified medical professionals or contact national crisis helplines (e.g. Tele-MANAS in India at 14416 / 1800-891-4416; or 988 in the United States).`,
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie, Storage & Telemetry Policy",
    category: "privacy",
    status: "LEGAL_REVIEW",
    version: "1.0.0-draft",
    effectiveDate: "Pending Formal Legal Review",
    lastReviewedDate: "2026-11-17",
    summary:
      "Clear explanation of local storage, essential session tokens, accessibility preferences, and privacy-preserving opt-in diagnostics.",
    statutoryBasis: [
      "ePrivacy Directive 2002/58/EC (amended 2009)",
      "GDPR Recital 30 & Article 5(3)",
      "DPDP Act 2023 Consent Provisions",
    ],
    dpoContactRequired: false,
    sections: [
      {
        id: "cookies-philosophy",
        title: "1. Zero Third-Party Advertising Trackers",
        order: 1,
        content: `ISHTI maintains an uncompromised commitment to devotee privacy. WE DO NOT DEPLOY THIRD-PARTY ADVERTISING COOKIES, CROSS-SITE TRACKING PIXELS (SUCH AS META PIXEL OR GOOGLE ADS TRACKERS), OR FINGERPRINTING SCRIPTS. We respect your sacred browsing journey as a private contemplation sanctuary.`,
      },
      {
        id: "cookies-categories",
        title: "2. Cookie Categories & Technologies Used",
        order: 2,
        content: `We use minimal first-party cookies and modern web browser storage:
1. Strictly Necessary Storage: Essential session tokens, CSRF security tokens, and authentication cookies necessary to deliver secure access to your profile and cart.
2. Functional & Universal Preferences: Local storage entries that remember your preferred language (e.g. Hindi, English, Sanskrit), high-contrast display settings, text scaling factors, and screen reader preferences.
3. Performance & Reader Diagnostics (Strictly Opt-In): Aggregated, zero-PII metrics measuring scripture page rendering speeds, astrological chart compilation latency, and error rates to maintain platform reliability.`,
      },
      {
        id: "cookies-control",
        title: "3. Granular User Controls",
        order: 3,
        content: `You may review, adjust, or revoke your cookie and telemetry preferences at any time via the Consent Center (/profile/consent) or configure your browser to reject cookies. Rejecting essential cookies may prevent certain authenticated features (such as booking management) from functioning.`,
      },
    ],
  },
  {
    slug: "security",
    title: "Security Architecture & Vulnerability Disclosure",
    category: "governance",
    status: "LEGAL_REVIEW",
    version: "1.0.0-draft",
    effectiveDate: "Pending Formal Legal Review",
    lastReviewedDate: "2026-11-17",
    summary:
      "Enterprise security principles, envelope encryption, PostgreSQL Row-Level Security, and Coordinated Vulnerability Disclosure (CVD) safe harbor.",
    statutoryBasis: [
      "ISO/IEC 27001:2022 Information Security Management",
      "CERT-In Cyber Security Directions (April 2022)",
      "NIST Cybersecurity Framework 2.0",
    ],
    dpoContactRequired: false,
    sections: [
      {
        id: "security-architecture",
        title: "1. Defense-in-Depth Engineering",
        order: 1,
        content: `ISHTI is engineered with multi-layered defense-in-depth principles:
- Transport Layer Security: Strict TLS 1.3 encryption across all public endpoints with HTTP Strict Transport Security (HSTS) headers.
- Astrological Data Envelope Encryption: Server-side AES-256-GCM envelope encryption for all birth coordinates, birth dates, and birth times with tenant-bound authentication tags (AAD).
- Database Isolation: PostgreSQL Row-Level Security (RLS) policies enforcing multi-tenant isolation at the database kernel level; non-recursive security definer functions for administrative operations.
- Cryptographic Rate-Limiting: Distributed sliding-window rate limiters utilizing 64-bit PostgreSQL advisory locks and salted HMAC-SHA-256 IP hashing to mitigate brute-force and scraping vectors without storing raw devotee IP addresses.`,
      },
      {
        id: "security-cvd",
        title: "2. Coordinated Vulnerability Disclosure & Safe Harbor",
        order: 2,
        content: `ISHTI welcomes constructive collaboration with independent security researchers. If you identify a potential security vulnerability in our platform, we encourage responsible disclosure under our Safe Harbor principles:
- Report findings to security@ishti.internal with reproduction steps, proof-of-concept payloads, and risk assessment.
- We commit to acknowledging vulnerability reports within 48 hours.
- We will not initiate legal action against researchers who act in good faith, avoid data exfiltration or service degradation, and provide reasonable time for remediation prior to public disclosure.`,
      },
    ],
  },
  {
    slug: "grievance",
    title: "Statutory Grievance Redressal Mechanism",
    category: "governance",
    status: "LEGAL_REVIEW",
    version: "1.0.0-draft",
    effectiveDate: "Pending Formal Legal Review",
    lastReviewedDate: "2026-11-17",
    summary:
      "Statutory grievance redressal framework under IT Rules 2021 (as amended Feb 2026: 24h acknowledgement, 7-day resolution) and DPDP Act 2023.",
    statutoryBasis: [
      "Information Technology Act, 2000 Section 79",
      "IT (Intermediary Guidelines) Rules, 2021 Rules 3(2) & 3A (amended Feb 2026)",
      "Digital Personal Data Protection Act, 2023 Section 13",
    ],
    dpoContactRequired: true,
    sections: [
      {
        id: "grievance-framework",
        title: "1. Statutory Mandate & Strict Response Timelines",
        order: 1,
        content: `In strict accordance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, as amended by the Central Government in February 2026:
- 24-Hour Acknowledgement: Every grievance filed by a user or victim is acknowledged within twenty-four (24) hours of receipt with a unique Tracking Ticket ID.
- 7-Day Resolution: All grievances are investigated and resolved within seven (7) days from the date of receipt.
- 36-Hour Unlawful Content Removal: Requests for removal or disabling of access to unlawful information falling under Rule 3(1)(d) pursuant to a court order or authorized government notification are executed within thirty-six (36) hours.`,
      },
      {
        id: "grievance-officer",
        title: "2. Designated Statutory Grievance Officer",
        order: 2,
        content: `Devotees and concerned parties may address their complaints to our Statutory Grievance Officer resident in India:
Designation: Grievance Officer & Data Protection Officer
Name: [LEGAL_REVIEW_REQUIRED: Statutory Grievance Officer Name]
Company: [LEGAL_REVIEW_REQUIRED: ISHTI Spiritual Technologies Private Limited]
Address: [LEGAL_REVIEW_REQUIRED: Registered Office Address, City, State, PIN, India]
Email: grievance@ishti.internal
Electronic Portal: /legal/grievance (Direct ticket creation form)`,
      },
      {
        id: "grievance-escalation",
        title: "3. Multi-Tier Escalation Matrix & Grievance Appellate Committee (GAC)",
        order: 3,
        content: `If you are dissatisfied with the resolution provided by our Grievance Officer:
- Level 1: Internal Review by the Chief Compliance Officer (response within 3 business days).
- Level 2 (Appellate): In accordance with Rule 3A of the IT Rules 2021, any person aggrieved by an order of the Grievance Officer may appeal to the Grievance Appellate Committee (GAC) established by the Central Government of India within thirty (30) days of receiving such communication. Appeals are submitted via the national electronic portal: gac.gov.in.`,
      },
    ],
  },
];
