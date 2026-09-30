Arquitetura — Arquivo Tricolor
Fluxo público
Navegador → Next.js/Vercel → Supabase
O navegador não recebe nenhuma chave do Supabase. As páginas e APIs públicas consultam o banco exclusivamente no servidor usando `SUPABASE_URL` + `SUPABASE_SECRET_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY` legado). O servidor retorna apenas os registros publicados necessários para o frontend.
Fluxo administrativo
Usuário abre `/admin`.
Sem sessão válida, é redirecionado para `/admin/login`.
O login compara usuário e senha com `ADMIN_USERNAME` e `ADMIN_PASSWORD`, armazenados nas Environment Variables da Vercel.
Em caso de sucesso, o servidor cria cookie HttpOnly assinado com `SESSION_SECRET`.
Todas as gravações e sincronizações verificam esse cookie antes de executar qualquer operação.
Variáveis
```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
ADMIN_USERNAME=
ADMIN_PASSWORD=
SESSION_SECRET=
```
Opcional para projetos Supabase legados:
```env
SUPABASE_SERVICE_ROLE_KEY=
```
Não são usados `NEXT_PUBLIC_*` nem `SYNC_SECRET`.
Rotas públicas
`GET /api/archive`
`GET /api/design`
Rotas protegidas
`POST /api/archive`
`POST /api/design`
`POST /api/sync`
`GET /api/sources/*`
`/admin`
Tipografia
A interface adota 16 px como piso de tamanho visível de texto em desktop e mobile.
