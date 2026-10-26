'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, X } from 'lucide-react';
import type { ArchiveItem } from '@/lib/types';
import { JerseyVisual } from './JerseyVisual';

const get = (item:ArchiveItem, key:string) => {
  const value = item.metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};
function Fact({label,value}:{label:string;value?:string|null}) {
  return <div className="catalog-fact"><dt>{label}</dt><dd>{value || 'Não documentado'}</dd></div>;
}
function Panel({title,children}:{title:string;children:React.ReactNode}) {
  return <section className="catalog-panel"><h2>{title}</h2>{children}</section>;
}
export function CatalogSheet({item,onClose}:{item:ArchiveItem;onClose:()=>void}) {
  const [mainImage,setMainImage] = useState(0);
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow='hidden';
    const handler=(event:KeyboardEvent)=>{if(event.key==='Escape') onClose();};
    window.addEventListener('keydown',handler);
    return ()=>{document.body.style.overflow=old;window.removeEventListener('keydown',handler);};
  },[onClose]);
  const media=item.media || [];
  const crest=get(item,'crestImageUrl');
  const period=item.yearEnd && item.yearEnd!==item.yearStart ? `${item.yearStart}–${item.yearEnd}` : String(item.yearStart);
  return <div className="catalog-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
    <article className="catalog-sheet" role="dialog" aria-modal="true" aria-label={`Ficha catalográfica: ${item.title}`}>
      <header className="catalog-top"><span>ARQUIVO HISTÓRICO-VISUAL <b> / FICHA CATALOGRÁFICA</b></span><button onClick={onClose} aria-label="Fechar ficha"><X size={21}/></button></header>
      <div className="catalog-content">
        <div className="catalog-heading"><div><span className="catalog-eyebrow">GRÊMIO FOOT-BALL PORTO ALEGRENSE · CAMISETA {item.variant || 'NÃO CLASSIFICADA'}</span><h1>{period}<small>{item.title}</small></h1><p>{item.subtitle || 'Registro visual e documental da identidade gremista.'}</p></div><span className="catalog-index">ACERVO / {item.id}</span></div>
        <div className="catalog-showcase">
          <div className="catalog-jersey"><span className="catalog-figure-label">IMAGEM {mainImage+1} / {Math.max(1,media.length)} · {media[mainImage]?.alt || 'Representação da camiseta'}</span><JerseyVisual item={item} large mediaIndex={mainImage}/><div className="catalog-image-controls"><button onClick={()=>setMainImage((mainImage-1+Math.max(1,media.length))%Math.max(1,media.length))} disabled={media.length<2} aria-label="Imagem anterior"><ArrowLeft size={16}/></button><button onClick={()=>setMainImage((mainImage+1)%Math.max(1,media.length))} disabled={media.length<2} aria-label="Próxima imagem"><ArrowRight size={16}/></button></div></div>
          <aside className="catalog-symbols"><span className="catalog-eyebrow">IDENTIDADE APLICADA</span><div className="catalog-crest">{crest ? <img src={crest} alt={`Escudo aplicado na camiseta ${period}`}/> : <div className="catalog-no-crest">Escudo não documentado em imagem</div>}<strong>ESCUDO</strong><p>{get(item,'crestVariation') || get(item,'crestNotes') || 'Versão não documentada'}</p></div><div className="catalog-colors"><strong>CORES REGISTRADAS</strong><div className="catalog-swatches">{item.colors?.length ? item.colors.map((color,i)=><div key={`${color}-${i}`}><span style={{background:color}}/><small>{color}</small></div>) : <p>Não documentadas</p>}</div><p>{get(item,'paletteNotes')}</p></div></aside>
        </div>
        {media.length>1 && <div className="catalog-thumbs">{media.map((asset,i)=><button key={`${asset.url}-${i}`} onClick={()=>setMainImage(i)} aria-pressed={mainImage===i} className={mainImage===i?'selected':''}><img src={asset.thumbUrl || asset.url} alt={asset.alt || `Imagem ${i+1}`}/><span>{i===0?'Principal':`Registro ${i+1}`}</span></button>)}</div>}
        <div className="catalog-main-grid"><Panel title="01 / Registro histórico"><dl className="catalog-facts"><Fact label="Temporada" value={get(item,'season')||period}/><Fact label="Tipo de camiseta" value={item.variant}/><Fact label="Fornecedora" value={item.manufacturer}/><Fact label="Patrocinador" value={item.sponsor}/><Fact label="Competição" value={get(item,'competition')}/><Fact label="Coleção / edição" value={get(item,'collection')}/><Fact label="Material" value={get(item,'material')}/></dl><p>{get(item,'historicalContext') || item.description || 'Contexto histórico em curadoria.'}</p></Panel><Panel title="02 / Elementos da identidade"><dl className="catalog-facts"><Fact label="Escudo" value={get(item,'crestVariation')}/><Fact label="Composição" value={get(item,'pattern')}/><Fact label="Listras" value={[get(item,'stripeDirection'),get(item,'stripeWidth')].filter(Boolean).join(' · ')}/><Fact label="Sequência cromática" value={get(item,'stripeSequence')}/><Fact label="Gola" value={get(item,'collar')}/><Fact label="Mangas" value={get(item,'sleeves')}/><Fact label="Numeração" value={get(item,'numbering')}/><Fact label="Tipografia" value={get(item,'typography')}/><Fact label="Posição do patrocínio" value={get(item,'sponsorPlacement')}/><Fact label="Marca da fornecedora" value={get(item,'supplierPlacement')}/></dl></Panel></div>
        <Panel title="03 / Detalhes visuais"><div className="catalog-details"><div><h3>PADRÃO E LISTRAS</h3><div className="catalog-stripes" style={{background:item.colors?.length?`repeating-linear-gradient(90deg, ${item.colors.map((c,i)=>`${c} ${i*100/item.colors!.length}% ${(i+1)*100/item.colors!.length}%`).join(', ')})`:'repeating-linear-gradient(90deg,#ddd 0 30px,#777 30px 60px)'}}/><p>{get(item,'pattern') || 'Composição não documentada'} · {get(item,'stripeSequence') || 'Sequência cromática não documentada'}</p></div><div><h3>GOLA E ACABAMENTOS</h3><div className="catalog-detail-icon">⌄</div><p>{get(item,'collar') || 'Modelo não documentado'} · {get(item,'sleeves') || 'Acabamentos não documentados'}</p></div><div><h3>NUMERAÇÃO E TIPOGRAFIA</h3><div className="catalog-detail-number">{get(item,'numbering')?'10':'?'}</div><p>{get(item,'numbering') || 'Numeração não documentada'} · {get(item,'typography') || 'Tipografia não documentada'}</p></div></div><p className="catalog-disclaimer">Diagramas esquemáticos gerados a partir dos campos cadastrados; não substituem fotografias ou documentação histórica.</p></Panel>
        <div className="catalog-main-grid"><Panel title="04 / Leitura histórico-visual"><p>{get(item,'visualNotes') || 'Análise visual em curadoria.'}</p><h3>IDENTIFICAÇÃO, PERMANÊNCIAS E RUPTURAS</h3><p>{get(item,'identityInterpretation') || 'Interpretação ainda não registrada.'}</p></Panel><Panel title="05 / Fontes e documentação"><p>{get(item,'historicalPhotoNotes') || 'Registros complementares disponíveis na galeria de imagens acima.'}</p><p>{get(item,'analysisSources') || 'Referências adicionais não documentadas.'}</p>{item.sourceUrl && <a className="catalog-source" href={item.sourceUrl} target="_blank" rel="noreferrer">CONSULTAR FONTE ORIGINAL <ExternalLink size={15}/></a>}{media.map((asset,i)=>asset.sourceUrl?<a key={i} className="catalog-source" href={asset.sourceUrl} target="_blank" rel="noreferrer">FONTE DA IMAGEM {i+1} <ExternalLink size={14}/></a>:null)}</Panel></div>
      </div>
      <footer className="catalog-bottom"><span>ACERVO VISUAL · DOCUMENTAÇÃO E CURADORIA</span><button onClick={onClose}>VOLTAR AO ACERVO <ArrowLeft size={15}/></button></footer>
    </article>
  </div>;
}
