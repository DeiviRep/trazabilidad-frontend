'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useHasRole } from '@/context/AuthContext';
import type { Rol } from '@/lib/roleConfig';

interface RoleGuardProps {
  allowedRoles: Rol[];
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RoleGuard({
  allowedRoles,
  children,
  redirectTo = '/dashboard',
}: RoleGuardProps) {
  const hasAccess = useHasRole(...allowedRoles);
  const router = useRouter();

  useEffect(() => {
    if (!hasAccess) router.replace(redirectTo);
  }, [hasAccess, redirectTo, router]);

  if (!hasAccess) return null;

  return <>{children}</>;
}