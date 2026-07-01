import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UpKeep SSO Upgrade Workspace",
  description: "Welch Packaging rollout workspace for UpKeep Entra ID SSO migration"
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
