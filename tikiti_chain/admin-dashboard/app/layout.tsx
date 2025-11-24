import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tikiti Chain Admin",
  description: "Admin dashboard for Tikiti Chain event management",
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
