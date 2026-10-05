'use client';

import type { CSSProperties } from 'react';
import type { ArchiveItem, MockupSettings, VisualMode } from '@/lib/types';

const defaultMockup: Required<MockupSettings> = {
  scale: 100,
  x: 50,
  y: 50,
  rotation: 0,
  baseColor: '#101318'
};

function clamp(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function mockupSettings(item: ArchiveItem): Required<MockupSettings> {
  const raw = item.metadata?.mockup || {};
  return {
    scale: clamp(raw.scale, defaultMockup.scale, 40, 320),
    x: clamp(raw.x, defaultMockup.x, 0, 100),
    y: clamp(raw.y, defaultMockup.y, 0, 100),
    rotation: clamp(raw.rotation, defaultMockup.rotation, -30, 30),
    baseColor: typeof raw.baseColor === 'string' && raw.baseColor ? raw.baseColor : defaultMockup.baseColor
  };
}

export function JerseyVisual({ item, large=false, mediaIndex=0 }: { item: ArchiveItem; large?: boolean; mediaIndex?: number }) {
  const colors = item.colors?.length ? item.colors : ['#57bfee','#111216','#f7f7f7'];
  const asset = item.media?.[mediaIndex] || item.media?.[0];
  const image = asset?.thumbUrl || asset?.url;
  const commonsTitle = String(item.metadata?.commonsTitle || '');
  const isCommonsKitBody = /^kit body\b/i.test(item.title) || /\bkit body\b/i.test(commonsTitle);
  const mode = (item.metadata?.visualMode || 'auto') as VisualMode;
  const useMockup = !!image && (mode === 'mockup' || (mode === 'auto' && isCommonsKitBody));

  if (image && useMockup) {
    const mockup = mockupSettings(item);
    const automaticCommons = mode === 'auto' && isCommonsKitBody;
    const artStyle: CSSProperties = automaticCommons
      ? { width:'100%', height:'100%', left:'50%', top:'50%', objectFit:'fill', transform:'translate(-50%,-50%)' }
      : {
          width:`${mockup.scale}%`,
          height:'auto',
          left:`${mockup.x}%`,
          top:`${mockup.y}%`,
          objectFit:'contain',
          transform:`translate(-50%,-50%) rotate(${mockup.rotation}deg)`
        };

    return (
      <div className={`jersey-pattern-wrap ${large ? 'is-large' : ''}`} aria-label={asset?.alt || item.title}>
        <div className="jersey-pattern-shirt" style={{ backgroundColor: mockup.baseColor }} role="img" aria-label={asset?.alt || item.title}>
          <img className="jersey-mockup-art" src={image} alt="" aria-hidden="true" style={artStyle} />
          <span className="jersey-pattern-shade" aria-hidden="true" />
          <span className="jersey-pattern-neck" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (image) {
    return (
      <div className={`jersey-media ${large ? 'is-large' : ''}`}>
        <img src={image} alt={asset?.alt || item.title} />
      </div>
    );
  }

  const stripe = `repeating-linear-gradient(90deg, ${colors[0]} 0 18%, ${colors[1] || '#111'} 18% 34%, ${colors[2] || '#fff'} 34% 48%)`;
  const horizontal = item.yearStart <= 1903;

  return (
    <div className={`jersey-svg-wrap ${large ? 'is-large' : ''}`} aria-label={`Visualização ilustrativa: ${item.title}`}>
      <svg viewBox="0 0 420 470" role="img">
        <defs>
          <clipPath id={`shirt-${item.id}`}>
            <path d="M129 62 78 93 34 153 93 187 112 151 112 415 308 415 308 151 327 187 386 153 342 93 291 62 252 83 168 83Z" />
          </clipPath>
          <filter id={`shadow-${item.id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="18" stdDeviation="20" floodOpacity=".28"/>
          </filter>
        </defs>
        <path d="M129 62 78 93 34 153 93 187 112 151 112 415 308 415 308 151 327 187 386 153 342 93 291 62 252 83 168 83Z" fill="#111" filter={`url(#shadow-${item.id})`} />
        <g clipPath={`url(#shirt-${item.id})`}>
          <rect width="420" height="470" fill={horizontal ? colors[0] : stripe} />
          {horizontal && <rect width="420" height="470" fill={`repeating-linear-gradient(0deg, ${colors[0]} 0 36px, ${colors[1] || '#8b633f'} 36px 72px)`} />}
          <rect x="0" y="80" width="420" height="18" fill="rgba(255,255,255,.26)" />
          <circle cx="210" cy="126" r="33" fill="#0b0c0f" />
          <circle cx="210" cy="126" r="24" fill="#f1f1ed" opacity=".92" />
          <rect x="111" y="280" width="198" height="10" fill="rgba(255,255,255,.55)" opacity={horizontal ? .9 : .1}/>
        </g>
        <path d="M129 62 168 83c9 32 75 32 84 0l39-21" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="6" />
      </svg>
    </div>
  );
}
