/**
 * Isolated layout for the Outstatic CMS dashboard.
 * Must be completely separate from the root app layout —
 * Outstatic's JavaScript attaches event listeners to #outstatic,
 * and its CSS scopes styles to that id. Any interference from
 * the root layout (global CSS, Analytics, ErrorBoundary, SiteFooter)
 * breaks the dashboard.
 */
export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body id="outstatic" suppressHydrationWarning>{children}</body>
    </html>
  );
}
