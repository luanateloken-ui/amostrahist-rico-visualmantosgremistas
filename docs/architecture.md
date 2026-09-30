# Arquitetura de conteúdo

## Entidades
`archive_items` é a camada editorial comum. O campo `kind` define uniforme, marca/escudo, fornecedor, patrocinador ou evento. Isso evita criar uma tabela por tipo e facilita montar relações transversais.

`media_assets` guarda múltiplas imagens por item, com autoria, licença, fonte e estado de direitos.

`relations` cria a camada mais interessante do projeto: uma camisa de 2001 pode estar ligada a Kappa, Banrisul, uma competição, um título e uma versão do escudo. No frontend isso pode virar grafo, comparação ou narrativa.

`design_settings` transforma o frontend em um sistema visual gerenciável, sem obrigar a Luana a editar CSS para cada ajuste.

## Fluxo de ingestão
1. conector consulta a fonte;
2. normaliza para `ArchiveItem`;
3. registra URL da fonte;
4. se a fonte tiver metadados de licença estruturados, preserva-os;
5. fontes sem permissão explícita entram em revisão (`published=false`);
6. a Luana revisa, edita e publica no Content Studio.

## Por que não fazer scraping direto no navegador
- CORS costuma bloquear;
- HTML de terceiros muda;
- expõe lógica de coleta no cliente;
- dificulta cache, controle de taxa e atribuição;
- não permite uma fila de curadoria/validação de direitos.

Os conectores ficam no servidor (rotas `/api`).
