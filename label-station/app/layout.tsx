import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UpKeep Label Station',
  description: 'Queue and print safe UpKeep public-request labels for Welch assets.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
