import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SiroMix V2',
  description: 'SiroMix V2 MVP Foundation - Exam Processing Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
