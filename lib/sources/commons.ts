import type { ArchiveItem, MediaAsset } from '../types';
import { cleanText } from '../html';

const API = 'https://commons.wikimedia.org/w/api.php';
const PAGE = 'Grêmio Foot-Ball Porto Alegrense kits';

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { 'user-agent': 'ArquivoDigitalGremio/0.1 educational project' }, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Commons ${res.status}`);
  return res.json();
}

export async function fetchCommonsKits(limit = 80): Promise<ArchiveItem[]> {
  const listUrl = new URL(API);
  listUrl.search = new URLSearchParams({ action: 'query', format: 'json', origin: '*', prop: 'images', imlimit: '500', titles: PAGE }).toString();
  const list = await fetchJson(listUrl.toString());
  const page = Object.values(list?.query?.pages ?? {})[0] as any;
  const fileTitles: string[] = (page?.images ?? []).map((x: any) => x.title).slice(0, limit);
  if (!fileTitles.length) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < fileTitles.length; i += 40) chunks.push(fileTitles.slice(i, i + 40));
  const out: ArchiveItem[] = [];

  for (const chunk of chunks) {
    const infoUrl = new URL(API);
    infoUrl.search = new URLSearchParams({
      action: 'query', format: 'json', origin: '*', prop: 'imageinfo',
      iiprop: 'url|extmetadata', iiurlwidth: '1200', titles: chunk.join('|')
    }).toString();
    const info = await fetchJson(infoUrl.toString());
    for (const p of Object.values(info?.query?.pages ?? {}) as any[]) {
      const ii = p?.imageinfo?.[0];
      if (!ii?.url) continue;
      const md = ii.extmetadata ?? {};
      const label = p.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '');
      const yearMatch = label.match(/(19|20)\d{2}|190[3-9]|191\d|192\d|193\d|194\d|195\d|196\d|197\d|198\d|199\d/);
      if (!yearMatch) continue;
      const year = Number(yearMatch[0]);
      const media: MediaAsset = {
        url: ii.thumburl || ii.url,
        thumbUrl: ii.thumburl || ii.url,
        alt: cleanText(md.ImageDescription?.value) || label,
        author: cleanText(md.Artist?.value) || null,
        license: cleanText(md.LicenseShortName?.value) || cleanText(md.UsageTerms?.value) || null,
        sourceUrl: md.DescriptionUrl?.value || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
        rightsStatus: 'open'
      };
      out.push({
        id: `commons-${p.pageid}`,
        kind: 'kit', yearStart: year, title: label,
        subtitle: 'Wikimedia Commons', sourceUrl: media.sourceUrl,
        description: cleanText(md.ImageDescription?.value) || null,
        published: true, media: [media],
        metadata: { commonsTitle: p.title, license: media.license }
      });
    }
  }
  return out.sort((a,b) => a.yearStart - b.yearStart);
}
