import ArchiveExperience from '@/components/ArchiveExperience';
import { defaultDesign, demoItems } from '@/lib/demo';
import { getServerSupabase } from '@/lib/supabase';
import type { ArchiveItem } from '@/lib/types';

export const revalidate = 300;

async function getData() {
  const sb = getServerSupabase();
  if (!sb) return { items: demoItems, design: defaultDesign };

  const [itemsRes, designRes] = await Promise.all([
    sb.from('archive_items').select('*,media_assets(*)').eq('published', true).order('year_start'),
    sb.from('design_settings').select('settings').eq('id', 'global').maybeSingle()
  ]);

  if (itemsRes.error || !itemsRes.data?.length) {
    return { items: demoItems, design: designRes.data?.settings || defaultDesign };
  }

  const items: ArchiveItem[] = itemsRes.data.map((row:any) => ({
    id:row.id,
    kind:row.kind,
    yearStart:row.year_start,
    yearEnd:row.year_end,
    title:row.title,
    subtitle:row.subtitle,
    description:row.description,
    variant:row.variant,
    manufacturer:row.manufacturer,
    sponsor:row.sponsor,
    colors:row.colors || [],
    sourceUrl:row.source_url,
    published:row.published,
    metadata:row.metadata || {},
    media:(row.media_assets || []).map((m:any) => ({
      id:m.id,
      url:m.url,
      thumbUrl:m.thumb_url,
      alt:m.alt,
      author:m.author,
      license:m.license,
      sourceUrl:m.source_url,
      rightsStatus:m.rights_status
    }))
  }));

  return { items, design: designRes.data?.settings || defaultDesign };
}

export default async function Page() {
  const { items, design } = await getData();
  return <ArchiveExperience initialItems={items} design={design} />;
}
