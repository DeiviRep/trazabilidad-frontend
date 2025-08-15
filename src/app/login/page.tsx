'use client';

import { useAuth } from '@/context/AuthContext';
import { AuthAPI } from '@/services/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const { access_token, user } = await AuthAPI.login(correo, password);
      login(access_token, user);
      router.push('/trazabilidad');
    } catch (e:any) {
      setErr(e?.response?.data?.message || 'Error de autenticación');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Ingresar</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500">Correo</label>
          <input className="w-full rounded-lg border px-3 py-2" value={correo} onChange={e=>setCorreo(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Contraseña</label>
          <input className="w-full rounded-lg border px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {err && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{err}</div>}
        <button className="w-full rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800">Entrar</button>
      </form>
    </div>
  );
}
