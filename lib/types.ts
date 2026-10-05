export type ArchiveKind = 'kit' | 'crest' | 'supplier' | 'sponsor' | 'event';
export type RightsStatus = 'open' | 'permission' | 'unknown' | 'restricted';
export type VisualMode = 'auto' | 'image' | 'mockup';

export type MockupSettings = {
  scale?: number;
  x?: number;
  y?: number;
  rotation?: number;
  baseColor?: string;
};

export type MediaAsset = {
  id?: string;
  url: string;
  thumbUrl?: string | null;
  alt?: string | null;
  author?: string | null;
  license?: string | null;
  sourceUrl?: string | null;
  rightsStatus?: RightsStatus;
};

export type ArchiveMetadata = Record<string, unknown> & {
  commonsTitle?: string;
  visualMode?: VisualMode;
  mockup?: MockupSettings;
};

export type ArchiveItem = {
  id: string;
  kind: ArchiveKind;
  yearStart: number;
  yearEnd?: number | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  variant?: string | null;
  manufacturer?: string | null;
  sponsor?: string | null;
  colors?: string[];
  sourceUrl?: string | null;
  published?: boolean;
  metadata?: ArchiveMetadata;
  media?: MediaAsset[];
};

export type TimelineRecord = {
  id: string;
  kind: ArchiveKind;
  yearStart: number;
  yearEnd?: number | null;
  title: string;
  published: boolean;
};

export type Relation = {
  id: string;
  fromId: string;
  toId: string;
  type: string;
  label?: string | null;
};

export type DesignSettings = {
  background: string;
  surface: string;
  ink: string;
  accent: string;
  accent2: string;
  radius: number;
  motion: 'reduced' | 'balanced' | 'expressive';
  texture: 'none' | 'grain' | 'grid';
  displayFont: string;
  bodyFont: string;
};
