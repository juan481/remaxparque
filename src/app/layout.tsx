import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' });

export const metadata: Metadata = {
  title: 'Academia RE/MAX Parque',
  description: 'Hub digital para agentes RE/MAX Parque',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}