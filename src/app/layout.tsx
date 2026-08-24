import type { Metadata } from 'next';
import './globals.css';
import ClientWrapper from '@/components/ClientWrapper';

export const metadata: Metadata = {
  title: 'Commercial AI Think Tank Council',
  description: 'Enterprise operational layer to ingest, evaluate, and track compliant sales & marketing AI initiatives.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full bg-[#050B14] text-slate-100 antialiased font-sans">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
