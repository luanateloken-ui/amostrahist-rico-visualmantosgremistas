'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { Copy, ExternalLink, ImagePlus, Link2, Plus, Save, Star, Trash2, Upload } from 'lucide-react';
import type { ArchiveItem, DesignSettings, MediaAsset, MockupSettings, RightsStatus, VisualMode } from '@/lib/types';
import { JerseyVisual } from './JerseyVisual';

const blankItem = (): ArchiveItem => ({
  id:`camiseta-${Date.now()}`,
  kind:'kit',
  yearStart:new Date().getFullYear(),
  yearEnd:new Date().getFullYear(),
  title:'Nova camiseta',
  colors:['#54c8f5','#111216','#ffffff'],
  published:false,
  metadata:{
    visualMode:'image',
    mockup:{ scale:100, x:50, y:50, rotation:0, baseColor:'#11151a' }
  },
  media:[]
});

function missingFields(item: ArchiveItem): string[] {
  const missing:string[] = [];
  if (!item.subtitle) missing.push('subtítulo');
  if (!item.description) missing.push('descrição');
  if (!item.sourceUrl) missing.push('fonte');
  if (item.kind === 'kit' && !item.variant) missing.push('tipo/variante');
  if (item.kind === 'kit' && !item.manufacturer) missing.push('fornecedora');
  if ((item.kind === 'kit' || item.kind === 'crest') && !(item.media?.length)) missing.push('imagem');
  return missing;
}

function getMockup(item: ArchiveItem): Required<MockupSettings> {
  const m = item.metadata?.mockup || {};
  return {
    scale:Number(m.scale ?? 100),
    x:Number(m.x ?? 50),
    y:Number(m.y ?? 50),
    rotation:Number(m.rotation ?? 0),
    baseColor:String(m.baseColor || '#11151a')
  };
}

function metaText(item:ArchiveItem, key:string) {
  const value = item.metadata?.[key];
  return typeof value === 'string' ? value : '';
}

export default function AdminStudio({
  design,
  items,
  databaseConfigured,
  databaseError,
  username
}: {
  design: DesignSettings;
  items: ArchiveItem[];
  databaseConfigured: boolean;
  databaseError: string | null;
  username: string;
}) {
  const [status, setStatus] = useState('');
  const [theme, setTheme] = useState(design);
  const [records, setRecords] = useState<ArchiveItem[]>(items);
  const [draft, setDraft] = useState<ArchiveItem>(items[0] || blankItem());
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const recordOptions = useMemo(() => [...records].sort((a,b) => a.yearStart-b.yearStart || a.title.localeCompare(b.title)), [records]);
  const visualMode = (draft.metadata?.visualMode || 'image') as VisualMode;
  const mockup = getMockup(draft);
  const stats = useMemo(() => ({
    total:records.length,
    published:records.filter(i => i.published).length,
    review:records.filter(i => !i.published).length,
    incomplete:records.filter(i => missingFields(i).length > 0).length
  }), [records]);
  const draftMissing = missingFields(draft);
  const isExisting = records.some(i => i.id === draft.id);

  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(path, { ...init, cache:'no-store' });
    if (response.status === 401) {
      window.location.href = '/admin/login';
      throw new Error('Sessão expirada.');
    }
    return response;
  }

  async function saveTheme() {
    setStatus('Salvando aparência e conteúdo da página…');
    try {
      const r = await request('/api/design', {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body:JSON.stringify(theme)
      });
      const j = await r.json();
      setStatus(r.ok ? 'Página salva. O frontend já pode ser recarregado com as novas configurações.' : `Erro: ${j.error}`);
    } catch (e) {
      setStatus(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function saveItem() {
    setStatus('Salvando registro, imagens e configuração visual…');
    try {
      const r = await request('/api/archive', {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body:JSON.stringify(draft)
      });
      const j = await r.json();
      if (!r.ok) {
        setStatus(`Erro: ${j.error}`);
        return;
      }
      const saved = (j.item || draft) as ArchiveItem;
      setDraft(saved);
      setRecords(prev => {
        const exists = prev.some(i => i.id === saved.id);
        return exists ? prev.map(i => i.id === saved.id ? saved : i) : [...prev, saved];
      });
      setStatus(saved.published
        ? 'Registro salvo e publicado. Recarregue o frontend para conferir.'
        : 'Registro salvo em curadoria. Marque “Publicado = Sim” quando quiser exibi-lo no frontend.'
      );
    } catch (e) {
      setStatus(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function deleteItem() {
    if (!isExisting) return;
    if (!window.confirm(`Excluir definitivamente “${draft.title}”?`)) return;
    setStatus('Excluindo registro…');
    const r = await request(`/api/archive?id=${encodeURIComponent(draft.id)}`, { method:'DELETE' });
    const j = await r.json();
    if (!r.ok) {
      setStatus(`Erro: ${j.error}`);
      return;
    }
    const nextRecords = records.filter(i => i.id !== draft.id);
    setRecords(nextRecords);
    setDraft(nextRecords[0] || blankItem());
    setStatus('Registro excluído.');
  }

  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' });
    window.location.href = '/admin/login';
  }

  function loadRecord(id:string) {
    const found = records.find(i => i.id === id);
    if (found) {
      setDraft(structuredClone(found));
      setStatus('');
    }
  }

  function createRecord() {
    setDraft(blankItem());
    setStatus('Novo registro manual iniciado.');
  }

  function duplicateRecord() {
    const clone = structuredClone(draft);
    clone.id = `camiseta-${Date.now()}`;
    clone.title = `${clone.title} — cópia`;
    clone.published = false;
    setDraft(clone);
    setStatus('Cópia criada como novo rascunho. Ajuste os dados e salve.');
  }

  const update = (k:keyof ArchiveItem, v:any) => setDraft(d => ({ ...d, [k]:v }));

  function updateMetadata(patch:Record<string,unknown>) {
    setDraft(d => ({ ...d, metadata:{ ...(d.metadata || {}), ...patch } }));
  }

  function updateMockup(patch:Partial<MockupSettings>) {
    setDraft(d => ({
      ...d,
      metadata:{
        ...(d.metadata || {}),
        mockup:{ ...(d.metadata?.mockup || {}), ...patch }
      }
    }));
  }

  function addColor() {
    setDraft(d => ({ ...d, colors:[...(d.colors || []), '#ffffff'] }));
  }

  function updateColor(index:number, value:string) {
    setDraft(d => ({ ...d, colors:(d.colors || []).map((c,i)=>i===index ? value : c) }));
  }

  function removeColor(index:number) {
    setDraft(d => ({ ...d, colors:(d.colors || []).filter((_,i)=>i!==index) }));
  }

  function addMedia(asset:MediaAsset) {
    setDraft(d => ({ ...d, media:[...(d.media || []), asset] }));
  }

  function addUrl() {
    const url = imageUrl.trim();
    if (!url) return;
    try { new URL(url); } catch { setStatus('Informe uma URL de imagem válida.'); return; }
    addMedia({ url, thumbUrl:url, alt:draft.title, rightsStatus:'unknown', sourceUrl:url });
    setImageUrl('');
    setStatus('Imagem por link adicionada. Salve o registro para gravar a alteração.');
  }

  function updateMedia(index:number, patch:Partial<MediaAsset>) {
    setDraft(d => ({
      ...d,
      media:(d.media || []).map((m,i) => i === index ? { ...m, ...patch } : m)
    }));
  }

  function removeMedia(index:number) {
    setDraft(d => ({ ...d, media:(d.media || []).filter((_,i) => i !== index) }));
  }

  function makePrimary(index:number) {
    setDraft(d => {
      const media = [...(d.media || [])];
      const [picked] = media.splice(index,1);
      if (picked) media.unshift(picked);
      return { ...d, media };
    });
  }

  async function uploadOne(file:File) {
    if (!file.type.startsWith('image/')) throw new Error(`${file.name}: selecione um arquivo de imagem.`);
    const form = new FormData();
    form.append('file', file);
    form.append('itemId', draft.id);

    const uploaded = await request('/api/media/upload', { method:'POST', body:form });
    const j = await uploaded.json();
    if (!uploaded.ok) throw new Error(j.error || `Falha no upload de ${file.name}.`);

    addMedia({
      url:j.publicUrl,
      thumbUrl:j.publicUrl,
      alt:file.name.replace(/\.[^.]+$/, ''),
      rightsStatus:'unknown'
    });
  }

  async function handleFiles(event:ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []) as File[];
    if (!files.length) return;
    setUploading(true);
    setStatus(`Enviando ${files.length} imagem(ns)…`);
    try {
      for (const file of files) await uploadOne(file);
      setStatus(`${files.length} imagem(ns) enviada(s). Ajuste escala/posição e clique em SALVAR REGISTRO.`);
    } catch (e) {
      setStatus(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-top">
        <div>
          <h1>CONTENT STUDIO</h1>
          <small>arquivo digital / edição manual + mídia + aparência</small>
        </div>
        <div className="admin-user-actions">
          <span>Admin: <strong>{username}</strong></span>
          <a href="/">← VER FRONTEND</a>
          <button onClick={logout}>SAIR</button>
        </div>
      </div>

      {!databaseConfigured && (
        <div className="admin-config-warning">
          <strong>Supabase ainda não configurado.</strong>
          <span>Na Vercel, adicione SUPABASE_URL e SUPABASE_SECRET_KEY e faça um novo deploy. Enquanto isso, o projeto abre em modo demonstração.</span>
        </div>
      )}

      {databaseConfigured && databaseError && (
        <div className="admin-db-error">
          <strong>O Supabase está configurado, mas a leitura do banco falhou.</strong>
          <span>{databaseError}</span>
          <small>Isso era mascarado pelo conteúdo de demonstração na versão anterior. Confira se o schema.sql foi executado no mesmo projeto Supabase usado pelas variáveis da Vercel.</small>
        </div>
      )}

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <h2>Registros</h2>
          <button className="admin-new-record" onClick={createRecord}><Plus size={18}/> NOVO REGISTRO</button>
          <label className="admin-record-picker">
            Selecionar para editar
            <select value={records.some(i=>i.id===draft.id) ? draft.id : ''} onChange={e => loadRecord(e.target.value)}>
              <option value="">— novo / não salvo —</option>
              {recordOptions.map(item => <option key={item.id} value={item.id}>{item.yearStart} · {item.title}{item.published ? '' : ' · EM CURADORIA'}</option>)}
            </select>
          </label>

          <div className="admin-record-stats" aria-label="Resumo dos registros">
            <div><strong>{stats.total}</strong><span>no banco</span></div>
            <div><strong>{stats.published}</strong><span>publicados</span></div>
            <div><strong>{stats.review}</strong><span>em curadoria</span></div>
            <div><strong>{stats.incomplete}</strong><span>a completar</span></div>
          </div>

          <div className="admin-data-note">
            <strong>Fluxo manual</strong>
            <span>Os conectores externos de camisetas foram removidos. Agora você controla a imagem, os dados, a fonte e a publicação de cada registro. O Supabase continua sendo usado apenas como banco e armazenamento do seu próprio conteúdo.</span>
          </div>

          <div className="admin-data-note">
            <strong>Publicado x curadoria</strong>
            <span>Um registro pode existir no banco sem aparecer no frontend. Para aparecer no palco público, defina <b>Publicado = Sim</b> e salve.</span>
          </div>
        </aside>

        <section className="admin-main">
          <div className="admin-grid">
            <div className="admin-panel">
              <div className="admin-editor-heading">
                <h2>Editor de registro</h2>
                <span className={draftMissing.length ? 'needs-data' : 'is-complete'}>{draftMissing.length ? `${draftMissing.length} campo(s) a completar` : 'registro completo'}</span>
              </div>
              {draftMissing.length > 0 && <div className="admin-missing-fields">Faltam: {draftMissing.join(' · ')}</div>}
              <div className="admin-form">
                <label>ID<input value={draft.id} onChange={e => update('id', e.target.value)} /></label>
                <label>Tipo<select value={draft.kind} onChange={e => update('kind', e.target.value)}><option value="kit">Camiseta / uniforme</option><option value="crest">Marca / escudo</option><option value="supplier">Fornecedor</option><option value="sponsor">Patrocinador</option><option value="event">Evento</option></select></label>
                <label>Ano inicial<input type="number" value={draft.yearStart} onChange={e => update('yearStart', Number(e.target.value))} /></label>
                <label>Ano final<input type="number" value={draft.yearEnd || draft.yearStart} onChange={e => update('yearEnd', Number(e.target.value))} /></label>
                <label className="full">Título<input value={draft.title} onChange={e => update('title', e.target.value)} /></label>
                <label className="full">Subtítulo<input value={draft.subtitle || ''} onChange={e => update('subtitle', e.target.value)} /></label>
                <label>Fornecedora<input value={draft.manufacturer || ''} onChange={e => update('manufacturer', e.target.value)} /></label>
                <label>Patrocínio<input value={draft.sponsor || ''} onChange={e => update('sponsor', e.target.value)} /></label>
                <label>Tipo / variante<input value={draft.variant || ''} onChange={e => update('variant', e.target.value)} placeholder="Titular, reserva, goleiro…" /></label>
                <label>Temporada<input value={metaText(draft,'season')} onChange={e => updateMetadata({season:e.target.value})} placeholder="2000 / 2001" /></label>
                <label>Competição<input value={metaText(draft,'competition')} onChange={e => updateMetadata({competition:e.target.value})} /></label>
                <label>Coleção / edição<input value={metaText(draft,'collection')} onChange={e => updateMetadata({collection:e.target.value})} placeholder="Especial, comemorativa…" /></label>
                <label className="full">Descrição<textarea value={draft.description || ''} onChange={e => update('description', e.target.value)} /></label>
                <label className="full">URL da fonte<input value={draft.sourceUrl || ''} onChange={e => update('sourceUrl', e.target.value)} /></label>
                <label>Publicado<select value={draft.published ? 'sim' : 'nao'} onChange={e => update('published', e.target.value === 'sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></label>
              </div>

              <div className="admin-subsection">
                <h3>Dados histórico-visuais</h3>
                <div className="admin-form">
                  <label>Padrão / composição<input value={metaText(draft,'pattern')} onChange={e=>updateMetadata({pattern:e.target.value})} placeholder="Listras verticais, degradê…" /></label>
                  <label>Direção das listras<input value={metaText(draft,'stripeDirection')} onChange={e=>updateMetadata({stripeDirection:e.target.value})} placeholder="Vertical, horizontal…" /></label>
                  <label>Espessura das listras<input value={metaText(draft,'stripeWidth')} onChange={e=>updateMetadata({stripeWidth:e.target.value})} placeholder="Fina, média, larga…" /></label>
                  <label>Gola<input value={metaText(draft,'collar')} onChange={e=>updateMetadata({collar:e.target.value})} placeholder="V, polo, redonda…" /></label>
                  <label>Material / tecido<input value={metaText(draft,'material')} onChange={e=>updateMetadata({material:e.target.value})} /></label>
                  <label className="full">Observações visuais<textarea value={metaText(draft,'visualNotes')} onChange={e=>updateMetadata({visualNotes:e.target.value})} placeholder="Escudo, grafismos, faixas, aplicações, detalhes relevantes para análise…" /></label>
                </div>
              </div>

              <div className="admin-subsection">
                <h3>Ficha catalográfica · identidade da camiseta</h3>
                <p className="admin-muted">Preencha somente o que estiver documentado. Todos os campos aparecem na ficha acessada ao clicar na camiseta no frontend.</p>
                <div className="admin-form">
                  <label>Escudo aplicado / variação<input value={metaText(draft,'crestVariation')} onChange={e=>updateMetadata({crestVariation:e.target.value})} placeholder="Versão do escudo, estrelas, bordado…" /></label>
                  <label>Imagem do escudo (URL)<input type="url" value={metaText(draft,'crestImageUrl')} onChange={e=>updateMetadata({crestImageUrl:e.target.value})} placeholder="https://.../escudo.png" /></label>
                  <label className="full">Observações sobre o escudo<textarea value={metaText(draft,'crestNotes')} onChange={e=>updateMetadata({crestNotes:e.target.value})}/></label>
                  <label>Sequência das listras<input value={metaText(draft,'stripeSequence')} onChange={e=>updateMetadata({stripeSequence:e.target.value})} placeholder="Azul, preto, branco…" /></label>
                  <label>Observações sobre cores<input value={metaText(draft,'paletteNotes')} onChange={e=>updateMetadata({paletteNotes:e.target.value})}/></label>
                  <label>Mangas / acabamentos<input value={metaText(draft,'sleeves')} onChange={e=>updateMetadata({sleeves:e.target.value})}/></label>
                  <label>Numeração<input value={metaText(draft,'numbering')} onChange={e=>updateMetadata({numbering:e.target.value})} placeholder="Formato, estilo, cor, aplicação…" /></label>
                  <label>Tipografia<input value={metaText(draft,'typography')} onChange={e=>updateMetadata({typography:e.target.value})}/></label>
                  <label>Posição do patrocínio<input value={metaText(draft,'sponsorPlacement')} onChange={e=>updateMetadata({sponsorPlacement:e.target.value})}/></label>
                  <label>Aplicação da fornecedora<input value={metaText(draft,'supplierPlacement')} onChange={e=>updateMetadata({supplierPlacement:e.target.value})}/></label>
                  <label className="full">Contexto histórico<textarea value={metaText(draft,'historicalContext')} onChange={e=>updateMetadata({historicalContext:e.target.value})}/></label>
                  <label className="full">Análise de identidade / relações com o TCC<textarea value={metaText(draft,'identityInterpretation')} onChange={e=>updateMetadata({identityInterpretation:e.target.value})} placeholder="Recorrências, permanências, rupturas e retomadas…" /></label>
                  <label className="full">Legenda das fotos históricas<textarea value={metaText(draft,'historicalPhotoNotes')} onChange={e=>updateMetadata({historicalPhotoNotes:e.target.value})} placeholder="Descreva as imagens de contexto adicionadas à biblioteca de mídia." /></label>
                  <label className="full">Outras referências / fontes<input value={metaText(draft,'analysisSources')} onChange={e=>updateMetadata({analysisSources:e.target.value})} placeholder="Referências bibliográficas ou documentais" /></label>
                </div>
              </div>

              <div className="admin-subsection">
                <div className="admin-subsection-title"><h3>Paleta da camiseta</h3><button type="button" onClick={addColor}><Plus size={15}/> COR</button></div>
                <div className="admin-color-list">
                  {(draft.colors || []).map((color,index)=><div className="admin-color-row" key={`${index}-${color}`}><input type="color" value={color} onChange={e=>updateColor(index,e.target.value)}/><input value={color} onChange={e=>updateColor(index,e.target.value)}/><button onClick={()=>removeColor(index)} aria-label="Remover cor"><Trash2 size={15}/></button></div>)}
                  {!draft.colors?.length && <span className="admin-muted">Nenhuma cor cadastrada.</span>}
                </div>
              </div>

              <div className="admin-record-actions">
                <button className="admin-save" disabled={!databaseConfigured || !!databaseError} onClick={saveItem}><Save size={18}/> SALVAR REGISTRO</button>
                <button onClick={duplicateRecord}><Copy size={17}/> DUPLICAR</button>
                {isExisting && <button className="danger" onClick={deleteItem}><Trash2 size={17}/> EXCLUIR</button>}
              </div>
            </div>

            <div className="admin-panel">
              <h2>Página / design</h2>
              <div className="admin-form">
                <label>Fundo<input type="color" value={theme.background} onChange={e => setTheme({...theme, background:e.target.value})} /></label>
                <label>Superfície<input type="color" value={theme.surface} onChange={e => setTheme({...theme, surface:e.target.value})} /></label>
                <label>Texto<input type="color" value={theme.ink} onChange={e => setTheme({...theme, ink:e.target.value})} /></label>
                <label>Destaque<input type="color" value={theme.accent} onChange={e => setTheme({...theme, accent:e.target.value})} /></label>
                <label>Raio dos cards<input type="number" min="0" max="60" value={theme.radius} onChange={e => setTheme({...theme, radius:Number(e.target.value)})} /></label>
                <label>Textura<select value={theme.texture} onChange={e => setTheme({...theme, texture:e.target.value as DesignSettings['texture']})}><option value="grain">Grain</option><option value="grid">Grid</option><option value="none">Sem textura</option></select></label>
                <label className="full">Fonte display<input value={theme.displayFont} onChange={e => setTheme({...theme, displayFont:e.target.value})} /></label>
                <label className="full">Fonte corpo<input value={theme.bodyFont} onChange={e => setTheme({...theme, bodyFont:e.target.value})} /></label>
              </div>

              <div className="admin-subsection">
                <h3>Textos do frontend</h3>
                <div className="admin-form">
                  <label>Marca — parte 1<input value={theme.wordmarkPrimary} onChange={e=>setTheme({...theme,wordmarkPrimary:e.target.value})}/></label>
                  <label>Marca — destaque<input value={theme.wordmarkAccent} onChange={e=>setTheme({...theme,wordmarkAccent:e.target.value})}/></label>
                  <label className="full">Faixa temporal<input value={theme.wordmarkRange} onChange={e=>setTheme({...theme,wordmarkRange:e.target.value})}/></label>
                  <label className="full">Título do hero<input value={theme.heroLabel} onChange={e=>setTheme({...theme,heroLabel:e.target.value})}/></label>
                  <label className="full">Placeholder da busca<input value={theme.searchPlaceholder} onChange={e=>setTheme({...theme,searchPlaceholder:e.target.value})}/></label>
                  <label className="full">Texto do link do Admin<input value={theme.studioLinkLabel} onChange={e=>setTheme({...theme,studioLinkLabel:e.target.value})}/></label>
                  <label className="full">Chamada da seção relacional<input value={theme.relationsKicker} onChange={e=>setTheme({...theme,relationsKicker:e.target.value})}/></label>
                  <label className="full">Título da seção relacional<input value={theme.relationsTitle} onChange={e=>setTheme({...theme,relationsTitle:e.target.value})}/></label>
                  <label className="full">Texto da seção relacional<textarea value={theme.relationsText} onChange={e=>setTheme({...theme,relationsText:e.target.value})}/></label>
                  <label className="full">Rodapé — esquerda<input value={theme.footerLeft} onChange={e=>setTheme({...theme,footerLeft:e.target.value})}/></label>
                  <label className="full">Rodapé — direita<input value={theme.footerRight} onChange={e=>setTheme({...theme,footerRight:e.target.value})}/></label>
                </div>
              </div>

              <div className="admin-subsection">
                <h3>Elementos visíveis</h3>
                <div className="admin-toggle-list">
                  <label><input type="checkbox" checked={theme.showSearch} onChange={e=>setTheme({...theme,showSearch:e.target.checked})}/> Busca</label>
                  <label><input type="checkbox" checked={theme.showCompare} onChange={e=>setTheme({...theme,showCompare:e.target.checked})}/> Botão de comparação</label>
                  <label><input type="checkbox" checked={theme.showRelations} onChange={e=>setTheme({...theme,showRelations:e.target.checked})}/> Seção relacional</label>
                  <label><input type="checkbox" checked={theme.showStudioLink} onChange={e=>setTheme({...theme,showStudioLink:e.target.checked})}/> Link do Content Studio</label>
                </div>
              </div>

              <button className="admin-save" disabled={!databaseConfigured || !!databaseError} onClick={saveTheme}><Save size={18}/> SALVAR PÁGINA</button>
            </div>
          </div>

          <div className="admin-media-panel">
            <div className="mockup-preview-column">
              <div className="admin-panel-heading">
                <div><span>EDITOR VISUAL</span><h2>Padronização da imagem</h2></div>
                <small>Use a mesma escala, enquadramento e fundo para dar unidade às camisetas.</small>
              </div>
              <div className="admin-mockup-preview">
                <div className="admin-preview-year">{draft.yearStart}</div>
                <JerseyVisual item={draft} large />
                <div className="admin-preview-caption"><strong>{draft.title}</strong><span>{draft.manufacturer || draft.subtitle || 'Arquivo visual'}</span></div>
              </div>
            </div>

            <div className="mockup-controls-column">
              <div className="mockup-block">
                <h3>Como exibir</h3>
                <div className="visual-mode-grid">
                  {([
                    ['image','Imagem padronizada'],
                    ['mockup','Aplicar em mockup'],
                    ['auto','Automático / legado']
                  ] as [VisualMode,string][]).map(([value,label]) => (
                    <button key={value} className={visualMode===value ? 'active' : ''} onClick={() => updateMetadata({ visualMode:value })}>{label}</button>
                  ))}
                </div>
                <p>Para o seu projeto, prefira “Imagem padronizada”: envie um PNG/JPG tratado e use os controles abaixo para manter todas as camisetas com o mesmo enquadramento.</p>
              </div>

              <div className="mockup-block mockup-sliders">
                <h3>Ajustar enquadramento</h3>
                <label>Escala <strong>{Math.round(mockup.scale)}%</strong><input type="range" min="40" max="220" step="1" value={mockup.scale} onChange={e=>updateMockup({scale:Number(e.target.value)})}/></label>
                <label>Horizontal <strong>{Math.round(mockup.x)}%</strong><input type="range" min="0" max="100" step="1" value={mockup.x} onChange={e=>updateMockup({x:Number(e.target.value)})}/></label>
                <label>Vertical <strong>{Math.round(mockup.y)}%</strong><input type="range" min="0" max="100" step="1" value={mockup.y} onChange={e=>updateMockup({y:Number(e.target.value)})}/></label>
                <label>Rotação <strong>{Math.round(mockup.rotation)}°</strong><input type="range" min="-20" max="20" step="1" value={mockup.rotation} onChange={e=>updateMockup({rotation:Number(e.target.value)})}/></label>
                <label className="mockup-color">Cor de fundo/base<input type="color" value={mockup.baseColor} onChange={e=>updateMockup({baseColor:e.target.value})}/></label>
                <button onClick={()=>updateMockup({scale:100,x:50,y:50,rotation:0,baseColor:'#11151a'})}>RESETAR ENQUADRAMENTO</button>
              </div>

              <div className="mockup-block">
                <h3>Adicionar imagens</h3>
                <input ref={fileRef} className="hidden-file" type="file" accept="image/*" multiple onChange={handleFiles}/>
                <div className="media-add-actions">
                  <button disabled={!databaseConfigured || !!databaseError || uploading} onClick={()=>fileRef.current?.click()}><Upload size={18}/>{uploading ? 'ENVIANDO…' : 'UPAR FOTO(S)'}</button>
                </div>
                <div className="url-adder">
                  <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://.../camiseta.jpg" />
                  <button onClick={addUrl}><Link2 size={18}/> ADICIONAR LINK</button>
                </div>
                <p>A primeira imagem da lista é a principal. Para maior consistência visual, prefira arquivos próprios já recortados e padronizados.</p>
              </div>
            </div>
          </div>

          <div className="admin-panel media-library-panel">
            <div className="admin-panel-heading">
              <div><span>MÍDIA DO REGISTRO</span><h2>{draft.media?.length || 0} imagem(ns)</h2></div>
              <small>Defina a principal, créditos, licença e texto alternativo.</small>
            </div>
            {!draft.media?.length ? (
              <div className="media-empty"><ImagePlus size={32}/><span>Adicione uma imagem para substituir a ilustração genérica.</span></div>
            ) : (
              <div className="media-admin-list">
                {draft.media.map((m,index) => (
                  <article className={`media-admin-card ${index===0 ? 'is-primary' : ''}`} key={`${m.url}-${index}`}>
                    <div className="media-thumb"><img src={m.thumbUrl || m.url} alt={m.alt || draft.title}/>{index===0 && <span>PRINCIPAL</span>}</div>
                    <div className="media-fields">
                      <label>Texto alternativo<input value={m.alt || ''} onChange={e=>updateMedia(index,{alt:e.target.value})}/></label>
                      <label>Autor / crédito<input value={m.author || ''} onChange={e=>updateMedia(index,{author:e.target.value})}/></label>
                      <label>Licença<input value={m.license || ''} onChange={e=>updateMedia(index,{license:e.target.value})}/></label>
                      <label>Direitos<select value={m.rightsStatus || 'unknown'} onChange={e=>updateMedia(index,{rightsStatus:e.target.value as RightsStatus})}><option value="unknown">A revisar</option><option value="open">Aberta</option><option value="permission">Com permissão</option><option value="restricted">Restrita</option></select></label>
                      <label className="full">URL<input value={m.url} onChange={e=>updateMedia(index,{url:e.target.value,thumbUrl:e.target.value})}/></label>
                    </div>
                    <div className="media-card-actions">
                      {index!==0 && <button onClick={()=>makePrimary(index)}><Star size={17}/> TORNAR PRINCIPAL</button>}
                      <a href={m.url} target="_blank" rel="noreferrer"><ExternalLink size={17}/> ABRIR</a>
                      <button className="danger" onClick={()=>removeMedia(index)}><Trash2 size={17}/> REMOVER</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="admin-bottom-save">
            <button className="admin-save admin-save-large" disabled={!databaseConfigured || !!databaseError} onClick={saveItem}><Save size={19}/> SALVAR REGISTRO + IMAGENS + ENQUADRAMENTO</button>
          </div>
          <div className="status" aria-live="polite">{status}</div>
        </section>
      </div>
    </div>
  );
}
