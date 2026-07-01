import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — AskHoot',
  description: 'How AskHoot collects, uses, and protects your information — in plain English.',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F9F7F4', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E0DBD3', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.02em' }}>AskHoot</span>
          </Link>
          <Link
            href="/"
            style={{ padding: '8px 18px', background: '#2D6A4F', color: 'white', borderRadius: '20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
          >
            Make a decision →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '56px 24px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '40px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.12, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: 1.7, margin: 0 }}>
            Last updated June 2026. This page explains what AskHoot collects, how we use it,
            and what we don&apos;t do — in plain English.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* What we collect */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
            What we collect
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 6px' }}>Your email address</p>
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
              Used to create your account and send you a magic link to sign in. If you&apos;ve opted
              in to marketing emails, we also use it to send occasional product updates.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 6px' }}>Your decisions</p>
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
              The title, constraints, preferences, options, and scores you enter are saved to your
              account so you can revisit them later. This content is also sent to our AI provider
              (Anthropic) to generate your decision matrix. We may analyze anonymized, aggregate
              patterns across decisions — for example, how people collectively weigh criteria like
              safety versus cost in a given category — to improve the product. We do not use your
              individual decision content to train AI models.
            </p>
          </div>

          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 6px' }}>How you use the product</p>
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 10px' }}>
              We track behavioral data — which screens you visit, how many options you add, whether
              you complete a decision. These events capture counts and actions only. We do not send
              the text of your decisions, constraints, preferences, or option names to our behavioral
              analytics platform.
            </p>
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 10px' }}>
              We also use session replay to see how people navigate the product — where they click,
              scroll, or get stuck — so we can fix confusing parts of the flow. All text on the page
              is redacted before a replay is recorded, so a replay never shows the content of your
              decisions, constraints, preferences, or results, even though it shows layout and
              navigation.
            </p>
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 10px' }}>
              We may occasionally show a short, optional survey in the product — for example,
              asking what stopped you if you didn&apos;t finish a decision. Survey responses are
              free text you choose to write and submit; you can always skip them.
            </p>
            <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
              Separately, we monitor AI performance using PostHog&apos;s AI observability tools.
              This captures the prompts sent to Anthropic — which include your decision text,
              constraints, and preferences — along with response times and token usage, so we can
              diagnose errors and ensure quality. This data is used for product monitoring only,
              not for advertising or profiling.
            </p>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* Our partners */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Our technology partners
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 20px' }}>
            We work with a small number of trusted providers. Each one&apos;s own privacy policy
            governs how they handle data passed to their services.
          </p>

          {[
            { name: 'Supabase', role: 'Stores your account and decision data.' },
            { name: 'Anthropic', role: 'Processes your decision text to generate AI recommendations. Your content is subject to Anthropic\'s usage policies.' },
            { name: 'PostHog', role: 'Tracks behavioral analytics, redacted-text session replay, error monitoring, and optional in-product surveys — counts, actions, and layout only, not decision content unless you choose to share it in a survey response.' },
            { name: 'Resend', role: 'Sends transactional and marketing emails. Only receives your email address, and only fires marketing emails if you\'ve opted in.' },
            { name: 'Amazon', role: 'We participate in the Amazon Associates affiliate program. If you click an affiliate link, Amazon may set a cookie as part of their standard affiliate tracking. No personal data beyond the click is shared.' },
          ].map(({ name, role }) => (
            <div key={name} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flexShrink: 0, width: '90px', paddingTop: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#2D6A4F', background: '#E8F5EE', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                  {name}
                </span>
              </div>
              <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>{role}</p>
            </div>
          ))}
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* What we don't do */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            What we don&apos;t do
          </h2>
          {[
            'Sell your personal data to anyone.',
            'Use your decision content to train AI models.',
            'Share your individual decision data with advertisers or third parties.',
            'Use your decision content for behavioral analytics, advertising, or user profiling.',
            'Show affiliate links for financial products like mortgages, insurance, or credit cards without a disclosed partner relationship.',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <span style={{ color: '#2D6A4F', fontWeight: 700, fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>✕</span>
              <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>{item}</p>
            </div>
          ))}
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* Sensitive data */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Sensitive data
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 16px' }}>
            AskHoot is a general-purpose decision tool. It is not designed or approved for
            sensitive personal information, and users are responsible for what they choose to enter.
          </p>

          <div style={{ background: '#FFF8F0', border: '1px solid #F4A261', borderRadius: '10px', padding: '16px 20px' }}>
            <p style={{ fontSize: '13px', color: '#7A3B10', lineHeight: 1.65, margin: 0 }}>
              <strong>Please do not enter</strong> Protected Health Information (PHI), medical
              records, government ID numbers, financial account credentials, passwords, or other
              sensitive personal data into your decisions. AskHoot is not HIPAA-compliant and
              is not a substitute for professional medical, legal, or financial advice.
            </p>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* Email */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Email
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 14px' }}>
            We send two types of email. Transactional emails — like your magic link to sign in —
            are necessary to use the product and cannot be opted out of while you have an active account.
          </p>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            Marketing emails — product updates, tips, and re-engagement messages — are only sent
            if you opted in when you created your account. Every marketing email includes a
            one-click unsubscribe link. You can also request to be removed at any time by
            emailing us.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* Your data */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Your data, your control
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 14px' }}>
            Your decisions are retained in your account until you ask us to delete them.
            You can request a copy of your data, correction of inaccurate data, or deletion
            of your account and all associated decisions by emailing us directly. We&apos;ll
            respond within 30 days.
          </p>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            We don&apos;t currently offer a self-serve account deletion flow — that&apos;s on
            our roadmap. For now, just email us and we&apos;ll take care of it promptly.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* Changes */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Changes to this policy
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            If we make material changes to how we handle your data, we&apos;ll update the date
            at the top of this page and, where appropriate, notify you by email. Continued use
            of AskHoot after a policy change constitutes acceptance of the updated terms.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* Contact */}
        <section>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Questions
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 6px' }}>
            Questions or requests about your data:
          </p>
          <a
            href="mailto:isaac.chiles@hey.com"
            style={{ fontSize: '15px', color: '#2D6A4F', fontWeight: 600, textDecoration: 'none' }}
          >
            isaac.chiles@hey.com
          </a>
        </section>

      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #E0DBD3', background: 'white' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: '16px', fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.02em' }}>AskHoot</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
            <Link href="/about" style={{ fontSize: '13px', color: '#6B6B6B', textDecoration: 'none', fontWeight: 500 }}>About</Link>
            <Link href="/privacy" style={{ fontSize: '13px', color: '#2D6A4F', textDecoration: 'none', fontWeight: 600 }}>Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
