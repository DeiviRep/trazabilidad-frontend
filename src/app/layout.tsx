import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header.client';

export const metadata: Metadata = {
  title: 'Trazabilidad',
  description: 'Frontend de trazabilidad de dispositivos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-gray-900">
        <AuthProvider>
          <div className="mx-auto max-w-7xl px-4 py-6">
            <Header />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
