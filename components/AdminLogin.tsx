'use client';

import { FormEvent, useState } from 'react';
import { LockKeyhole, UserRound } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || 'Não foi possível entrar.');
        return;
      }
      window.location.href = '/admin';
    } catch {
      setStatus('Falha de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="login-title">
        <div className="admin-login-mark">G</div>
        <p className="admin-login-kicker">Arquivo digital da identidade do Grêmio</p>
        <h1 id="login-title">Área administrativa</h1>
        <p className="admin-login-intro">
          Entre para gerenciar uniformes, marcas, fornecedores, relações, fontes e o design do arquivo.
        </p>

        <form onSubmit={submit} className="admin-login-form">
          <label>
            Usuário
            <span className="login-input-wrap">
              <UserRound size={20} aria-hidden="true" />
              <input
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </span>
          </label>
          <label>
            Senha
            <span className="login-input-wrap">
              <LockKeyhole size={20} aria-hidden="true" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </span>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'ENTRANDO…' : 'ENTRAR NO ADMIN'}
          </button>
          {status && <p className="login-status" role="alert">{status}</p>}
        </form>
        <a className="login-back" href="/">← Voltar ao arquivo</a>
      </section>
    </main>
  );
}
