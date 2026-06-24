import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — AskHoot',
  description: 'What AskHoot is, how affiliate links work, and how we handle your data.',
};

export default function AboutPage() {
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
        <div style={{ marginBottom: '56px' }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '40px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1.12, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            About AskHoot
          </h1>
          <p style={{ fontSize: '17px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
            AskHoot is an AI-powered weighted decision matrix that helps you make important choices with
            clarity and confidence. You describe what you&apos;re deciding, add your constraints and
            preferences, and AskHoot builds a structured framework to evaluate your options — scored
            against what matters most to you.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* How it works */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            How it works
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 14px' }}>
            When you start a decision, Claude — Anthropic&apos;s AI model — reads your description,
            constraints, and preferences, then generates weighted criteria (the things that actually
            matter for your specific decision) and a set of options to evaluate. You can adjust the
            weights, add your own options, and score each one across every criterion.
          </p>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            The result is a ranked recommendation grounded in your priorities — not a generic top-ten
            list, but an answer tailored to your situation. Completed decisions are saved to your
            account so you can revisit the reasoning later.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* Affiliate disclosure */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Affiliate disclosure
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 14px' }}>
            AskHoot participates in affiliate programs, including the Amazon Services LLC Associates
            Program. When your decision leads to a product recommendation, we may show a link to that
            product on Amazon or another retailer. If you click that link and make a purchase, we earn
            a small commission — at no additional cost to you.
          </p>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 14px' }}>
            Affiliate links are only shown when they&apos;re genuinely relevant to your decision (for
            example, a &quot;which laptop should I buy&quot; decision may surface an Amazon link to
            your top-ranked option). They are never shown for financial decisions like mortgages,
            insurance, or credit cards unless we have a vetted partner relationship with full
            disclosure.
          </p>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            Affiliate links are marked with &ldquo;sponsored&rdquo; in the link attributes and are
            disclosed inline wherever they appear.
          </p>

          {/* FTC-style callout box */}
          <div style={{ background: '#FFFBF0', border: '1px solid #E9C46A', borderRadius: '10px', padding: '16px 20px', marginTop: '20px' }}>
            <p style={{ fontSize: '13px', color: '#6B5B1A', lineHeight: 1.65, margin: 0 }}>
              <strong>Disclosure:</strong> AskHoot is a participant in the Amazon Services LLC
              Associates Program, an affiliate advertising program designed to provide a means for
              sites to earn advertising fees by advertising and linking to amazon.com. We may earn a
              commission when you purchase through links on this site.
            </p>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* Privacy */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Privacy
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 14px' }}>
            Decisions you save are stored in your account and are not shared or sold. We do not use
            your decision content to train AI models.
          </p>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 14px' }}>
            We collect behavioral analytics — which screens you visit, how many options you add,
            whether you complete a decision — to understand how to improve the product. We never send
            the text of your decisions, constraints, preferences, or option names to our analytics
            platform. Only aggregate counts and timing metadata are tracked.
          </p>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: 0 }}>
            We use Supabase for data storage, Anthropic&apos;s API for AI inference, and PostHog for
            product analytics. Each provider&apos;s privacy policy governs how they handle data
            passed to their services.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #E0DBD3', margin: '0 0 48px' }} />

        {/* Contact */}
        <section style={{ marginBottom: '0' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Contact
          </h2>
          <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, margin: '0 0 6px' }}>
            Questions, feedback, or press inquiries:
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
            <Link href="/about" style={{ fontSize: '13px', color: '#2D6A4F', textDecoration: 'none', fontWeight: 600 }}>About</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
