import * as cheerio from 'cheerio';
import type { ArchiveItem } from '../types';
import { cleanText } from '../html';

const URL = 'https://gremio1903.wordpress.com/2009/03/05/coluna-do-ramao-gremista-3/';

export async function fetchGremio1903(): Promise<ArchiveItem[]> {
  const res = await fetch(URL, { headers: { 'user-agent': 'Mozilla/5.0 ArchivoDigitalGremio educational research' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Grêmio 1903 ${res.status}`);
  const $ = cheerio.load(await res.text());
  const body = cleanText($('article, .entry-content, .post').first().text());
  const first = body.match(/1903.{0,1200}/i)?.[0] || body.slice(0, 1200);
  return [{
    id: 'historical-1903-first-kit', kind: 'kit', yearStart: 1903,
    title: 'Primeiro uniforme gremista', subtitle: 'Fonte histórica complementar',
    description: first.slice(0, 450), sourceUrl: URL, published: false,
    metadata: { license: 'CC BY-NC-ND 3.0 conforme página-fonte', ingestion: 'summary-only', rightsNote: 'Não copiar/adaptar texto ou imagem sem observar a licença.' }
  }];
}
