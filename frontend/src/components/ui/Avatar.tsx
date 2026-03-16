/**
 * Avatar Atom Component
 * 
 * User avatar with image support and fallback to initials.
 */

import React from 'react';

export interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackText?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallbackText,
}) => {
  // Size styles
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Get initials from alt text or fallbackText
  const getInitials = (text: string): string => {
    if (!text || typeof text !== 'string') return '?';
    const trimmed = text.trim();
    if (!trimmed) return '?';
    const words = trimmed.split(/\s+/);
    if (words.length >= 2 && words[0] && words[1]) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return trimmed.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(fallbackText || alt || '');

  const [imageError, setImageError] = React.useState(false);

  // Debug logging
  React.useEffect(() => {
    if (src) {
      console.log('[Avatar] Loading image:', src);
    }
  }, [src]);

  // Show fallback if no src, image error, or src is null
  const showFallback = !src || imageError;

  return (
    <div
      className={`${sizeStyles[size]} rounded-full overflow-hidden flex items-center justify-center bg-primary-100 text-primary-700 font-semibold`}
      aria-label={alt}
    >
      {showFallback ? (
        <span>{initials}</span>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};
