import React from 'react';
import { DIRTY_DOZEN_TEST_CASES } from '../../firestore.rules.test';

const SecurityAuditViewInner: React.FC = () => {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-12">
      {/* Header */}
      <div className="space-y-2 border-b border-[#8A8A8A]/25 pb-6">
        <div className="text-xs font-mono text-[#E62B1E]">
          ZERO-TRUST SECURITY &amp; COMPLIANCE ARCHITECTURE
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide text-[#FFFFFF]">
          SECURITY ARCHITECTURE, SWISS FADP / GDPR &amp; RED TEAM AUDIT
        </h1>
        <p className="text-sm text-[#8A8A8A] max-w-3xl">
          2paraglide.com enforces strict Attribute-Based Access Control (ABAC) in Firestore,
          3D Secure 2.0 + TWINT webhook signature verification, and PII split-collection isolation.
        </p>
      </div>

      {/* 3 Pillars of Security */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-3">
          <div className="text-xs font-mono text-[#E62B1E]">01. SWISS FADP (nDSG) &amp; EU GDPR</div>
          <h2 className="text-base font-bold text-[#FFFFFF]">
            Zero-PII Public Profiles &amp; Split Isolation
          </h2>
          <p className="text-xs text-[#8A8A8A] leading-relaxed">
            Public user and pilot documents in <code className="font-mono text-[#FFFFFF]">/users/&#123;uid&#125;</code> never
            store passenger email addresses or phone numbers. Cross-user profile scraping is blocked
            at the database engine level.
          </p>
        </div>

        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-3">
          <div className="text-xs font-mono text-[#E62B1E]">02. ESCROW &amp; PAYMENT INTEGRITY</div>
          <h2 className="text-base font-bold text-[#FFFFFF]">
            Rule-Enforced 3-Way Split Equation
          </h2>
          <p className="text-xs text-[#8A8A8A] leading-relaxed">
            Every booking creation verifies <code className="font-mono text-[#FFFFFF]">platformFeeCents + pilotPayoutCents + partnerCommissionCents == totalAmountCents</code> and
            locks terminal states (<code className="font-mono text-[#FFFFFF]">completed</code> / <code className="font-mono text-[#FFFFFF]">cancelled</code>) against tampering.
          </p>
        </div>

        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-3">
          <div className="text-xs font-mono text-[#E62B1E]">03. ANTI-ESCALATION &amp; RBAC</div>
          <h2 className="text-base font-bold text-[#FFFFFF]">
            Privilege Lock &amp; Email Verification
          </h2>
          <p className="text-xs text-[#8A8A8A] leading-relaxed">
            All write rules enforce <code className="font-mono text-[#FFFFFF]">request.auth.token.email_verified == true</code>,
            strict server timestamps (<code className="font-mono text-[#FFFFFF]">request.time</code>), and prevent self-assigned
            admin or verified SHV statuses.
          </p>
        </div>
      </div>

      {/* Dirty Dozen Red Team Matrix */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#FFFFFF]">
            The “Dirty Dozen” Red Team Penetration Test Suite
          </h2>
          <p className="text-xs text-[#8A8A8A]">
            All 12 adversarial payloads designed to break Identity, Integrity, and State are verified
            against deployed <code className="font-mono text-[#FFFFFF]">firestore.rules</code>.
          </p>
        </div>

        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#8A8A8A]/25 text-xs font-semibold text-[#8A8A8A] bg-[#111111]">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Adversarial Vector</th>
                <th className="py-3 px-4">Target Path</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Hardened Pillar</th>
                <th className="py-3 px-4 text-right">Rule Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8A8A8A]/20 text-xs">
              {DIRTY_DOZEN_TEST_CASES.map((tc) => (
                <tr key={tc.id} className="hover:bg-[#111111]/60">
                  <td className="py-3.5 px-4 font-mono tabular-nums text-[#E62B1E] font-bold">
                    {String(tc.id).padStart(2, '0')}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#FFFFFF]">{tc.name}</td>
                  <td className="py-3.5 px-4 font-mono text-[#8A8A8A]">{tc.collectionPath}</td>
                  <td className="py-3.5 px-4 font-mono text-[#FFFFFF]">
                    {tc.operation.toUpperCase()}
                  </td>
                  <td className="py-3.5 px-4 text-[#8A8A8A]">{tc.pillarVerified}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#E62B1E]">
                    {tc.expectedOutcome} (BLOCKED)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

// Performance: static view — memoize to avoid needless re-renders
export const SecurityAuditView = React.memo(SecurityAuditViewInner);
