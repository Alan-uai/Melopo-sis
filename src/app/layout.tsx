import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { Literata } from 'next/font/google';
import { cn } from '@/lib/utils';

const literata = Literata({
  subsets: ['latin'],
  variable: '--font-literata',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Melopoësis',
  description: 'Seu assistente de poesia para o português brasileiro.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark h-full">
      <body
        className={cn(
          'h-full font-body antialiased',
          literata.variable
        )}
      >
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
