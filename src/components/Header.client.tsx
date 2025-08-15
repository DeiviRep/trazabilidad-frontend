'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { token, user, logout } = useAuth();
  const router = useRouter();

  const onLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <Link href="/trazabilidad" className="text-xl font-bold">Trazabilidad</Link>
      </div>

      <nav className="flex items-center gap-4 text-sm">
        <Link href="/trazabilidad" className="hover:underline">Panel</Link>
        <Link href="/trazabilidad" className="hover:underline">Historial</Link>
        {!token ? (
          <Link href="/login" className="hover:underline">Login</Link>
        ) : (
          <>
            <span className="text-gray-600">{user?.nombre || user?.email}</span>
            <button onClick={onLogout} className="rounded-md border px-3 py-1 text-sm">Salir</button>
          </>
        )}
      </nav>
    </header>
  );
}
