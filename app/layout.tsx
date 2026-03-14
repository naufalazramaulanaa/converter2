import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Konversi Gambar ke PDF Online Gratis - JPG, PNG, WebP ke PDF',
  description: 'Ubah gambar ke PDF secara instan tanpa aplikasi. Gabungkan foto JPG dan PNG untuk syarat CPNS, lamaran kerja, dan sekolah. 100% aman tanpa simpan data.',
  keywords: 'gambar ke pdf, jpg ke pdf, png ke pdf, ubah foto ke pdf, konversi pdf online gratis, gabung gambar pdf cpns',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Img2PDF Converter",
              operatingSystem: "All",
              applicationCategory: "UtilitiesApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Konversi gambar JPG, PNG ke PDF secara gratis dan aman langsung di browser.",
            }),
          }}
        />
        {/* Ganti ca-pub-XXXX dengan ID AdSense asli kamu nanti */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>
        {children}
        <footer className="py-10 text-center text-sm text-gray-500 border-t">
          <p>© {new Date().getFullYear()} ImgToPDF - Tanpa Simpan Data</p>
          <div className="mt-2 space-x-4">
            <a href="/privacy" className="hover:underline">
              Privacy Policy
            </a>
            <a href="/" className="hover:underline">
              Home
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
