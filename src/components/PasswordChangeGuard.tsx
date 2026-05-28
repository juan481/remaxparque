'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PasswordChangeGuard({ passwordChanged }: { passwordChanged: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!passwordChanged && !pathname.startsWith('/change-password')) {
      router.replace('/change-password');
    }
  }, [passwordChanged, pathname, router]);

  return null;
}
