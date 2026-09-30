import AdminStudio from '@/components/AdminStudio';
import { defaultDesign, demoItems } from '@/lib/demo';
import { getPublicSupabase } from '@/lib/supabase';
import type { ArchiveItem } from '@/lib/types';

export const dynamic='force-dynamic';

export default async function AdminPage(){
  const sb=getPublicSupabase();
  if(!sb) return <AdminStudio design={defaultDesign} items={demoItems}/>;
  const [itemsRes,designRes]=await Promise.all([
    sb.from('archive_items').select('*,media_assets(*)').order('year_start'),
    sb.from('design_settings').select('settings').eq('id','global').maybeSingle()
  ]);
  const items:ArchiveItem[]=(itemsRes.data||demoItems).map((r:any)=> r.year_start ? ({
    id:r.id,kind:r.kind,yearStart:r.year_start,yearEnd:r.year_end,title:r.title,subtitle:r.subtitle,description:r.description,variant:r.variant,
    manufacturer:r.manufacturer,sponsor:r.sponsor,colors:r.colors||[],sourceUrl:r.source_url,published:r.published,metadata:r.metadata||{},media:(r.media_assets||[]).map((m:any)=>({url:m.url,thumbUrl:m.thumb_url,alt:m.alt,author:m.author,license:m.license,sourceUrl:m.source_url,rightsStatus:m.rights_status}))
  }) : r);
  return <AdminStudio design={designRes.data?.settings||defaultDesign} items={items}/>;
}
