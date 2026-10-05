import type { ArchiveItem, MediaAsset } from '../types';
import { cleanText } from '../html';

const API = 'https://commons.wikimedia.org/w/api.php';
const PAGE = 'Grêmio Foot-Ball Porto Alegrense kits';

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'ArquivoDigitalGremio/0.2 educational project' },
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error(`Commons ${res.status}`);
  return res.json();
}

/**
 * A API do MediaWiki pagina prop=images. Sem seguir imcontinue, uma página
 * grande pode retornar somente a primeira leva de arquivos. Aqui percorremos
 * TODAS as páginas da resposta antes de buscar os metadados das imagens.
 */
async function fetchAllFileTitles(): Promise<string[]> {
  const titles: string[] = [];
  let imcontinue: string | undefined;
  let continueToken: string | undefined;

  do {
    const listUrl = new URL(API);
    const params: Record<string, string> = {
      action: 'query',
      format: 'json',
      origin: '*',
      prop: 'images',
      imlimit: 'max',
      titles: PAGE
    };
    if (imcontinue) params.imcontinue = imcontinue;
    if (continueToken) params.continue = continueToken;
    listUrl.search = new URLSearchParams(params).toString();

    const list = await fetchJson(listUrl.toString());
    const page = Object.values(list?.query?.pages ?? {})[0] as any;
    for (const image of page?.images ?? []) {
      if (image?.title) titles.push(image.title);
    }

    imcontinue = list?.continue?.imcontinue;
    continueToken = list?.continue?.continue;
  } while (imcontinue);

  return Array.from(new Set(titles));
}

export async function fetchCommonsKits(limit?: number): Promise<ArchiveItem[]> {
  const allFileTitles = await fetchAllFileTitles();
  // A página de kits também pode referenciar braços, calções e meias usados
  // pelo template do Commons. Para a interface de CAMISETAS, priorizamos todos
  // os arquivos "Kit body ...". Se a coleção mudar de estrutura, usamos a
  // lista completa como fallback.
  const kitBodyTitles = allFileTitles.filter(title => /\bKit body\b/i.test(title));
  const candidateTitles = kitBodyTitles.length ? kitBodyTitles : allFileTitles;
  const fileTitles = Number.isFinite(limit) && (limit as number) > 0
    ? candidateTitles.slice(0, limit)
    : candidateTitles;

  if (!fileTitles.length) return [];

  // 40 por chamada mantém folga em relação ao limite de titles da API.
  const chunks: string[][] = [];
  for (let i = 0; i < fileTitles.length; i += 40) {
    chunks.push(fileTitles.slice(i, i + 40));
  }

  const out: ArchiveItem[] = [];

  for (const chunk of chunks) {
    const infoUrl = new URL(API);
    infoUrl.search = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1600',
      titles: chunk.join('|')
    }).toString();

    const info = await fetchJson(infoUrl.toString());

    for (const p of Object.values(info?.query?.pages ?? {}) as any[]) {
      const ii = p?.imageinfo?.[0];
      if (!ii?.url) continue;

      const md = ii.extmetadata ?? {};
      const label = p.title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '');
      const yearMatch = label.match(/(18|19|20)\d{2}/);
      if (!yearMatch) continue;

      const year = Number(yearMatch[0]);
      const isKitBody = /^Kit body\b/i.test(label);
      const displayTitle = isKitBody ? `Uniforme ${year}` : label;
      const sourceUrl = md.DescriptionUrl?.value ||
        `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`;

      const media: MediaAsset = {
        url: ii.thumburl || ii.url,
        thumbUrl: ii.thumburl || ii.url,
        alt: cleanText(md.ImageDescription?.value) || label,
        author: cleanText(md.Artist?.value) || null,
        license: cleanText(md.LicenseShortName?.value) || cleanText(md.UsageTerms?.value) || null,
        sourceUrl,
        rightsStatus: 'open'
      };

      out.push({
        id: `commons-${p.pageid}`,
        kind: 'kit',
        yearStart: year,
        title: displayTitle,
        subtitle: 'Wikimedia Commons',
        sourceUrl,
        description: cleanText(md.ImageDescription?.value) || null,
        published: true,
        media: [media],
        metadata: {
          commonsTitle: p.title,
          commonsLabel: label,
          isKitBody,
          license: media.license,
          sourceCollection: PAGE
        }
      });
    }
  }

  return out.sort((a, b) => a.yearStart - b.yearStart || a.title.localeCompare(b.title, 'pt-BR'));
}
