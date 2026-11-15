# Risk Register

## 1. Architectural & Domain Risks
| Risk ID | Risk Description | Severity | Mitigation Strategy | Status |
|---|---|:---:|---|:---:|
| **RSK-01** | Unverified religious content | High | Provenance, rights checks, scholar peer review gate, immutable audit logs | Active / Enforced |
| **RSK-02** | Copyright gaps | High | Per-item rights ledger, Griffith 1896 citations, backend RLS gating | Active / Enforced |
| **RSK-03** | Incorrect astrological calculations | Medium | Deterministic ephemeris engines and regional test vectors | Active / In Progress |
| **RSK-04** | Personal birth data (PII) exposure | Critical | AES-256-GCM context-bound envelope encryption, server-only boundary | Active / Enforced |
| **RSK-05** | AI cost overruns | Medium | Quotas, rate-limiting advisory locks, tiered model routing | Active / Enforced |
| **RSK-06** | Provider lock-in | Low | Clear service boundaries, portable PostgreSQL schemas | Active / In Progress |
| **RSK-07** | Staging Schema Drift & Privilege Leak | High | Automated Gate A 3-pass backup + Gate B atomic transactional reconciliation, exact 31-policy verification, function privilege hardening | **Mitigated / Reconciled (Gate B)** |

---

## 2. Security Credential Exposure Incidents
| Incident ID | Asset Affected | Exposure Vector | Classification | Mitigation & Gating Requirement | Current Status |
|---|---|---|:---:|---|:---:|
| **INC-01** | Razorpay Sandbox Test Key (`rzp_test_...`) | Historical Git commits (`52b834e`, `c4f6b4d`) | **RESOLVED** | Rotated in Razorpay merchant dashboard by operator. New key pair (`rzp_test_U0ZaQD3U8gxyqI`) provisioned in git-ignored local environments (`.env`, `apps/web/.env.local`). Gate C prerequisite satisfied. | **RESOLVED / KEY ROTATED** |
| **INC-02** | Staging Database Password (`zrjptpkhtklfgnovdrny`) | Uploaded development screenshot | **COMPROMISED** | Password marked compromised. Assumption of safety prohibited. Password rotation in Supabase dashboard required for complete assurance prior to Gate A. Credential scrubbing enforced across all scripts. | **COMPROMISED / ROTATION PENDING OPERATOR CONFIRMATION** |

---

## 3. Governance Policies for Credential Handling
1. **No Inferred Rotation:** Rotation of any compromised credential cannot be inferred from repository updates. Provider dashboard confirmation is mandatory.
2. **Zero Credential Exposure:** Secrets, tokens, and database passwords must never be printed, logged, committed, or requested via chat.
3. **Quarantine Enforcement:** Production project `zxwkfnvmmxoojewhvsdc` is permanently quarantined across all codebase validators.
