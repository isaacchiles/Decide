import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const winner   = searchParams.get('winner')   ?? 'My Decision';
  const score    = searchParams.get('score')     ?? '0';
  const decision = searchParams.get('decision')  ?? '';
  const imgUrl   = searchParams.get('img')       ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(160deg, #1A3C2A 0%, #2D6A4F 55%, #3A8463 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Background photo (if provided) */}
        {imgUrl ? (
          <img
            src={imgUrl}
            width="1200"
            height="630"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.28,
            }}
          />
        ) : null}

        {/* Gradient overlay — always present for text readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(20,56,36,0.65) 50%, rgba(20,56,36,0.97) 100%)',
            display: 'flex',
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: 'absolute',
            top: '44px',
            left: '56px',
            right: '56px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* decide wordmark pill */}
          <div
            style={{
              background: 'white',
              borderRadius: '40px',
              padding: '10px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#2D6A4F',
                display: 'flex',
              }}
            />
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#2D6A4F', letterSpacing: '-0.02em' }}>
              decide
            </span>
          </div>

          {/* Score badge */}
          <div
            style={{
              background: '#E9C46A',
              borderRadius: '40px',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>pts</span>
          </div>
        </div>

        {/* Bottom content */}
        <div
          style={{
            position: 'absolute',
            bottom: '56px',
            left: '56px',
            right: '56px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {decision ? (
            <span
              style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '10px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {decision.length > 60 ? decision.slice(0, 57) + '…' : decision}
            </span>
          ) : null}

          <span
            style={{
              fontSize: '16px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            MY CHOICE
          </span>

          <span
            style={{
              fontSize: winner.length > 20 ? '64px' : '80px',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
            }}
          >
            {winner}
          </span>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '24px',
            }}
          >
            <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              decide.app
            </span>
            <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>
              Weighted decision-making
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
