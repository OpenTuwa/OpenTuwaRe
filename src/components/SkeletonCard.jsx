import React from 'react';

export default function SkeletonCard({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="w-full h-64 rounded-xl bg-tuwa-gray border border-white/5 mb-5" />
          <div className="h-6 bg-tuwa-gray rounded w-3/4 mb-3" />
          <div className="h-4 bg-tuwa-gray rounded w-full mb-2" />
          <div className="h-4 bg-tuwa-gray rounded w-1/2" />
        </div>
      ))}
    </>
  );
}
