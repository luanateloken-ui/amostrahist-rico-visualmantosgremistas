import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLogin from '@/components/AdminLogin';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  if (session) redirect('/admin');
  return <AdminLogin />;
}
