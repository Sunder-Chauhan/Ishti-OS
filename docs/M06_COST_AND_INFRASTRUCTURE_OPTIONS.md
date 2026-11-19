# ISHTI Milestone M06 — Infrastructure Options & Cost Projections (Revised)

**Document Reference:** `docs/M06_COST_AND_INFRASTRUCTURE_OPTIONS.md`  
**Milestone:** M06 — Core Backend Persistence, Distributed Invariants & Production Shielding  
**Repository:** `https://github.com/Sunder-Chauhan/Ishti-OS`  
**Revision Date:** 19 November 2026  
**Auditor Roles:** Principal Infrastructure Architect, Technical Operations Lead & SRE  

---

## 1. Executive Summary & Non-Commitment Principle (Correction 9)

Milestone M06 requires distributed state synchronization (for rate limiting, atomic concurrency locking, and session integrity) and reliable cloud persistence. 

This document models infrastructure requirements across three architecture options and three growth scenarios. 

> [!IMPORTANT]
> **GOVERNANCE & FINANCIAL DISCLAIMER:**
> All cost projections in this document are **indicative engineering estimates** based on publicly published vendor pricing as of **November 2026**.
> They do **NOT** constitute contractual commitments or financial obligations.
> **Zero paid cloud services, infrastructure subscriptions, or external commitments are being initiated during this planning phase.**

---

## 2. Infrastructure Architecture Options & Hosting Compatibility (Correction 7)

```mermaid
flowchart TD
    subgraph Option A [Option A: Serverless Edge Stack (Recommended Baseline)]
        CF1["Cloudflare Edge\n(WAF & CIDR Firewall)"] --> Vercel1["Vercel Pro\n(Next.js 15 App Router)"]
        Vercel1 --> Upstash["Upstash Redis Serverless\n(Atomic Sliding-Window EVAL)"]
        Vercel1 --> Supa1["Supabase Pro PostgreSQL 18\n(Primary Persistence & Auth)"]
        Vercel1 --> R2["Cloudflare R2 Storage\n(WORM Object Lock)"]
    end

    subgraph Option B [Option B: Containerized Hybrid Stack (Fly.io / AWS ECS)]
        CF2["Cloudflare Edge\n(Cloudflare Tunnel / mTLS AOP)"] --> Fly["Fly.io / AWS ECS Containers\n(Dockerized Next.js Monolith)"]
        Fly --> Valkey["Valkey / Redis Sidecar Container\n(Dedicated Memory Pool)"]
        Fly --> Supa2["Supabase Pro PostgreSQL 18"]
    end

    subgraph Option C [Option C: Supabase Native Only (Zero Redis)]
        CF3["Cloudflare Edge"] --> Vercel3["Vercel Pro"]
        Vercel3 --> Supa3["Supabase Pro PostgreSQL 18\n(pg_advisory_xact_lock & Unlogged Tables)"]
    end
```

### 2.1. Ingress Shielding Compatibility Analysis (Correction 7)
- **Vercel Pro Reality:** Standard Vercel Pro does **NOT natively support custom client-certificate authentication (Cloudflare Authenticated Origin Pulls / mTLS)** without Enterprise custom edge contracts.
- **Recommended Ingress Shielding for Vercel:**
  1. *Cloudflare Edge Rule:* Injects cryptographic 32-byte shared secret `x-ishti-proxy-secret` on all origin requests.
  2. *Next.js Middleware:* Validates secret header; drops direct unauthenticated HTTP requests with 403.
  3. *Vercel Firewall Rules:* Enforces allowlisting of Cloudflare's published IPv4 and IPv6 CIDR blocks.
  4. *AOP Status:* Marked as **`UNVERIFIED ON VERCEL`**; deferred unless infrastructure transitions to containerized ECS/Fly.io.

---

## 3. Public Vendor Pricing Baselines (Source Date: November 2026)

All projections are grounded in published vendor pricing rates as of November 2026 (Currency: USD $, Rupee equivalent at ₹88.00 / USD):

1. **Vercel Pro:**
   - *Base:* $20.00 / month per team member seat.
   - *Included:* 1 TB bandwidth, 1,000 edge middleware invocations, serverless compute allowance.
   - *Overage:* $40 per 100 GB additional bandwidth.
2. **Supabase Pro:**
   - *Base:* $25.00 / month per project.
   - *Included:* 8 GB disk storage, 250 GB bandwidth, 100,000 monthly active users (MAU), daily automated backups (7-day retention).
   - *Add-ons:* Point-in-time recovery (PITR 7-day) +$100/mo; Compute add-ons: Small (2 vCPU, 2 GB RAM) +$10/mo, Medium +$40/mo, 4XL +$400/mo.
3. **Upstash Redis Serverless:**
   - *Free Tier:* 10,000 commands / day ($0.00).
   - *Pay-As-You-Go:* $0.20 per 100,000 commands; $0.25 per GB data storage per month.
   - *Cap:* Optional hard budget caps preventing surprise billing.
4. **Cloudflare Edge & Storage:**
   - *Free Plan:* Basic DDoS, global CDN, Cloudflare Tunnel ($0.00).
   - *Pro Plan:* $20.00 / month (Web Application Firewall, managed rulesets).
   - *Cloudflare R2 (WORM Storage):* $0.015 / GB / month storage; Class A writes $4.50 / million; Class B reads $0.36 / million; zero egress fees.
5. **Transactional SMS & Email (MSG91 / Resend):**
   - *MSG91 (India DLT SMS):* ~₹0.18 ($0.002) per OTP SMS.
   - *Resend (Transactional Email):* Free tier 3,000 emails/mo; Pro $20.00/mo for 50,000 emails.

---

## 4. Workload Modeling Across Three Operating Scenarios (Correction 9)

### Scenario 1: Small Private Beta (<500 MAU)
- **Workload Profile:**
  * Expected MAU: 500 devotees
  * Peak Concurrent Users: 10–20 concurrent
  * Daily Ingress Requests: ~15,000 requests/day (~450,000 / month)
  * Distributed Cache Commands: ~300,000 commands/month
  * Database Storage: ~100 MB
  * Bandwidth: ~15 GB / month
  * SMS OTP Volume: ~800 verification SMS / month
- **Projected Cost Breakdown (Scenario 1):**

| Component | Selected Tier | Monthly USD | Monthly INR (₹88/$) | Assumptions & Notes |
| :--- | :--- | :---: | :---: | :--- |
| Application Hosting (Vercel) | Free / Hobby Tier | $0.00 | ₹0 | Beta testing within Hobby limits or 1 Pro Seat ($20). |
| Database & Auth (Supabase) | Free Tier | $0.00 | ₹0 | 500 MB DB storage, 50,000 MAU included in Free tier. |
| Distributed Rate Limiter (Upstash) | Free Tier | $0.00 | ₹0 | 10,000 commands/day limit covers ~10k ops/day workload. |
| Edge Ingress & WAF (Cloudflare) | Free Tier | $0.00 | ₹0 | Free global CDN, shared secret validation in middleware. |
| WORM Audit Storage (Cloudflare R2) | Free Tier | $0.00 | ₹0 | 10 GB free monthly R2 storage. |
| Transactional SMS (MSG91) | Pay-as-you-go | $2.00 | ₹176 | ~800 OTPs at ₹0.18/SMS. |
| **Total Scenario 1 (Beta)** | **Indicative Baseline** | **~$2.00 – $22.00** | **~₹176 – ₹1,936** | **Near-zero spend using managed free/starter tiers.** |

---

### Scenario 2: Initial Public Launch (5,000 – 25,000 MAU)
- **Workload Profile:**
  * Expected MAU: 15,000 active devotees
  * Peak Concurrent Users: 150–300 concurrent
  * Daily Ingress Requests: ~150,000 requests/day (~4.5M / month)
  * Distributed Cache Commands: ~3.5M commands/month
  * Database Storage: ~2.5 GB (profiles, consent, tickets, audit)
  * Bandwidth: ~60 GB / month
  * SMS OTP Volume: ~20,000 verification SMS / month
- **Projected Cost Breakdown (Scenario 2):**

| Component | Selected Tier | Monthly USD | Monthly INR (₹88/$) | Assumptions & Notes |
| :--- | :--- | :---: | :---: | :--- |
| Application Hosting (Vercel) | Pro Tier (1 Seat) | $20.00 | ₹1,760 | Production SLA, custom domain, edge middleware. |
| Database & Auth (Supabase) | Pro Tier + Compute (Small) | $35.00 | ₹3,080 | $25 base + $10 Small Compute (2 vCPU, 2 GB RAM). |
| Distributed Rate Limiter (Upstash) | Pay-as-you-go | $7.00 | ₹616 | 3.5M commands ($0.20 per 100k = $7.00). |
| Edge Ingress & WAF (Cloudflare) | Pro Plan | $20.00 | ₹1,760 | Managed WAF rulesets, DDoS mitigation, IP CIDR rules. |
| WORM Audit Storage (Cloudflare R2) | Pay-as-you-go | $3.00 | ₹264 | Daily Merkle snapshots + Object Lock. |
| Transactional SMS (MSG91) | Pay-as-you-go | $40.00 | ₹3,520 | ~20,000 OTPs at ₹0.18/SMS. |
| Transactional Email (Resend) | Pro Tier | $20.00 | ₹1,760 | Statutory 24h grievance receipts & notifications. |
| **Total Scenario 2 (Launch)** | **Indicative Baseline** | **~$145.00** | **~₹12,760** | **High-availability production tier with SLAs.** |

---

### Scenario 3: Growth & Scale (100,000+ MAU)
- **Workload Profile:**
  * Expected MAU: 100,000 active devotees
  * Peak Concurrent Users: 1,500–2,500 concurrent
  * Daily Ingress Requests: ~2M requests/day (~60M / month)
  * Distributed Cache Commands: ~45M commands/month
  * Database Storage: ~25 GB + Point-in-Time Recovery (PITR)
  * Bandwidth: ~500 GB / month
  * SMS OTP Volume: ~100,000 verification SMS / month
- **Projected Cost Breakdown (Scenario 3):**

| Component | Selected Tier | Monthly USD | Monthly INR (₹88/$) | Assumptions & Notes |
| :--- | :--- | :---: | :---: | :--- |
| Application Hosting (Vercel) | Pro Tier (2 Seats + Compute) | $60.00 | ₹5,280 | Additional bandwidth and serverless execution pools. |
| Database & Auth (Supabase) | Pro Tier + Medium Compute + PITR | $165.00 | ₹14,520 | $25 base + $40 Compute + $100 PITR (7-day rolling). |
| Distributed Rate Limiter (Upstash) | Dedicated Cluster / Enterprise | $90.00 | ₹7,920 | 45M commands + high-throughput multi-zone cluster. |
| Edge Ingress & WAF (Cloudflare) | Business Tier | $200.00 | ₹17,600 | Advanced Bot Management, rate limiting, PCI compliance. |
| WORM Audit Storage (Cloudflare R2) | Pay-as-you-go | $15.00 | ₹1,320 | Long-term encrypted compliance snapshot retention. |
| Transactional SMS (MSG91) | Pay-as-you-go | $200.00 | ₹17,600 | ~100,000 OTPs at bulk rates. |
| Transactional Email (Resend) | Pro Tier (100k pool) | $50.00 | ₹4,400 | Transactional notices, SAR downloads, grievance alerts. |
| **Total Scenario 3 (Scale)** | **Indicative Baseline** | **~$780.00** | **~₹68,640** | **Enterprise-grade scaling with point-in-time recovery.** |

---

## 5. Architectural Evaluation & Final Recommendation

| Evaluation Metric | Weight | Option A: Serverless Edge (Upstash + Supabase) | Option B: Containerized Hybrid (Fly.io + Valkey) | Option C: Supabase Native (PostgreSQL Only) |
| :--- | :---: | :---: | :---: | :---: |
| **Operational Overhead** | 30% | **9.5 / 10** (Zero patching, managed SLAs) | 5.0 / 10 (Container patching, OS monitoring) | 8.0 / 10 (Single DB, pool tuning required) |
| **Security & Ingress Shielding** | 25% | **9.0 / 10** (Cloudflare CIDR + Secret Header) | 9.5 / 10 (Cloudflare Tunnel zero-port) | 8.0 / 10 (Vercel Firewall) |
| **Latency Performance (p99)** | 20% | **9.0 / 10** (<5ms Redis sliding window) | 8.5 / 10 (<8ms over internal network) | 6.0 / 10 (15–30ms DB transaction overhead) |
| **Cost Predictability & Efficiency**| 15% | **9.0 / 10** (Near-zero in beta; pay per request) | 6.5 / 10 (Fixed container charges) | **9.5 / 10** (Zero extra SaaS components) |
| **Disaster Recovery & Reliability** | 10% | **9.0 / 10** (Cross-zone managed backups) | 6.0 / 10 (Requires manual snapshot config) | 8.5 / 10 (Supabase PITR backups) |
| **Weighted Total Score** | **100%** | **9.15 / 10 (RECOMMENDED)** | **7.00 / 10** | **7.90 / 10** |

### Architectural Recommendation
1. **Adopt Option A (Serverless Edge)** for Milestone M06 implementation and initial launch.
2. Maintain an **automated database-native fallback** using PostgreSQL transaction locks (`public.check_rate_limit()`) to guarantee that local developer environments and CI test pipelines execute cleanly without requiring external Upstash cloud credentials.
3. Defer container migration (Option B) until persistent WebSockets for live video consultations are required in Milestone M07.
