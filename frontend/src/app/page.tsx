'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge, PrivacyBadge } from '@/components/ui/Badge';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { SortsLogoMark } from '@/components/brand/SortsLogoMark';
import { SortsLogoFull } from '@/components/brand/SortsLogoFull';
import { Icon } from '@/components/icons/Icon';
import { PLATFORM_PLANS } from '@/lib/constants';

export default function LandingPage() {
  return (
    <div className="page-shell">
      <MarketingHeader />
      <HeroSection />
      <TrustStrip />
      <ProblemSection />
      <PrivacyProtocol />
      <RoleSplit />
      <PrivacyArchitecture />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="hero-shell" id="hero">
      {/* Ambient glow — cyan/orange as per handoff */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 800px 400px at 50% 30%, rgba(45,232,224,0.08), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 880, width: '100%' }}>
        {/* Status pill */}
        <div
          id="hero-status-pill"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 14px', borderRadius: 999,
            background: 'var(--cyan-dim)', border: '1px solid var(--border-cyan)',
            fontSize: 12, fontWeight: 500, color: 'var(--cyan)',
            marginBottom: 28,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)' }} />
          v1.0 Live on Arbitrum Sepolia
        </div>

        {/* Headline */}
        <h1 className="hero-headline mb-5" id="hero-headline">
          Confidential communities,<br />
          built for the <span className="hero-grad-text">onchain era</span>.
        </h1>

        {/* Subheadline */}
        <p
          id="hero-subheadline"
          style={{ fontSize: 17, color: 'var(--text-2)', maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.65 }}
        >
          Memberships, tier access, and gated content secured by cryptographic infrastructure.
          No public subscriber list. No leaked membership graph. Privacy is the architecture.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
          <Link href="/studio/create" id="hero-cta-create">
            <Button variant="primary" size="xl">
              <Icon name="plus" size={16} /> Create a community
            </Button>
          </Link>
          <Link href="/role" id="hero-cta-join">
            <Button variant="secondary" size="xl">
              <Icon name="invite" size={16} /> Join a community
            </Button>
          </Link>
          <Link href="/role" id="hero-cta-demo">
            <Button variant="outline" size="xl">View protocol demo</Button>
          </Link>
        </div>

        {/* Trust row */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 12, color: 'var(--text-3)' }}>
          {[
            'ERC-7984 confidential tokens',
            'iExec NOX TEE',
            'Privy embedded wallets',
          ].map((label) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={14} color="var(--success)" /> {label}
            </span>
          ))}
        </div>
      </div>

      {/* Preview card */}
      <div style={{ position: 'relative', maxWidth: 780, width: '100%', marginTop: 60 }}>
        <CommunityPreviewCard />
      </div>
    </section>
  );
}

function CommunityPreviewCard() {
  return (
    <div className="preview-card" id="hero-preview-card">
      {/* Glow */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'radial-gradient(ellipse at 60% 30%, rgba(45,232,224,0.06), transparent 60%)', pointerEvents: 'none' }} />

      {/* Community header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--cyan-dim)', border: '1px solid var(--border-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--cyan)', flexShrink: 0 }}>
          α
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>Alpha Signals</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Arbitrum Sepolia · ERC-7984</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <PrivacyBadge />
        </div>
      </div>

      {/* Stats row */}
      <div className="g3" style={{ gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total members', value: '1,247', sub: 'aggregate only' },
          { label: 'Active ratio', value: '89%', sub: 'no individual data' },
          { label: 'Revenue (ETH)', value: '18.42', sub: 'total collected' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: 'rgba(12,19,26,0.8)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{value}</p>
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Privacy notice */}
      <div style={{ background: 'var(--cyan-dim)', border: '1px solid var(--border-cyan)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="shield" size={14} color="var(--cyan)" />
        <p style={{ fontSize: 12, color: 'var(--cyan)', lineHeight: 1.5 }}>
          Individual members are intentionally hidden. Access is verified without exposing subscriber identity.
        </p>
      </div>
    </div>
  );
}

/* ── Trust strip ─────────────────────────────────────────────────────────────── */
function TrustStrip() {
  const items = [
    { label: 'iExec NOX Protocol', icon: 'shield' as const },
    { label: 'ERC-7984 Confidential Tokens', icon: 'lock' as const },
    { label: 'Arbitrum Sepolia', icon: 'bolt' as const },
    { label: 'Commitment-based privacy', icon: 'eye_off' as const },
    { label: 'Telegram bot verification', icon: 'bot' as const },
  ];

  return (
    <div
      style={{
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(45,232,224,0.025)',
        padding: '14px 36px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '10px 32px', maxWidth: 1200, margin: '0 auto' }}>
        {items.map(({ label, icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 12 }}>
            <Icon name={icon} size={14} color="var(--text-3)" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Problem section ─────────────────────────────────────────────────────────── */
function ProblemSection() {
  const problems = [
    {
      t: 'Membership graphs are public',
      s: 'Anyone can scrape who joined what. Competitors map your member base in real-time.',
    },
    {
      t: 'Tier ownership is observable',
      s: 'Onchain platforms expose tier NFTs, leaking who paid premium prices.',
    },
    {
      t: 'Content access never expires',
      s: 'Pirated downloads have no enforcement; access lasts forever.',
    },
  ];

  return (
    <section className="lp-section" id="features">
      <div className="section-eyebrow">The problem</div>
      <h2 className="section-title">Community platforms leak the one thing that matters most.</h2>
      <p className="section-sub mb-8">
        Skool, Discord, Telegram — every platform exposes who's a member, what tier they pay for, and what private content they access.
        For alpha groups, research DAOs, and institutions, that's a critical leak.
      </p>
      <div className="g3 mt-6">
        {problems.map((x) => (
          <div key={x.t} className="card">
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon name="eye" size={18} color="var(--danger)" />
            </div>
            <div className="t-h3 mb-2">{x.t}</div>
            <div className="t-sm text-muted">{x.s}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Privacy protocol ────────────────────────────────────────────────────────── */
function PrivacyProtocol() {
  const features = [
    { ic: 'shield', t: 'Encrypted memberships', s: 'Membership tokens are confidential by default. No enumerate-members function exists.' },
    { ic: 'lock', t: 'Tier ownership hidden', s: 'Even the creator cannot see which subscriber paid for which tier.' },
    { ic: 'eye_off', t: 'No subscriber list', s: 'Aggregate counts only. The member graph is not stored anywhere queryable.' },
    { ic: 'bolt', t: 'Anti-piracy access', s: 'Content access tokens expire and re-verify on every fetch.' },
    { ic: 'book', t: 'Classrooms & courses', s: 'Multi-lesson modules with tier gating and completion tracking.' },
    { ic: 'bot', t: 'Telegram protocol bridge', s: 'Verify membership in Telegram without exposing identity.' },
  ] as const;

  return (
    <section className="lp-section" id="privacy">
      <div className="section-eyebrow">The protocol</div>
      <h2 className="section-title">Privacy is enforced at the protocol layer, not as a UI toggle.</h2>
      <p className="section-sub mb-8">
        SORTS combines confidential tokens, TEE-backed compute, and aggregate-only analytics so creator-blindness is mathematically guaranteed.
      </p>
      <div className="g3 mt-6">
        {features.map((x) => (
          <div key={x.t} className="card card-hover">
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--cyan-dim)', border: '1px solid var(--border-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon name={x.ic} size={18} color="var(--cyan)" />
            </div>
            <div className="t-h3 mb-2">{x.t}</div>
            <div className="t-sm text-muted">{x.s}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Role split ──────────────────────────────────────────────────────────────── */
function RoleSplit() {
  return (
    <section className="lp-section">
      <div className="section-eyebrow">Two products. One protocol.</div>
      <h2 className="section-title">Built for both sides of a community.</h2>
      <div className="g2 mt-6">
        {/* Creator */}
        <div className="card glow-orange" style={{ borderColor: 'var(--border-orange)', padding: 30 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--orange-dim)', borderRadius: 999, border: '1px solid var(--border-orange)', fontSize: 11, fontWeight: 600, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>
            <Icon name="crown" size={12} /> Creator Studio
          </div>
          <div className="t-h1 mb-3">Run a confidential community.</div>
          <p className="t-body text-muted mb-5">Deploy tiers, gate content, monetize members, and track aggregate performance — without ever seeing individual subscriber data.</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {['Multi-tier monetization', 'Classroom & calendar builder', 'Aggregate-only analytics', 'Telegram bot integration', 'On-chain deploy in one flow'].map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5 }}>
                <Icon name="check" size={16} color="var(--orange)" /> {s}
              </li>
            ))}
          </ul>
          <Link href="/studio">
            <button className="btn btn-primary" id="role-creator-btn">
              Open Creator Studio <Icon name="arrow_right" size={14} />
            </button>
          </Link>
        </div>

        {/* Subscriber */}
        <div className="card glow-cyan" style={{ borderColor: 'var(--border-cyan)', padding: 30 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--cyan-dim)', borderRadius: 999, border: '1px solid var(--border-cyan)', fontSize: 11, fontWeight: 600, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>
            <Icon name="user" size={12} /> Member App
          </div>
          <div className="t-h1 mb-3">Join without exposing yourself.</div>
          <p className="t-body text-muted mb-5">Subscribe, consume gated content, take courses, attend events, earn points — all under encrypted membership.</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {['Gated feed, library, classroom', 'RSVP private events', 'Pseudonymous leaderboard', 'Telegram access bridge', 'No public membership trace'].map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5 }}>
                <Icon name="check" size={16} color="var(--cyan)" /> {s}
              </li>
            ))}
          </ul>
          <Link href="/role">
            <button className="btn btn-cyan" id="role-subscriber-btn">
              Open Member App <Icon name="arrow_right" size={14} />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Privacy architecture ────────────────────────────────────────────────────── */
function PrivacyArchitecture() {
  return (
    <section className="lp-section" style={{ background: 'var(--bg-panel)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="section-eyebrow">Privacy architecture</div>
      <h2 className="section-title">Cryptographic guarantees, not platform promises.</h2>
      <div className="card mt-6" style={{ padding: 32 }}>
        <div className="g3" style={{ gap: 28 }}>
          {[
            { t: 'Phase 1 — Live', items: ['Arbitrum Sepolia', 'ERC-7984 tokens', 'iExec NOX TEE', 'Privy + Telegram'] },
            { t: 'Phase 2 — Adapter-ready', items: ['Solana Devnet', 'Umbra stealth', 'FHE encryption', 'IKA dWallet'] },
            { t: 'Architecture', items: ['Chain-agnostic adapters', 'TEE-backed compute', 'Aggregate-only state', 'Zero member enumeration'] },
          ].map((s, i) => (
            <div key={i}>
              <div className="t-label mb-3">{s.t}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.items.map((it, j) => (
                  <li key={j} className="t-mono" style={{ fontSize: 12.5, color: 'var(--text-2)' }}>— {it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────────────────── */
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is a Confidential Membership Token?',
      a: "It's an ERC-7984-compliant token where the balance (encoding tier level) is stored as a cryptographic commitment. On-chain observers see a bytes32 pointer — not whether you're Basic, Pro, or VIP.",
    },
    {
      q: 'Can the creator see who subscribed?',
      a: 'No. Creators see only aggregate stats: total members, total revenue, active vs expired ratio. Individual wallet addresses and tier levels are deliberately hidden.',
    },
    {
      q: 'What happens when my membership expires?',
      a: "Content access is cryptographically revoked. The content is not deleted — it's locked. Renewing restores access immediately without any admin action.",
    },
    {
      q: 'How does Telegram access work?',
      a: 'You sign a message (EIP-712) linking your Telegram ID to your wallet. The Telegram bot verifies your on-chain membership for every /content request. No cached membership status.',
    },
    {
      q: 'What is the protocol fee?',
      a: '5% of every subscription payment is collected at the smart contract level and forwarded to the SORTS treasury. Fully transparent and visible on-chain.',
    },
    {
      q: 'Is this production-ready?',
      a: 'SORTS is built for the iExec Vibe Coding Challenge 2026. Phase 1 runs on Arbitrum Sepolia (testnet). Production deployment on Arbitrum mainnet is Phase 2.',
    },
  ];

  return (
    <section className="lp-section" id="faq">
      <div className="section-inner-narrow">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="section-title">Frequently asked</h2>
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <button
                className="faq-q"
                onClick={() => setOpen(open === i ? null : i)}
                id={`faq-${i}`}
                aria-expanded={open === i}
              >
                <span>{faq.q}</span>
                <span style={{ color: 'var(--text-3)', flexShrink: 0, fontSize: 18, transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'block' }}>+</span>
              </button>
              {open === i && (
                <div className="faq-a">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ───────────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="lp-section" id="pricing" style={{ textAlign: 'center' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 32px', background: 'linear-gradient(145deg, rgba(45,232,224,0.06), rgba(255,138,0,0.04))', border: '1px solid var(--border-cyan)', borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(45,232,224,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <SortsLogoMark size={64} />
        </div>
        <h2 className="section-title" style={{ marginBottom: 16, textAlign: 'center' }}>
          Your community. Your members.<br />
          <span className="hero-grad-text">Nobody else's business.</span>
        </h2>
        <p className="t-body text-muted mb-6" style={{ fontSize: 15 }}>
          Free to deploy. 5% protocol fee on member payments. No platform lock-in.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/studio/create" id="cta-launch-btn">
            <button className="btn btn-xl btn-primary">Launch your community</button>
          </Link>
          <Link href="/role" id="cta-signin-btn">
            <button className="btn btn-xl btn-outline">Sign in</button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────────────── */
function LandingFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '32px 36px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <SortsLogoFull markSize={20} wordmarkSize={11} />
      </div>
      <p>© 2026 SORTS Protocol — Confidential community infrastructure · iExec Vibe Coding Challenge</p>
    </footer>
  );
}
