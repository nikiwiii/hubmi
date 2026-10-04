import type { Metadata } from "next";
import { Geist, Geist_Mono, Ubuntu } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MiNNO – Małopolskie Innowacje",
  description:
    "Minimalistyczna, profesjonalna przestrzeń do zgłaszania, opiniowania i testowania pomysłów.",
  icons: {
    icon: "/logo.svg",
  },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${ubuntu.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var isDark = localStorage.getItem('minno_dark_mode') === 'true';
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                var isHc = localStorage.getItem('minno_high_contrast') === 'true';
                if (isHc) {
                  document.documentElement.classList.add('high-contrast');
                } else {
                  document.documentElement.classList.remove('high-contrast');
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F4F4F0] text-stone-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
