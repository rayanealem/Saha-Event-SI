'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

type Props = Omit<ImageProps, 'onError'> & {
  fallbackText?: string;
};

export default function ImageWithFallback({ fallbackText, alt, style, ...props }: Props) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !props.src) {
    const initial = (fallbackText || alt || '?').charAt(0).toUpperCase();
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #F3EFF2, #E8E0E6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="64" height="64" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#D4C3D0" />
          <text x="50" y="55" textAnchor="middle" dominantBaseline="middle"
            fontSize="36" fontWeight="700" fill="#714B67" fontFamily="inherit">
            {initial}
          </text>
        </svg>
      </div>
    );
  }

  return <Image {...props} alt={alt} style={style} onError={() => setHasError(true)} />;
}
