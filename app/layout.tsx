import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MedLens AI",
  description:
    "AI-powered patient history reconstruction and clinical decision support platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#F8FAFC] text-[#0F172A]">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 border-b border-[#0EA5E9]/20 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0EA5E9]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-[#0F172A]">
                MedLens <span className="text-[#0EA5E9]">AI</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/upload"
                className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0369A1]"
              >
                New Analysis
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}