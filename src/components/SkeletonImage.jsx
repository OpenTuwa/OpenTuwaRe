'use client';

import React, { useState, useEffect, useRef } from 'react';

const SkeletonImage = ({ src, alt, className = '', ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  // Fix: Check if the image is already complete (cached by browser)
  // to avoid missing the onLoad event entirely.
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  // If no src is provided, show placeholder immediately
  if (!src) {
    return (
       <div className={`relative overflow-hidden bg-tuwa-gray ${className}`}>
          <div className="absolute inset-0 flex items-center justify-center text-tuwa-muted text-xs">No Image</div>
       </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Show skeleton while loading OR if error occurred */}
      {(!isLoaded || error) && (
        <div className="absolute inset-0 bg-tuwa-gray w-full h-full z-0">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}
      
      {!error && (
        <img
          ref={imgRef}
          key={src} 
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 relative z-10 object-cover`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
};

export default SkeletonImage;