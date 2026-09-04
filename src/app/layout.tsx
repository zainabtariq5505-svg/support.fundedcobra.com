import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Funded Cobra — Support Portal',
  description: 'Official customer support and ticket management platform for Funded Cobra.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
