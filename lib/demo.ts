import type { ArchiveItem, DesignSettings, Relation } from './types';

export const demoItems: ArchiveItem[] = [
  {
    id: 'kit-1903', kind: 'kit', yearStart: 1903,
    title: 'Primeiro uniforme', subtitle: 'Azul + havana', variant: 'Titular',
    description: 'Reconstrução editorial do uniforme inaugural: listras horizontais em azul e havana, faixa branca na cintura e complementos escuros.',
    colors: ['#70c9f4', '#9c6a45', '#f5f5f5', '#0b0b0c'],
    sourceUrl: 'https://gremio1903.wordpress.com/2009/03/05/coluna-do-ramao-gremista-3/',
    metadata: { editorialNote: 'Use a fonte histórica como referência; não copie o texto integral.' }
  },
  {
    id: 'kit-1904', kind: 'kit', yearStart: 1904,
    title: 'Transição cromática', subtitle: 'Rumo ao tricolor', variant: 'Titular',
    description: 'Período de transição visual que prepara a consolidação das cores azul, preto e branco.',
    colors: ['#55b9ec', '#111216', '#f6f6f3'],
    sourceUrl: 'https://commons.wikimedia.org/wiki/Gr%C3%AAmio_Foot-Ball_Porto_Alegrense_kits'
  },
  {
    id: 'kit-1921', kind: 'kit', yearStart: 1921,
    title: 'Tricolor histórico', subtitle: 'Listras verticais', variant: 'Titular',
    description: 'A linguagem de listras verticais passa a organizar a leitura visual da camisa e se torna um elemento identitário recorrente.',
    colors: ['#57bceb', '#111216', '#ffffff'],
    sourceUrl: 'https://commons.wikimedia.org/wiki/Gr%C3%AAmio_Foot-Ball_Porto_Alegrense_kits'
  },
  {
    id: 'supplier-1985', kind: 'supplier', yearStart: 1985, yearEnd: 1999,
    title: 'Penalty', subtitle: 'Fornecedor esportivo',
    description: 'Ciclo de fornecimento de material esportivo associado a uma longa fase da identidade visual das camisas.',
    manufacturer: 'Penalty',
    sourceUrl: 'https://www.gremistas.net/artigos/todos-fornecedores-material-esportivo-historia-gremio/'
  },
  {
    id: 'kit-2001', kind: 'kit', yearStart: 2001,
    title: 'Kappa / Banrisul', subtitle: 'Camisa titular', variant: 'Titular',
    description: 'Período em que fornecedor, patrocinador e modelagem passam a compor uma assinatura visual fortemente reconhecível.',
    manufacturer: 'Kappa', sponsor: 'Banrisul',
    colors: ['#58bdea', '#08090a', '#f7f7f7'],
    sourceUrl: 'https://www.footballkitarchive.com/pt/gremio-fbpa-camisas-t264/'
  },
  {
    id: 'kit-2015', kind: 'kit', yearStart: 2015,
    title: 'Umbro', subtitle: 'Nova fase de fornecimento', variant: 'Titular',
    manufacturer: 'Umbro',
    description: 'Início de um novo ciclo de fornecimento esportivo, com sucessivas releituras do tricolor.',
    colors: ['#53bde9', '#0c0c0d', '#f5f5f5'],
    sourceUrl: 'https://www.footballkitarchive.com/pt/gremio-fbpa-camisas-t264/'
  },
  {
    id: 'kit-2026', kind: 'kit', yearStart: 2026,
    title: 'New Balance', subtitle: 'Novo ciclo', variant: 'Titular',
    manufacturer: 'New Balance',
    description: 'A partir de 2026, a New Balance assume o fornecimento oficial de material esportivo do clube.',
    colors: ['#55bdec', '#0c0d0f', '#fafafa'],
    sourceUrl: 'https://gremio.net/noticias/detalhes/29730/gremio-anuncia-a-new-balance-como-nova-fornecedora-de-material-esportivo'
  }
];

export const demoRelations: Relation[] = [
  { id: 'r1', fromId: 'kit-2001', toId: 'supplier-1985', type: 'era', label: 'mudança de ciclo' },
  { id: 'r2', fromId: 'kit-2015', toId: 'kit-2026', type: 'supplier_transition', label: 'Umbro → New Balance' },
  { id: 'r3', fromId: 'kit-1903', toId: 'kit-1921', type: 'visual_evolution', label: 'da origem ao tricolor' }
];

export const defaultDesign: DesignSettings = {
  background: '#090a0c', surface: '#12151a', ink: '#f4f7f8', accent: '#54c8f5', accent2: '#a4e6ff',
  radius: 28, motion: 'expressive', texture: 'grain', displayFont: 'Arial Black, Arial, sans-serif', bodyFont: 'Inter, Arial, sans-serif'
};
