import * as cheerio from 'cheerio';
import type { ArchiveItem } from '../types';
import { cleanText } from '../html';

const URL = 'https://www.gremistas.net/artigos/todos-fornecedores-material-esportivo-historia-gremio/';

export async function fetchSuppliers(): Promise<ArchiveItem[]> {
  const res = await fetch(URL, { headers: { 'user-agent': 'Mozilla/5.0 ArchivoDigitalGremio educational research' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Gremistas ${res.status}`);
  const $ = cheerio.load(await res.text());
  const items: ArchiveItem[] = [];
  $('table tr').each((i, tr) => {
    const cells = $(tr).find('td').map((_, td) => cleanText($(td).text())).get();
    if (cells.length < 2) return;
    const joined = cells.join(' | ');
    const years = joined.match(/(19|20)\d{2}/g)?.map(Number) || [];
    const name = cells.find(c => c && !/(19|20)\d{2}/.test(c) && !/^\d+$/.test(c));
    if (!name || !years.length) return;
    items.push({
      id: `supplier-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${years[0]}`,
      kind: 'supplier', yearStart: years[0], yearEnd: years[1] || years[0],
      title: name, subtitle: 'Fornecedor de material esportivo', manufacturer: name,
      sourceUrl: URL, published: true, metadata: { sourceRow: joined }
    });
  });
  return items;
}
