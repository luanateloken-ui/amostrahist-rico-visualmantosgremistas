# Arquivo Tricolor — arquivo digital da identidade do Grêmio

Protótipo acadêmico full-stack para apresentar a evolução visual do Grêmio com **linha do tempo, comparação, relações entre uniformes/marcas/fornecedores/patrocínios e microinterações**, inspirado nos wireframes da Luana.

## Stack
- Next.js + React + TypeScript
- Framer Motion para microinterações (respeita `prefers-reduced-motion`)
- Supabase/Postgres para conteúdo, relações, mídia e parâmetros de design
- Vercel para frontend + rotas de API
- Conectores de fontes no servidor

## 1. Rode localmente
```bash
npm install
cp .env.example .env.local
npm run dev
```
Abra `http://localhost:3000`. Sem Supabase, o projeto funciona em **modo demonstração**.

## 2. Crie o banco no Supabase
1. Abra o SQL Editor do projeto.
2. Cole todo o conteúdo de `sql/schema.sql` e execute.
3. Em **Project Settings → API**, copie URL, anon key e service role key.
4. Preencha `.env.local` e também as mesmas variáveis no Vercel.
5. Defina uma `SYNC_SECRET` longa. Ela protege gravações e sincronizações no protótipo.

> Para produção, substitua a chave digitada no Content Studio por autenticação Supabase Auth e uma tabela `profiles` com papel `admin`.

## 3. Content Studio
Acesse `/admin`.

Ele permite:
- sincronizar fontes;
- criar/editar registros;
- publicar/despublicar;
- alterar cores, tipografia, textura e raio dos cards;
- controlar o conteúdo sem mexer no frontend.

### Fontes
- **Wikimedia Commons (uniformes e símbolos):** usa a API MediaWiki (`prop=images` + `imageinfo/extmetadata`) e traz URL, autor e licença. Pode entrar publicado quando o arquivo está identificado como aberto.
- **Football Kit Archive:** conector HTML de referência. Itens entram `published=false`.
- **Camisas do Grêmio:** conector HTML paginado. Itens entram `published=false`.
- **Gremistas.net:** lê a tabela de fornecedores esportivos.
- **Grêmio 1903 / WordPress:** captura apenas uma síntese de referência do conteúdo histórico.

## 4. Política de imagens e texto
O sistema foi deliberadamente desenhado para **não copiar em massa conteúdo protegido**:
- Wikimedia: conserva autoria/licença e link original.
- Demais sites: armazena referência e metadados para curadoria; a imagem não é publicada automaticamente.
- Textos de terceiros devem ser transformados em texto editorial próprio, mantendo a fonte.
- Se a Luana obtiver autorização de uma coleção privada, marque a mídia como `permission` e use upload próprio no Supabase Storage.

## 5. Endpoints principais
- `GET /api/archive?kind=kit&year=2001`
- `POST /api/archive` (header `x-admin-secret`)
- `GET /api/design`
- `POST /api/design` (header `x-admin-secret`)
- `GET /api/sources/commons?limit=100`
- `GET /api/sources/symbols`
- `GET /api/sources/football-kits`
- `GET /api/sources/camisas?page=1`
- `GET /api/sources/suppliers`
- `GET /api/sources/gremio1903`
- `POST /api/sync` com `{ "source": "commons" }` e `x-admin-secret`

## 6. Próximas evoluções recomendadas
- Supabase Auth no admin e permissões por usuário.
- Supabase Storage para imagens autorizadas.
- editor de relações visual (uniforme ↔ fornecedor ↔ patrocinador ↔ título ↔ estádio);
- busca por cor, década, competição, modelagem e material;
- modo “antes/depois” com slider;
- visualização de rede em SVG/WebGL;
- páginas dedicadas para evolução dos escudos e lettering;
- importação manual por CSV/JSON para dados que não devem ser raspados.

## Wireframes
Os dois desenhos fornecidos estão guardados em `docs/reference/` apenas como referência de projeto.
