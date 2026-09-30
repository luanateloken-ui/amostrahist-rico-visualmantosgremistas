import type { ArchiveItem, MediaAsset } from '../types';
import { cleanText } from '../html';

const API='https://commons.wikimedia.org/w/api.php';
const CATEGORY='Category:Logos and symbols of Grêmio Foot-Ball Porto Alegrense';

async function json(url:string){const r=await fetch(url,{headers:{'user-agent':'ArquivoDigitalGremio/0.1 educational project'},next:{revalidate:3600}});if(!r.ok)throw new Error(`Commons symbols ${r.status}`);return r.json();}

export async function fetchCommonsSymbols():Promise<ArchiveItem[]>{
  const u=new URL(API);u.search=new URLSearchParams({action:'query',format:'json',origin:'*',list:'categorymembers',cmtitle:CATEGORY,cmtype:'file',cmlimit:'100'}).toString();
  const list=await json(u.toString());
  const titles:string[]=(list?.query?.categorymembers||[]).map((x:any)=>x.title);
  if(!titles.length)return[];
  const out:ArchiveItem[]=[];
  for(let i=0;i<titles.length;i+=40){
    const q=new URL(API);q.search=new URLSearchParams({action:'query',format:'json',origin:'*',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'1200',titles:titles.slice(i,i+40).join('|')}).toString();
    const data=await json(q.toString());
    for(const p of Object.values(data?.query?.pages||{}) as any[]){
      const ii=p?.imageinfo?.[0];if(!ii?.url)continue;
      const md=ii.extmetadata||{};
      const label=p.title.replace(/^File:/,'').replace(/\.[a-z0-9]+$/i,'');
      const date=cleanText(md.DateTimeOriginal?.value);
      const ym=(date||label).match(/(19|20)\d{2}/); const year=ym?Number(ym[0]):2000;
      const media:MediaAsset={
        url:ii.thumburl||ii.url,thumbUrl:ii.thumburl||ii.url,alt:cleanText(md.ImageDescription?.value)||label,
        author:cleanText(md.Artist?.value)||null,license:cleanText(md.LicenseShortName?.value)||cleanText(md.UsageTerms?.value)||null,
        sourceUrl:md.DescriptionUrl?.value||`https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g,'_'))}`,rightsStatus:'open'
      };
      out.push({id:`commons-symbol-${p.pageid}`,kind:'crest',yearStart:year,title:label,subtitle:'Símbolos / Wikimedia Commons',description:cleanText(md.ImageDescription?.value)||null,sourceUrl:media.sourceUrl,published:true,media:[media],metadata:{commonsTitle:p.title,license:media.license,trademarkNotice:true}});
    }
  }
  return out.sort((a,b)=>a.yearStart-b.yearStart);
}
