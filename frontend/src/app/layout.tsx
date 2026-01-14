import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({ variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AI Web Full-Stack Blueprint',
  description:
    'A PRD-driven, AI-orchestrated blueprint for building scalable full-stack web applications',
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'AI Web Full-Stack Blueprint',
    description:
      'A PRD-driven, AI-orchestrated blueprint for building scalable full-stack web applications',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Web Full-Stack Blueprint',
    description:
      'A PRD-driven, AI-orchestrated blueprint for building scalable full-stack web applications',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <div className="min-h-screen bg-white">
          {children}
        </div>
      </body>
    </html>
  );
}
