import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arquivo Tricolor — identidade em movimento',
  description: 'Protótipo acadêmico de arquivo digital da evolução visual do Grêmio.'
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
