import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ContentDash - AI-Powered Content Management",
  description:
    "Manage your social media content, analytics, and engagement across platforms with AI-powered insights from OmniSocial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col lg:pl-64">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
