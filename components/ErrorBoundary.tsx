'use client';

import React from 'react';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] caught:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#F9F7F4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#FEE2E2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{
              fontFamily: "'Fraunces', serif", fontSize: '22px',
              fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px',
            }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '0 0 28px', lineHeight: 1.65 }}>
              An unexpected error occurred. Your progress may not be saved.
            </p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.href = '/';
              }}
              style={{
                padding: '13px 32px', background: '#2D6A4F', color: 'white',
                border: 'none', borderRadius: '24px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '15px',
                fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(45,106,79,0.25)',
              }}
            >
              Start over
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
