import type { ArchiveItem, MediaAsset } from '../types';
import { cleanText } from '../html';

const API = 'https://commons.wikimedia.org/w/api.php';
const CATEGORY = 'Category:Logos and symbols of Grêmio Foot-Ball Porto Alegrense';

async function json(url:string) {
  const r = await fetch(url, {
    headers: { 'user-agent':'ArquivoDigitalGremio/0.2 educational project' },
    next: { revalidate:3600 }
  });
  if (!r.ok) throw new Error(`Commons symbols ${r.status}`);
  return r.json();
}

async function fetchAllCategoryTitles(): Promise<string[]> {
  const titles: string[] = [];
  let cmcontinue: string | undefined;
  let continueToken: string | undefined;

  do {
    const u = new URL(API);
    const params: Record<string,string> = {
      action:'query',
      format:'json',
      origin:'*',
      list:'categorymembers',
      cmtitle:CATEGORY,
      cmtype:'file',
      cmlimit:'max'
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;
    if (continueToken) params.continue = continueToken;
    u.search = new URLSearchParams(params).toString();

    const list = await json(u.toString());
    for (const member of list?.query?.categorymembers || []) {
      if (member?.title) titles.push(member.title);
    }
    cmcontinue = list?.continue?.cmcontinue;
    continueToken = list?.continue?.continue;
  } while (cmcontinue);

  return Array.from(new Set(titles));
}

export async function fetchCommonsSymbols():Promise<ArchiveItem[]> {
  const titles = await fetchAllCategoryTitles();
  if (!titles.length) return [];

  const out:ArchiveItem[] = [];

  for (let i = 0; i < titles.length; i += 40) {
    const q = new URL(API);
    q.search = new URLSearchParams({
      action:'query',
      format:'json',
      origin:'*',
      prop:'imageinfo',
      iiprop:'url|extmetadata',
      iiurlwidth:'1600',
      titles:titles.slice(i, i + 40).join('|')
    }).toString();

    const data = await json(q.toString());

    for (const p of Object.values(data?.query?.pages || {}) as any[]) {
      const ii = p?.imageinfo?.[0];
      if (!ii?.url) continue;

      const md = ii.extmetadata || {};
      const label = p.title.replace(/^File:/,'').replace(/\.[a-z0-9]+$/i,'');
      const date = cleanText(md.DateTimeOriginal?.value);
      const ym = (date || label).match(/(18|19|20)\d{2}/);
      const year = ym ? Number(ym[0]) : 2000;
      const sourceUrl = md.DescriptionUrl?.value ||
        `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g,'_'))}`;

      const media:MediaAsset = {
        url:ii.thumburl || ii.url,
        thumbUrl:ii.thumburl || ii.url,
        alt:cleanText(md.ImageDescription?.value) || label,
        author:cleanText(md.Artist?.value) || null,
        license:cleanText(md.LicenseShortName?.value) || cleanText(md.UsageTerms?.value) || null,
        sourceUrl,
        rightsStatus:'open'
      };

      out.push({
        id:`commons-symbol-${p.pageid}`,
        kind:'crest',
        yearStart:year,
        title:label,
        subtitle:'Símbolos / Wikimedia Commons',
        description:cleanText(md.ImageDescription?.value) || null,
        sourceUrl,
        published:true,
        media:[media],
        metadata:{
          commonsTitle:p.title,
          license:media.license,
          trademarkNotice:true
        }
      });
    }
  }

  return out.sort((a,b) => a.yearStart - b.yearStart || a.title.localeCompare(b.title, 'pt-BR'));
}
