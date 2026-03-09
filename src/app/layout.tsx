import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SimplerSite",
  description: "AI-powered website generation for small businesses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
