'use client';

import { useState } from 'react';
import type { ArchiveItem, DesignSettings } from '@/lib/types';

const sourceList = [
  { key:'commons', name:'Wikimedia Commons / uniformes', note:'API oficial. Importa imagem + autor + licença. Pode autopublicar itens abertos.' },
  { key:'symbols', name:'Wikimedia Commons / símbolos', note:'Busca a categoria de logos e símbolos; preserva metadados de licença e aviso de marca.' },
  { key:'football-kits', name:'Football Kit Archive', note:'Referência histórica. Importa metadados para revisão; não autopublica imagens.' },
  { key:'camisas', name:'Camisas do Grêmio', note:'Coleção fotográfica. Importa referências para curadoria; direitos devem ser verificados.' },
  { key:'suppliers', name:'Gremistas.net', note:'Importa períodos de fornecedores esportivos a partir da tabela do artigo.' },
  { key:'gremio1903', name:'Grêmio 1903', note:'Fonte histórica do primeiro uniforme. Mantida como resumo/referência.' }
];

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
  const [draft, setDraft] = useState<ArchiveItem>(items[0] || {
    id:'novo',
    kind:'kit',
    yearStart:1903,
    title:'Novo registro',
    colors:['#54c8f5','#111216','#ffffff']
  });

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
        ? `Importados: ${j.imported}. Publicados automaticamente: ${j.autoPublished}. Em revisão: ${j.reviewRequired}.`
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
    setStatus(r.ok ? 'Design salvo. Recarregue o site público para visualizar.' : `Erro: ${j.error}`);
  }

  async function saveItem() {
    const r = await request('/api/archive', {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body:JSON.stringify(draft)
    });
    const j = await r.json();
    setStatus(r.ok ? 'Registro salvo no Supabase.' : `Erro: ${j.error}`);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' });
    window.location.href = '/admin/login';
  }

  const update = (k:keyof ArchiveItem, v:any) => setDraft(d => ({ ...d, [k]:v }));

  return (
    <div className="admin-page">
      <div className="admin-top">
        <div>
          <h1>CONTENT STUDIO</h1>
          <small>arquivo digital / conteúdo + design + sincronização</small>
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
          <h2>Fontes conectadas</h2>
          {sourceList.map(s => (
            <div className="source-card" key={s.key}>
              <strong>{s.name}</strong>
              <small>{s.note}</small>
              <button disabled={!databaseConfigured} onClick={() => sync(s.key)}>SINCRONIZAR</button>
            </div>
          ))}
          <div className="rights-note">
            <strong>Regra de direitos:</strong><br/>
            Wikimedia traz licença e autoria via API. As demais fontes entram como <em>revisão necessária</em>, sem republicação automática das imagens.
          </div>
        </aside>

        <section className="admin-main">
          <div className="admin-grid">
            <div className="admin-panel">
              <h2>Editor de registro</h2>
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
              <button disabled={!databaseConfigured} style={{marginTop:14}} onClick={saveItem}>SALVAR REGISTRO</button>
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
              <button disabled={!databaseConfigured} style={{marginTop:14}} onClick={saveTheme}>SALVAR DESIGN</button>
            </div>
          </div>
          <div className="status" aria-live="polite">{status}</div>
        </section>
      </div>
    </div>
  );
}
