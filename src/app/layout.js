import "./globals.css";

export const metadata = {
  title: "InstantSite — Launch a Website in Minutes",
  description:
    "Describe your business, upload a few images, and we generate a live website instantly. No code, no templates, no waiting.",
  openGraph: {
    title: "InstantSite — Launch a Website in Minutes",
    description:
      "AI-powered website generation. Describe your business and get a live site in minutes.",
    siteName: "InstantSite",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InstantSite — Launch a Website in Minutes",
    description:
      "AI-powered website generation. Describe your business and get a live site in minutes.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
