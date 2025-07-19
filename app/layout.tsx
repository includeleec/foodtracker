import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ConfirmationProvider } from "@/components/ui/confirmation-provider";
import { NetworkStatus } from "@/components/ui/network-status";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "每日食物记录",
  description: "记录和管理您的日常饮食",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <ConfirmationProvider>
              <AuthProvider>
                <NetworkStatus />
                {children}
              </AuthProvider>
            </ConfirmationProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
