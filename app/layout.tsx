import type { Metadata } from "next";
import { AuthGate } from "./auth-gate";
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
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
