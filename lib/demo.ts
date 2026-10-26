import type { ArchiveItem, DesignSettings, Relation } from './types';


export const defaultDesign: DesignSettings = {
  background: '#090a0c',
  surface: '#12151a',
  ink: '#f4f7f8',
  accent: '#54c8f5',
  accent2: '#a4e6ff',
  radius: 28,
  motion: 'expressive',
  texture: 'grain',
  displayFont: 'Arial Black, Arial, sans-serif',
  bodyFont: 'Inter, Arial, sans-serif',

  // Identidade e textos do frontend
  wordmarkPrimary: 'ARQUIVO',
  wordmarkAccent: 'TRICOLOR',
  wordmarkRange: '1903 → HOJE',
  heroLabel: 'IDENTIDADE EM MOVIMENTO',
  searchPlaceholder: 'Buscar por ano, camiseta ou fornecedor...',
  studioLinkLabel: 'CONTENT STUDIO',

  // Visibilidade dos recursos
  showSearch: true,
  showCompare: true,
  showRelations: true,
  showStudioLink: true,

  // Seção de relações
  relationsKicker: 'CONEXÕES',
  relationsTitle: 'Identidades que se conectam',
  relationsText: 'Explore relações entre camisetas, elementos visuais e momentos da história do Grêmio.',

  // Rodapé
  footerLeft: 'ARQUIVO TRICOLOR',
  footerRight: 'Projeto acadêmico de Design'
};

