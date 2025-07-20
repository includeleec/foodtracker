import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ConfirmationProvider } from "@/components/ui/confirmation-provider";
import { NetworkStatus } from "@/components/ui/network-status";
import { PWARegister } from "@/components/pwa-register";
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "每日食物记录",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "每日食物记录",
    title: "每日食物记录",
    description: "记录和管理您的日常饮食",
  },
  icons: {
    shortcut: "/green_salad.png",
    apple: [
      { url: "/green_salad.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="每日食物记录" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="icon" href="/green_salad.png" />
        <link rel="apple-touch-icon" href="/green_salad.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/green_salad.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/green_salad.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <ConfirmationProvider>
              <AuthProvider>
                <NetworkStatus />
                <PWARegister />
                {children}
              </AuthProvider>
            </ConfirmationProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
