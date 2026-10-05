import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminStudio from '@/components/AdminStudio';
import { defaultDesign, demoItems } from '@/lib/demo';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase';
import type { ArchiveItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) redirect('/admin/login');
  const username = session?.username || 'admin';

  const sb = getServerSupabase();
  if (!sb) {
    return <AdminStudio design={defaultDesign} items={demoItems} databaseConfigured={false} username={username} />;
  }

  const [itemsRes, designRes] = await Promise.all([
    sb.from('archive_items').select('*,media_assets(*)').order('year_start'),
    sb.from('design_settings').select('settings').eq('id', 'global').maybeSingle()
  ]);

  const rows = itemsRes.data || [];
  const items: ArchiveItem[] = (rows.length ? rows : demoItems).map((r: any) => r.year_start ? ({
    id: r.id,
    kind: r.kind,
    yearStart: r.year_start,
    yearEnd: r.year_end,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    variant: r.variant,
    manufacturer: r.manufacturer,
    sponsor: r.sponsor,
    colors: r.colors || [],
    sourceUrl: r.source_url,
    published: r.published,
    metadata: r.metadata || {},
    media: [...(r.media_assets || [])].sort((a:any,b:any)=>Number(a.position||0)-Number(b.position||0)).map((m: any) => ({
      id: m.id,
      url: m.url,
      thumbUrl: m.thumb_url,
      alt: m.alt,
      author: m.author,
      license: m.license,
      sourceUrl: m.source_url,
      rightsStatus: m.rights_status
    }))
  }) : r);

  return (
    <AdminStudio
      design={designRes.data?.settings || defaultDesign}
      items={items}
      databaseConfigured
      username={username}
    />
  );
}
