import React from 'react';

export const BRAND_MARK_SRC = '/logo.svg';
export const BRAND_NAME = 'LamarKerja AI';

/**
 * Single brand mark used across the app.
 * Artwork: public/logo.svg (paper plane + growth path + AI spark).
 * Wordmark matches the navbar: "Lamar" + gradient "Kerja AI".
 */
export default function BrandLogo({
  size = 38,
  showWordmark = true,
  wordmarkSize,
  glow = true,
  alt = BRAND_NAME,
  style,
}) {
  const radius = Math.max(6, Math.round(size * 11 / 38));
  const typeSize = wordmarkSize || (size >= 36 ? '1.15rem' : size >= 28 ? '1rem' : '0.88rem');

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size >= 32 ? '10px' : '8px',
        flexShrink: 0,
        ...style
      }}
    >
      <img
        src={BRAND_MARK_SRC}
        alt={showWordmark ? '' : alt}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: `${radius}px`,
          display: 'block',
          boxShadow: glow ? '0 0 16px rgba(14, 165, 233, 0.45)' : 'none'
        }}
      />
      {showWordmark && (
        <span
          className="brand-wordmark"
          style={{
            fontSize: typeSize,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#F8FAFC',
            lineHeight: 1.15
          }}
        >
          Lamar<span className="gradient-text">Kerja AI</span>
        </span>
      )}
    </div>
  );
}
