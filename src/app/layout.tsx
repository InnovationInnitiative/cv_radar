
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { UserProvider } from '../context/UserContext';
import { Footer } from '../components/Footer';
import { AdSocialBar } from '../components/ads/AdSocialBar';
import { AdPopunder } from '../components/ads/AdPopunder';
import { AdSidebar } from '../components/ads/AdSidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InsightCareers | The Transparency Engine',
  description: 'A stateless career auditor detecting red flags in job descriptions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <UserProvider>
          <div className="flex flex-col min-h-screen">
            <AdSocialBar />
            <AdPopunder />
            <div className="flex-grow">
              {children}
            </div>
            <Footer />
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
