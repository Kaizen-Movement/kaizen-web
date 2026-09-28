"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SealMark } from "./SealMark";
import { formatPrice, type Product } from "@/lib/types";

const MAX_TILT_DEG = 5;

export function ProductCard({ product, coverUrl }: { product: Product; coverUrl: string | null }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [transform, setTransform] = useState("");
  const [glow, setGlow] = useState({ x: 50, y: 50, active: false });

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTransform(`perspective(900px) rotateX(${(0.5-py)*MAX_TILT_DEG*2}deg) rotateY(${(px-0.5)*MAX_TILT_DEG*2}deg) translateZ(4px)`);
    setGlow({x:px*100,y:py*100,active:true});
  }

  function handleMouseLeave() {
    setTransform("");
    setGlow((g) => ({...g,active:false}));
  }

  return (
    <Link
      ref={cardRef}
      href={`/products/${product.slug}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform }}
      className="depth-card group relative block overflow-hidden rounded-2xl transition-transform duration-300 ease-out will-change-transform"
    >
      <div className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{opacity:glow.active?1:0,background:`radial-gradient(260px circle at ${glow.x}% ${glow.y}%, rgba(199,185,234,.16), transparent 68%)`}} />
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-panel">
        {coverUrl ? <Image src={coverUrl} alt={product.title} fill sizes="(min-width:1024px) 25vw,(min-width:640px) 33vw,50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center"><SealMark className="h-16 w-16 text-gold/25" /></div>}
        {product.is_recommended && <span className="glass-panel absolute left-3 top-3 rounded-full border-gold/40 px-2.5 py-1 font-mono text-[9px] uppercase tracking-eyebrow text-gold">Recommended</span>}
      </div>
      <div className="relative p-4 sm:p-5">
        <p className="font-display text-base text-bone">{product.title}</p>
        {product.short_description && <p className="mt-1 line-clamp-1 text-xs text-bone/45">{product.short_description}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-mono text-sm text-gold">{formatPrice(product.price_cents)}</span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-eyebrow text-bone/40 transition group-hover:border-lavender/30 group-hover:text-lavender">View →</span>
        </div>
      </div>
    </Link>
  );
}
