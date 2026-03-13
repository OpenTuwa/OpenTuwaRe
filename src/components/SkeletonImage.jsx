'use client';

import React, { useState } from 'react';

const SkeletonImage = ({ src, alt, className, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {(!isLoaded || error) && (
        <div className="absolute inset-0 bg-tuwa-gray w-full h-full z-0">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}
      
      {!error && src && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 relative z-10 object-cover`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          {...props}
        />
      )}
    </div>
  );
};

export default SkeletonImage;
