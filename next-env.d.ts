# Supabase — somente no servidor/Vercel. Não usa NEXT_PUBLIC_*.
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SECRET_KEY=sb_secret_SUBSTITUA_AQUI

# Se o projeto ainda usa a chave JWT antiga, pode usar esta em vez da linha acima:
# SUPABASE_SERVICE_ROLE_KEY=

# Login único do Content Studio
ADMIN_USERNAME=admin
ADMIN_PASSWORD=troque-por-uma-senha-forte

# Assina o cookie HttpOnly da sessão administrativa.
# Use uma sequência longa e aleatória (idealmente 32+ caracteres).
SESSION_SECRET=troque-por-uma-chave-longa-e-aleatoria

# Opcional. Se não definir, o sistema cria/usa o bucket público "archive-media".
# SUPABASE_MEDIA_BUCKET=archive-media/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
