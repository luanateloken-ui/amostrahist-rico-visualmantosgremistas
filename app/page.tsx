import ArchiveExperience from '@/components/ArchiveExperience';
import { defaultDesign, demoItems } from '@/lib/demo';
import { getServerSupabase } from '@/lib/supabase';
import type { ArchiveItem, TimelineRecord } from '@/lib/types';

export const revalidate = 300;

function fromRow(row:any): ArchiveItem {
  return {
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
    media:[...(row.media_assets || [])]
      .sort((a:any,b:any)=>Number(a.position||0)-Number(b.position||0))
      .map((m:any) => ({
        id:m.id,
        url:m.url,
        thumbUrl:m.thumb_url,
        alt:m.alt,
        author:m.author,
        license:m.license,
        sourceUrl:m.source_url,
        rightsStatus:m.rights_status
      }))
  };
}

function timelineFromRow(row:any): TimelineRecord {
  return {
    id:row.id,
    kind:row.kind,
    yearStart:row.year_start,
    yearEnd:row.year_end,
    title:row.title,
    published:!!row.published
  };
}

function demoTimeline(): TimelineRecord[] {
  return demoItems.map(item => ({
    id:item.id,
    kind:item.kind,
    yearStart:item.yearStart,
    yearEnd:item.yearEnd,
    title:item.title,
    published:true
  }));
}

async function getData() {
  const sb = getServerSupabase();
  if (!sb) return { items:demoItems, timeline:demoTimeline(), design:defaultDesign };

  const [publicRes, timelineRes, designRes] = await Promise.all([
    // O palco recebe somente conteúdo aprovado/publicado.
    sb.from('archive_items').select('*,media_assets(*)').eq('published', true).order('year_start'),
    // A linha do tempo recebe TODOS os registros, inclusive os ainda em curadoria,
    // mas sem enviar suas imagens/detalhes privados ao navegador.
    sb.from('archive_items').select('id,kind,year_start,year_end,title,published').order('year_start'),
    sb.from('design_settings').select('settings').eq('id', 'global').maybeSingle()
  ]);

  const items: ArchiveItem[] = publicRes.error ? demoItems : (publicRes.data || []).map(fromRow);
  const timeline: TimelineRecord[] = timelineRes.error ? demoTimeline() : (timelineRes.data || []).map(timelineFromRow);

  return {
    items,
    timeline,
    design:designRes.data?.settings || defaultDesign
  };
}

export default async function Page() {
  const { items, timeline, design } = await getData();
  return <ArchiveExperience initialItems={items} timelineItems={timeline} design={design} />;
}
