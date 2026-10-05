'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Box, GitCompare, Link2, Search, Shirt, Sparkles, X } from 'lucide-react';
import type { ArchiveItem, ArchiveKind, DesignSettings, TimelineRecord } from '@/lib/types';
import { JerseyVisual } from './JerseyVisual';

const modes = [
  { key:'kit', label:'Uniformes', icon:Shirt },
  { key:'crest', label:'Marcas', icon:Sparkles },
  { key:'supplier', label:'Fornecedores', icon:Box },
  { key:'all', label:'Todos', icon:Link2 }
] as const;

type Mode = typeof modes[number]['key'];

function modeForKind(kind:ArchiveKind): Mode {
  if (kind === 'kit' || kind === 'crest' || kind === 'supplier') return kind;
  return 'all';
}

export default function ArchiveExperience({
  initialItems,
  timelineItems,
  design
}: {
  initialItems: ArchiveItem[];
  timelineItems: TimelineRecord[];
  design: DesignSettings;
}) {
  const [mode,setMode] = useState<Mode>('kit');
  const [index,setIndex] = useState(0);
  const [query,setQuery] = useState('');
  const [detail,setDetail] = useState(false);
  const [detailMediaIndex,setDetailMediaIndex] = useState(0);
  const [compare,setCompare] = useState<ArchiveItem | null>(null);
  const [timelineNotice,setTimelineNotice] = useState('');
  const reduce = useReducedMotion();

  const items = useMemo(() => {
    const q = query.toLowerCase().trim();
    return initialItems
      .filter(i => (mode === 'all' || i.kind === mode) && (!q || `${i.yearStart} ${i.title} ${i.subtitle||''} ${i.manufacturer||''} ${i.sponsor||''}`.toLowerCase().includes(q)))
      .sort((a,b)=>a.yearStart-b.yearStart || a.title.localeCompare(b.title, 'pt-BR'));
  }, [initialItems,mode,query]);

  const timelineGroups = useMemo(() => {
    const map = new Map<number, { year:number; total:number; published:number; review:number; titles:string[] }>();
    for (const item of timelineItems) {
      const current = map.get(item.yearStart) || { year:item.yearStart, total:0, published:0, review:0, titles:[] };
      current.total += 1;
      if (item.published) current.published += 1;
      else current.review += 1;
      current.titles.push(item.title);
      map.set(item.yearStart, current);
    }
    return [...map.values()].sort((a,b)=>a.year-b.year);
  }, [timelineItems]);

  const reviewCount = Math.max(0, timelineItems.length - initialItems.length);
  const safeIndex = items.length ? Math.min(index, items.length-1) : 0;
  const current = items[safeIndex];
  const prev = items.length ? items[(safeIndex - 1 + items.length) % items.length] : undefined;
  const next = items.length ? items[(safeIndex + 1) % items.length] : undefined;

  const go = (delta:number) => {
    if (!items.length) return;
    setIndex((safeIndex + delta + items.length) % items.length);
    setDetail(false);
    setDetailMediaIndex(0);
    setTimelineNotice('');
  };

  const openDetail = () => { setDetailMediaIndex(0); setDetail(true); };

  useEffect(() => {
    const active = document.querySelector<HTMLButtonElement>('.timeline-strip button.active');
    active?.scrollIntoView({ behavior:reduce ? 'auto' : 'smooth', block:'nearest', inline:'center' });
  }, [current?.id, reduce]);

  const jumpToYear = (year:number) => {
    const publicForYear = initialItems
      .filter(i => i.yearStart === year)
      .sort((a,b)=>a.title.localeCompare(b.title, 'pt-BR'));

    if (!publicForYear.length) {
      const group = timelineGroups.find(g => g.year === year);
      setTimelineNotice(`${year}: ${group?.total || 1} registro(s) existem no banco, mas ainda estão em curadoria. Publique o registro no Admin para exibi-lo no palco principal.`);
      return;
    }

    const preferred = publicForYear.find(i => mode === 'all' || i.kind === mode) || publicForYear[0];
    const targetMode = modeForKind(preferred.kind);
    const targetItems = initialItems
      .filter(i => targetMode === 'all' || i.kind === targetMode)
      .sort((a,b)=>a.yearStart-b.yearStart || a.title.localeCompare(b.title, 'pt-BR'));
    const targetIndex = targetItems.findIndex(i => i.id === preferred.id);

    setQuery('');
    setMode(targetMode);
    setIndex(Math.max(0, targetIndex));
    setCompare(null);
    setDetail(false);
    setDetailMediaIndex(0);
    setTimelineNotice('');
  };

  const vars = {
    '--bg':design.background,'--surface':design.surface,'--ink':design.ink,'--accent':design.accent,'--accent2':design.accent2,
    '--radius':`${design.radius}px`,'--display':design.displayFont,'--body':design.bodyFont
  } as React.CSSProperties;

  return <main className={`archive-app texture-${design.texture}`} style={vars}>
    <header className="topbar">
      <a className="wordmark" href="#top"><span>ARQUIVO</span><b>TRICOLOR</b><small>1903 → HOJE</small></a>
      <div className="searchbox"><Search size={17}/><input value={query} onChange={e=>{setQuery(e.target.value);setIndex(0)}} placeholder="ano, fornecedor, patrocínio, uniforme…" /></div>
      <a className="studio-link" href="/admin">CONTENT STUDIO ↗</a>
    </header>

    <aside className="mode-rail" aria-label="Filtros principais">
      {modes.map(m => <button key={m.key} className={mode===m.key?'active':''} onClick={()=>{setMode(m.key);setIndex(0);setTimelineNotice('')}} title={m.label}><m.icon size={19}/><span>{m.label}</span></button>)}
    </aside>

    <section className="hero" id="top">
      <div className="hero-kicker">
        <span className="hero-kicker-label">IDENTIDADE EM MOVIMENTO</span>
        <span>{initialItems.length} publicados · {timelineItems.length} no arquivo</span>
      </div>
      {!current ? <div className="empty">Nenhum registro publicado encontrado neste filtro.</div> : <>
        <AnimatePresence mode="wait">
          <motion.div key={current.id} className="year" initial={reduce?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-18}} transition={{duration:.28}}>{current.yearStart}</motion.div>
        </AnimatePresence>

        <div className="stage">
          {prev && items.length>1 && <button className="peek peek-left" onClick={()=>go(-1)} aria-label="Anterior"><JerseyVisual item={prev}/><span>{prev.yearStart}</span></button>}
          <button className="arrow arrow-left" onClick={()=>go(-1)} aria-label="Anterior"><ArrowLeft/></button>
          <AnimatePresence mode="wait">
            <motion.button key={current.id} className="focus-card" onClick={openDetail}
              initial={reduce?false:{opacity:0,scale:.94,rotateY:-8}} animate={{opacity:1,scale:1,rotateY:0}} exit={{opacity:0,scale:.96,rotateY:8}}
              transition={{type:'spring',stiffness:190,damping:24}} whileHover={reduce?{}:{y:-6,rotateX:1.5}}>
              <div className="focus-glow"/>
              <JerseyVisual item={current} large/>
              <div className="focus-meta"><span>{current.variant || current.kind.toUpperCase()}</span><strong>{current.title}</strong><small>{current.manufacturer || current.subtitle || 'Arquivo visual'}</small></div>
            </motion.button>
          </AnimatePresence>
          <button className="arrow arrow-right" onClick={()=>go(1)} aria-label="Próximo"><ArrowRight/></button>
          {next && items.length>1 && <button className="peek peek-right" onClick={()=>go(1)} aria-label="Próximo"><JerseyVisual item={next}/><span>{next.yearStart}</span></button>}
        </div>

        <div className="stage-actions">
          <button onClick={openDetail}>VEJA MAIS <ArrowRight size={15}/></button>
          <button className="ghost" onClick={()=>setCompare(compare?null:(next || null))}><GitCompare size={15}/> {compare?'SAIR DA COMPARAÇÃO':'RELACIONAR'}</button>
        </div>
      </>}

      <div className="timeline-summary" aria-label="Resumo da linha do tempo">
        <span><b>{timelineItems.length}</b> registros no Supabase</span>
        <span><b>{initialItems.length}</b> publicados</span>
        <span className={reviewCount ? 'is-review' : ''}><b>{reviewCount}</b> em curadoria</span>
      </div>

      <div className="timeline-strip" role="list" aria-label="Linha do tempo completa do arquivo">
        {timelineGroups.map(group => {
          const active = current?.yearStart === group.year;
          const className = [active?'active':'', group.review?'has-review':'', !group.published?'review-only':''].filter(Boolean).join(' ');
          const title = `${group.year}: ${group.total} registro(s), ${group.published} publicado(s), ${group.review} em curadoria. ${group.titles.slice(0,4).join(' · ')}`;
          return <button role="listitem" key={group.year} onClick={()=>jumpToYear(group.year)} className={className} title={title} aria-label={title}>
            <span>{group.year}</span>
            {group.total > 1 && <em>×{group.total}</em>}
            <i/>
          </button>;
        })}
      </div>
      {timelineNotice && <div className="timeline-notice">{timelineNotice}</div>}
    </section>

    {compare && current && <section className="compare-panel">
      <div className="compare-head"><span>COMPARAÇÃO VISUAL</span><button onClick={()=>setCompare(null)}><X/></button></div>
      <div className="compare-grid"><CompareCard item={current}/><div className="compare-rule"><span>VS</span></div><CompareCard item={compare}/></div>
      <div className="compare-pick"><span>Comparar com:</span>{items.filter(i=>i.id!==current.id).slice(0,12).map(i=><button key={i.id} onClick={()=>setCompare(i)} className={compare.id===i.id?'active':''}>{i.yearStart}</button>)}</div>
    </section>}

    <section className="relations-band">
      <div><small>ARQUIVO RELACIONAL</small><h2>Não é só uma linha do tempo.</h2><p>Cada uniforme pode se conectar a uma marca, fornecedor, patrocinador, competição, título, estádio ou acontecimento. O sistema transforma a história visual em uma rede navegável.</p></div>
      <div className="relation-viz" aria-hidden="true"><span className="node n1">1903</span><span className="node n2">AZUL</span><span className="node n3">KAPPA</span><span className="node n4">2001</span><span className="node n5">NB</span><svg viewBox="0 0 600 320"><path d="M90 160 C190 80 255 92 314 150 S430 238 520 154"/><path d="M140 230 C240 170 335 190 465 82"/><path d="M95 90 C230 120 350 60 515 210"/></svg></div>
    </section>

    <footer><span>Projeto acadêmico — arquivo digital da identidade visual</span><span>FONTES + CRÉDITOS + LICENÇAS SEMPRE VISÍVEIS</span></footer>

    <AnimatePresence>{detail && current && <motion.div className="detail-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setDetail(false)}>
      <motion.article initial={reduce?false:{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:28,stiffness:220}} onClick={e=>e.stopPropagation()}>
        <button className="close" onClick={()=>setDetail(false)}><X/></button>
        <div className="detail-year">{current.yearStart}</div><JerseyVisual item={current} large mediaIndex={detailMediaIndex}/>
        {current.media && current.media.length > 1 && <div className="detail-media-strip" aria-label="Outras imagens deste registro">
          {current.media.map((media,i)=><button key={`${media.url}-${i}`} className={i===detailMediaIndex?'active':''} onClick={()=>setDetailMediaIndex(i)} aria-label={`Ver imagem ${i+1}`}><img src={media.thumbUrl || media.url} alt={media.alt || `${current.title} — imagem ${i+1}`}/></button>)}
        </div>}
        <div className="detail-copy"><span>{current.kind} / {current.variant || 'arquivo'}</span><h1>{current.title}</h1><p>{current.description || 'Registro em processo de curadoria.'}</p>
          <dl><div><dt>Fornecedor</dt><dd>{current.manufacturer || 'Não informado'}</dd></div><div><dt>Patrocínio</dt><dd>{current.sponsor || 'Não informado'}</dd></div><div><dt>Período</dt><dd>{current.yearEnd && current.yearEnd!==current.yearStart ? `${current.yearStart}–${current.yearEnd}` : current.yearStart}</dd></div></dl>
          {current.media?.[detailMediaIndex]?.author && <p className="detail-credit">Crédito: {current.media[detailMediaIndex].author}{current.media[detailMediaIndex].license ? ` · ${current.media[detailMediaIndex].license}` : ''}</p>}
          {current.sourceUrl && <a href={current.sourceUrl} target="_blank" rel="noreferrer">ABRIR FONTE ORIGINAL ↗</a>}
        </div>
      </motion.article>
    </motion.div>}</AnimatePresence>
  </main>;
}

function CompareCard({item}:{item:ArchiveItem}) {
  return <div className="compare-card"><div className="compare-year">{item.yearStart}</div><JerseyVisual item={item} large/><h3>{item.title}</h3><p>{item.manufacturer || item.subtitle || 'Informação em curadoria'}</p></div>;
}
