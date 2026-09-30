'use client';

import type { ArchiveItem } from '@/lib/types';

export function JerseyVisual({ item, large=false }: { item: ArchiveItem; large?: boolean }) {
  const colors = item.colors?.length ? item.colors : ['#57bfee','#111216','#f7f7f7'];
  const image = item.media?.[0]?.thumbUrl || item.media?.[0]?.url;
  if (image) {
    return <div className={`jersey-media ${large ? 'is-large' : ''}`}><img src={image} alt={item.media?.[0]?.alt || item.title} /></div>;
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
          <filter id={`shadow-${item.id}`} x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="20" floodOpacity=".28"/></filter>
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
