'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { ExternalLink, ImagePlus, Link2, Plus, Save, Star, Trash2, Upload } from 'lucide-react';
import type { ArchiveItem, DesignSettings, MediaAsset, MockupSettings, RightsStatus, VisualMode } from '@/lib/types';
import { JerseyVisual } from './JerseyVisual';

const sourceList = [
  { key:'commons', name:'Wikimedia Commons / uniformes', note:'API oficial. Percorre toda a paginação da coleção e importa todas as imagens com autor + licença.' },
  { key:'symbols', name:'Wikimedia Commons / símbolos', note:'Percorre toda a categoria de logos e símbolos; preserva metadados de licença e aviso de marca.' },
  { key:'football-kits', name:'Football Kit Archive', note:'Referência histórica. Pode bloquear sincronização automatizada (403); use como fonte de consulta quando isso ocorrer.' },
  { key:'camisas', name:'Camisas do Grêmio', note:'Coleção fotográfica. Importa referências para curadoria; direitos devem ser verificados.' },
  { key:'suppliers', name:'Gremistas.net', note:'Importa períodos de fornecedores esportivos a partir da tabela do artigo.' },
  { key:'gremio1903', name:'Grêmio 1903', note:'Fonte histórica do primeiro uniforme. Mantida como resumo/referência.' }
];

const blankItem = (): ArchiveItem => ({
  id:`registro-${Date.now()}`,
  kind:'kit',
  yearStart:1903,
  yearEnd:1903,
  title:'Novo registro',
  colors:['#54c8f5','#111216','#ffffff'],
  published:false,
  metadata:{
    visualMode:'mockup',
    mockup:{ scale:100, x:50, y:50, rotation:0, baseColor:'#11151a' }
  },
  media:[]
});


function missingFields(item: ArchiveItem): string[] {
  const missing:string[] = [];
  if (!item.subtitle) missing.push('subtítulo');
  if (!item.description) missing.push('descrição');
  if (!item.sourceUrl) missing.push('fonte');
  if (item.kind === 'kit' && !item.variant) missing.push('variante');
  if (item.kind === 'kit' && !item.manufacturer) missing.push('fornecedor');
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

export default function AdminStudio({
  design,
  items,
  databaseConfigured,
  username
}: {
  design: DesignSettings;
  items: ArchiveItem[];
  databaseConfigured: boolean;
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
  const visualMode = (draft.metadata?.visualMode || 'auto') as VisualMode;
  const mockup = getMockup(draft);
  const stats = useMemo(() => ({
    total:records.length,
    published:records.filter(i => i.published).length,
    review:records.filter(i => !i.published).length,
    incomplete:records.filter(i => missingFields(i).length > 0).length
  }), [records]);
  const draftMissing = missingFields(draft);

  async function request(path: string, init: RequestInit) {
    const response = await fetch(path, init);
    if (response.status === 401) {
      window.location.href = '/admin/login';
      throw new Error('Sessão expirada.');
    }
    return response;
  }

  async function sync(key:string) {
    setStatus(`Sincronizando ${key}…`);
    try {
      const body:any = { source:key };
      if (key === 'camisas') body.page = 1;
      const r = await request('/api/sync', {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body:JSON.stringify(body)
      });
      const j = await r.json();
      setStatus(r.ok
        ? `Importados: ${j.imported}. Publicados automaticamente: ${j.autoPublished}. Em revisão: ${j.reviewRequired}. Recarregue o admin para editar os novos registros.`
        : `Erro: ${j.error}`
      );
    } catch (e) {
      setStatus(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function saveTheme() {
    const r = await request('/api/design', {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body:JSON.stringify(theme)
    });
    const j = await r.json();
    setStatus(r.ok ? 'Design salvo. O frontend será atualizado no próximo carregamento.' : `Erro: ${j.error}`);
  }

  async function saveItem() {
    setStatus('Salvando registro, imagens e mockup…');
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
    setRecords(prev => {
      const exists = prev.some(i => i.id === draft.id);
      return exists ? prev.map(i => i.id === draft.id ? draft : i) : [...prev, draft];
    });
    setStatus('Registro salvo. Imagens, ordem e configuração do mockup já estão disponíveis no frontend.');
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
    setStatus('Novo registro iniciado.');
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

  function addMedia(asset:MediaAsset) {
    setDraft(d => ({ ...d, media:[...(d.media || []), asset] }));
  }

  function addUrl() {
    const url = imageUrl.trim();
    if (!url) return;
    try { new URL(url); } catch { setStatus('Informe uma URL de imagem válida.'); return; }
    addMedia({ url, thumbUrl:url, alt:draft.title, rightsStatus:'unknown', sourceUrl:url });
    setImageUrl('');
    setStatus('Imagem por link adicionada ao registro. Salve o registro para publicar a alteração.');
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

    const sign = await request('/api/media/upload-sign', {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body:JSON.stringify({ filename:file.name, contentType:file.type, itemId:draft.id })
    });
    const signed = await sign.json();
    if (!sign.ok) throw new Error(signed.error || 'Não foi possível preparar o upload.');

    // A URL é temporária e assinada pelo backend. Nenhuma chave pública do
    // Supabase é exposta no navegador. O arquivo vai direto para o Storage.
    const form = new FormData();
    form.append('cacheControl', '3600');
    form.append('', file);
    const uploaded = await fetch(signed.signedUrl, {
      method:'PUT',
      headers:{ 'x-upsert':'false' },
      body:form
    });
    if (!uploaded.ok) {
      const detail = await uploaded.text().catch(() => '');
      throw new Error(`Falha no upload de ${file.name} (${uploaded.status})${detail ? `: ${detail.slice(0,160)}` : ''}`);
    }

    addMedia({
      url:signed.publicUrl,
      thumbUrl:signed.publicUrl,
      alt:file.name.replace(/\.[^.]+$/, ''),
      rightsStatus:'unknown'
    });
  }

  async function handleFiles(event:ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setStatus(`Enviando ${files.length} imagem(ns)…`);
    try {
      for (const file of files) await uploadOne(file);
      setStatus(`${files.length} imagem(ns) enviada(s). Ajuste o mockup e clique em SALVAR REGISTRO.`);
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
          <small>arquivo digital / conteúdo + imagens + mockup + design</small>
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
          <span>Na Vercel, adicione SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY legado) e faça um novo deploy.</span>
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
            <strong>Sobre os campos NULL</strong>
            <span>NULL significa “informação ainda não conhecida”. Ele não apaga o registro. O que controla se o item aparece no palco público é o campo <b>Publicado</b>. A nova linha do tempo contabiliza também os itens em curadoria.</span>
          </div>

          <h2 className="admin-source-title">Fontes conectadas</h2>
          {sourceList.map(s => (
            <div className="source-card" key={s.key}>
              <strong>{s.name}</strong>
              <small>{s.note}</small>
              <button disabled={!databaseConfigured} onClick={() => sync(s.key)}>SINCRONIZAR</button>
            </div>
          ))}
          <div className="rights-note">
            <strong>Regra de direitos:</strong><br/>
            Wikimedia traz licença e autoria via API. Uploads e links manuais entram como <em>direitos a revisar</em> até você informar os créditos/licença.
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
                <label>Tipo<select value={draft.kind} onChange={e => update('kind', e.target.value)}><option value="kit">Uniforme</option><option value="crest">Marca/escudo</option><option value="supplier">Fornecedor</option><option value="sponsor">Patrocinador</option><option value="event">Evento</option></select></label>
                <label>Ano inicial<input type="number" value={draft.yearStart} onChange={e => update('yearStart', Number(e.target.value))} /></label>
                <label>Ano final<input type="number" value={draft.yearEnd || draft.yearStart} onChange={e => update('yearEnd', Number(e.target.value))} /></label>
                <label className="full">Título<input value={draft.title} onChange={e => update('title', e.target.value)} /></label>
                <label className="full">Subtítulo<input value={draft.subtitle || ''} onChange={e => update('subtitle', e.target.value)} /></label>
                <label>Fornecedor<input value={draft.manufacturer || ''} onChange={e => update('manufacturer', e.target.value)} /></label>
                <label>Patrocínio<input value={draft.sponsor || ''} onChange={e => update('sponsor', e.target.value)} /></label>
                <label className="full">Descrição<textarea value={draft.description || ''} onChange={e => update('description', e.target.value)} /></label>
                <label className="full">URL da fonte<input value={draft.sourceUrl || ''} onChange={e => update('sourceUrl', e.target.value)} /></label>
                <label>Publicado<select value={draft.published ? 'sim' : 'nao'} onChange={e => update('published', e.target.value === 'sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></label>
                <label>Variante<input value={draft.variant || ''} onChange={e => update('variant', e.target.value)} /></label>
              </div>
              <button className="admin-save" disabled={!databaseConfigured} onClick={saveItem}><Save size={18}/> SALVAR REGISTRO</button>
            </div>

            <div className="admin-panel">
              <h2>Design system</h2>
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
              <button className="admin-save" disabled={!databaseConfigured} onClick={saveTheme}><Save size={18}/> SALVAR DESIGN</button>
            </div>
          </div>

          <div className="admin-media-panel">
            <div className="mockup-preview-column">
              <div className="admin-panel-heading">
                <div><span>EDITOR VISUAL</span><h2>Mockup da camiseta</h2></div>
                <small>O que você montar aqui será usado no frontend.</small>
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
                    ['auto','Automático'],
                    ['mockup','Montar mockup'],
                    ['image','Mostrar foto original']
                  ] as [VisualMode,string][]).map(([value,label]) => (
                    <button key={value} className={visualMode===value ? 'active' : ''} onClick={() => updateMetadata({ visualMode:value })}>{label}</button>
                  ))}
                </div>
                <p>Em “Montar mockup”, a imagem principal vira a arte/textura aplicada dentro da silhueta da camiseta. “Foto original” exibe a imagem sem recorte.</p>
              </div>

              <div className={`mockup-block mockup-sliders ${visualMode==='image' ? 'is-disabled' : ''}`}>
                <h3>Ajustar mockup</h3>
                <label>Escala da imagem <strong>{Math.round(mockup.scale)}%</strong><input type="range" min="40" max="260" step="1" value={mockup.scale} disabled={visualMode==='image'} onChange={e=>updateMockup({scale:Number(e.target.value)})}/></label>
                <label>Horizontal <strong>{Math.round(mockup.x)}%</strong><input type="range" min="0" max="100" step="1" value={mockup.x} disabled={visualMode==='image'} onChange={e=>updateMockup({x:Number(e.target.value)})}/></label>
                <label>Vertical <strong>{Math.round(mockup.y)}%</strong><input type="range" min="0" max="100" step="1" value={mockup.y} disabled={visualMode==='image'} onChange={e=>updateMockup({y:Number(e.target.value)})}/></label>
                <label>Rotação <strong>{Math.round(mockup.rotation)}°</strong><input type="range" min="-20" max="20" step="1" value={mockup.rotation} disabled={visualMode==='image'} onChange={e=>updateMockup({rotation:Number(e.target.value)})}/></label>
                <label className="mockup-color">Cor de base<input type="color" value={mockup.baseColor} disabled={visualMode==='image'} onChange={e=>updateMockup({baseColor:e.target.value})}/></label>
                <button onClick={()=>updateMockup({scale:100,x:50,y:50,rotation:0,baseColor:'#11151a'})}>RESETAR POSIÇÃO</button>
              </div>

              <div className="mockup-block">
                <h3>Adicionar imagens</h3>
                <input ref={fileRef} className="hidden-file" type="file" accept="image/*" multiple onChange={handleFiles}/>
                <div className="media-add-actions">
                  <button disabled={!databaseConfigured || uploading} onClick={()=>fileRef.current?.click()}><Upload size={18}/>{uploading ? 'ENVIANDO…' : 'UPAR FOTO(S)'}</button>
                </div>
                <div className="url-adder">
                  <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://.../camiseta.jpg" />
                  <button onClick={addUrl}><Link2 size={18}/> ADICIONAR LINK</button>
                </div>
                <p>Você pode misturar fotos enviadas ao Supabase Storage com links externos. A primeira imagem da lista é a principal.</p>
              </div>
            </div>
          </div>

          <div className="admin-panel media-library-panel">
            <div className="admin-panel-heading">
              <div><span>MÍDIA DO REGISTRO</span><h2>{draft.media?.length || 0} imagem(ns)</h2></div>
              <small>Defina a principal, créditos, licença e texto alternativo.</small>
            </div>
            {!draft.media?.length ? (
              <div className="media-empty"><ImagePlus size={32}/><span>Adicione uma foto ou um link para começar o mockup.</span></div>
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
            <button className="admin-save admin-save-large" disabled={!databaseConfigured} onClick={saveItem}><Save size={19}/> SALVAR REGISTRO + IMAGENS + MOCKUP</button>
          </div>
          <div className="status" aria-live="polite">{status}</div>
        </section>
      </div>
    </div>
  );
}
