import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
// import Header from '@/components/Header.client';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Sistema de Trazabilidad',
  description: 'Sistema de trazabilidad de productos importados',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-gray-900">
        <div className="flex h-screen bg-gray-50">
          <AuthProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Toaster
                position="top-right"
                richColors
                theme="light" // o "dark"
                expand={true}
                visibleToasts={3}
                // closeButton
                duration={5000}
              />
              {/* <Header /> */}
              <main className="flex-1 overflow-auto p-0">
                {children}
              </main>
            </div>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
