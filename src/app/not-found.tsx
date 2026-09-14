import Link from 'next/link'
import MarkProof from '@/components/proof/MarkProof'
import RegMark from '@/components/proof/RegMark'

export const metadata = {
  title: '404 — Proof',
}

export default function NotFound() {
  return (
    <>
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-6px); opacity: 0.5; }
          50%       { transform: translateY(6px);  opacity: 1;   }
        }
        .reg-animated { animation: scan 3s ease-in-out infinite; }
      `}</style>

      <div
        style={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(16px, 5vw, 32px)',
          overflow: 'hidden',
          background: 'var(--c-paper)',
          color: 'var(--c-ink)',
          fontFamily: 'var(--f-display)',
        }}
      >
        <div style={{ position: 'relative', maxWidth: 680, width: '100%', textAlign: 'center' }}>
          {/* Crop marks */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
            <span
              key={pos}
              aria-hidden
              style={{
                position: 'absolute',
                width: 16,
                height: 16,
                ...(pos === 'tl' && {
                  top: -24,
                  left: -24,
                  borderTop: '2px solid var(--c-ink)',
                  borderLeft: '2px solid var(--c-ink)',
                }),
                ...(pos === 'tr' && {
                  top: -24,
                  right: -24,
                  borderTop: '2px solid var(--c-ink)',
                  borderRight: '2px solid var(--c-ink)',
                }),
                ...(pos === 'bl' && {
                  bottom: -24,
                  left: -24,
                  borderBottom: '2px solid var(--c-ink)',
                  borderLeft: '2px solid var(--c-ink)',
                }),
                ...(pos === 'br' && {
                  bottom: -24,
                  right: -24,
                  borderBottom: '2px solid var(--c-ink)',
                  borderRight: '2px solid var(--c-ink)',
                }),
              }}
            />
          ))}

          {/* Big 404 + REJECTED stamp */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span
              style={{
                fontFamily: 'var(--f-display)',
                fontWeight: 900,
                fontSize: 'clamp(120px, 20vw, 220px)',
                lineHeight: 0.85,
                letterSpacing: '-0.04em',
                color: 'var(--c-ink)',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              404
            </span>

            {/* Stamp */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-12deg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                border: '3px solid var(--c-accent)',
                boxShadow: 'inset 0 0 0 2px var(--c-accent)',
                color: 'var(--c-accent)',
                padding: '10px 22px',
                borderRadius: 5,
                pointerEvents: 'none',
                opacity: 0.88,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--f-display)',
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: '0.16em',
                  lineHeight: 1,
                }}
              >
                REJECTED
              </span>
              <span
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: 10,
                  letterSpacing: '0.2em',
                }}
              >
                REV 00
              </span>
            </div>
          </div>

          {/* Animated registration mark */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '28px 0 22px' }}>
            <div className="reg-animated">
              <RegMark size={28} color="var(--c-ink)" strokeWidth={1.6} />
            </div>
          </div>

          {/* Copy */}
          <div
            style={{
              fontFamily: 'var(--f-display)',
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--c-ink)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            This page didn&apos;t make the cut.
          </div>

          <p
            style={{
              fontFamily: 'var(--f-display)',
              fontSize: 15,
              color: 'var(--c-sub)',
              lineHeight: 1.5,
              maxWidth: 420,
              margin: '0 auto 32px',
            }}
          >
            The page you&apos;re looking for doesn&apos;t exist, was moved, or failed quality
            control. Let&apos;s get you back to something real.
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                fontFamily: 'var(--f-display)',
                fontWeight: 700,
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                padding: '14px 24px',
                borderRadius: 3,
                textDecoration: 'none',
                background: 'var(--c-accent)',
                color: '#fff',
              }}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <title>Up</title>
                <path d="M5 12l7-7 7 7" />
                <path d="M12 5v14" />
              </svg>
              Back to home
            </Link>
            <Link
              href="/editor"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                fontFamily: 'var(--f-display)',
                fontWeight: 700,
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                padding: '14px 24px',
                borderRadius: 3,
                textDecoration: 'none',
                background: 'transparent',
                color: 'var(--c-ink)',
                boxShadow: 'inset 0 0 0 1.5px var(--c-ink)',
              }}
            >
              Open the editor
            </Link>
          </div>

          {/* Meta */}
          <div
            style={{
              marginTop: 40,
              fontFamily: 'var(--f-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              color: 'var(--c-faint)',
              textTransform: 'uppercase',
            }}
          >
            Error 404 ·{' '}
            <a
              href="https://github.com/dperezarbues/proof/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--c-accent)', textDecoration: 'none' }}
            >
              Report an issue
            </a>
          </div>

          {/* Proof mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginTop: 36,
            }}
          >
            <MarkProof size={26} />
            <span
              style={{
                fontFamily: 'var(--f-display)',
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: '-0.02em',
                color: 'var(--c-ink)',
              }}
            >
              Proof
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
