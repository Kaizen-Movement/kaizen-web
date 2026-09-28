"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";

interface LibraryFile { id: string; file_name: string; r2_key: string; file_type: string; }
interface LibraryItem {
  id: string; product_id: string; title: string; cover_url: string | null; access_type: string;
  files: LibraryFile[];
  progress?: { file_id: string; position: number; duration: number; completed: boolean }[];
}

export default function MemberLibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<{item: LibraryItem; file: LibraryFile; streamUrl: string} | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setInterval>>();

  const loadLibrary = useCallback(() => {
    setLoading(true);
    fetch("/api/members/library", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  const playTrack = useCallback(async (item: LibraryItem, file: LibraryFile) => {
    const res = await fetch("/api/members/stream?fileId=" + encodeURIComponent(file.id), { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.url) return;
    setActiveTrack({ item, file, streamUrl: data.url });
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    const saved = item.progress?.find((p) => p.file_id === file.id);
    if (saved && saved.position > 0 && !saved.completed) {
      setTimeout(() => { if (audioRef.current) audioRef.current.currentTime = saved.position; }, 350);
    }
  }, []);

  const saveProgress = useCallback(() => {
    if (!activeTrack || !audioRef.current) return;
    const audio = audioRef.current;
    if (audio.duration && Number.isFinite(audio.duration) && audio.currentTime > 0) {
      fetch("/api/members/progress", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          productId: activeTrack.item.product_id,
          fileId: activeTrack.file.id,
          position: Math.floor(audio.currentTime),
          duration: Math.floor(audio.duration),
          completed: audio.currentTime >= audio.duration - 1,
        }),
      }).catch(() => {});
    }
  }, [activeTrack]);

  useEffect(() => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(saveProgress, 15000);
    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, [saveProgress]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) audioRef.current.play().catch(() => {});
    else { audioRef.current.pause(); saveProgress(); }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const formatTime = (s: number) => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    return m + ":" + Math.floor(s % 60).toString().padStart(2, "0");
  };

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><p className="font-mono text-[11px] uppercase tracking-eyebrow text-bone/30">Loading your library...</p></div>;
  }

  return (
    <div className="pb-36">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow mb-2">Private Vault</p><h1 className="font-display text-3xl text-bone sm:text-4xl">My Library</h1><p className="mt-2 text-sm text-bone/45">{items.length} {items.length === 1 ? "release" : "releases"} available to you.</p></div>
        <button onClick={loadLibrary} className="rounded-full border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-bone/50 transition hover:border-gold/40 hover:text-gold">Refresh</button>
      </div>

      {items.length === 0 ? (
        <div className="platinum-surface mt-10 flex min-h-[360px] flex-col items-center justify-center rounded-3xl p-8 text-center">
          <SealMark className="h-16 w-16 text-gold/20" />
          <p className="mt-6 text-lg text-bone/50">Your private vault is empty.</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-bone/30">Purchases and member releases appear here when access has been granted to your account.</p>
          <a href="/" className="btn-3d mt-7 rounded-full px-6 py-3 font-mono text-[10px] uppercase tracking-eyebrow">Browse Store</a>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="depth-card overflow-hidden rounded-2xl">
              <div className="group relative aspect-square overflow-hidden bg-panel">
                {item.cover_url ? <Image src={item.cover_url} alt={item.title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" /> : <div className="flex h-full items-center justify-center"><SealMark className="h-14 w-14 text-gold/20" /></div>}
                {item.files.length > 0 && <button aria-label={"Play " + item.title} onClick={() => playTrack(item,item.files[0])} className="absolute inset-0 flex items-center justify-center bg-void/50 opacity-0 transition group-hover:opacity-100 focus:opacity-100"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-void shadow-depth-lg"><svg className="ml-1 h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></button>}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-base text-bone">{item.title}</h2><p className="mt-1 font-mono text-[9px] uppercase tracking-eyebrow text-bone/30">{item.files.length} {item.files.length===1?"track":"tracks"} · {item.access_type}</p></div><span className="rounded-full border border-lavender/25 bg-lavender/10 px-2 py-1 font-mono text-[8px] uppercase tracking-eyebrow text-lavender">Private</span></div>
                {item.files.length > 1 && <div className="mt-4 space-y-1">{item.files.map((f,i) => { const prog=item.progress?.find(p=>p.file_id===f.id); const active=activeTrack?.file.id===f.id; return <button key={f.id} onClick={()=>playTrack(item,f)} className={"flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition " + (active?"bg-lavender/10 text-lavender":"text-bone/50 hover:bg-white/5 hover:text-bone")}><span className="w-4 font-mono text-[9px]">{i+1}</span><span className="flex-1 truncate text-xs">{f.file_name.replace(/\.[^.]+$/,"")}</span>{prog?.completed&&<span className="text-[10px] text-lavender">✓</span>}</button>; })}</div>}
              </div>
            </article>
          ))}
        </div>
      )}

      {activeTrack && <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-charcoal/95 shadow-depth-lg backdrop-blur-xl">
        <audio ref={audioRef} src={activeTrack.streamUrl} autoPlay onTimeUpdate={()=>audioRef.current&&setCurrentTime(audioRef.current.currentTime)} onLoadedMetadata={()=>audioRef.current&&setDuration(audioRef.current.duration)} onEnded={()=>{setIsPlaying(false);saveProgress();}} onPlay={()=>setIsPlaying(true)} onPause={()=>setIsPlaying(false)} />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-6">
          {activeTrack.item.cover_url && <Image src={activeTrack.item.cover_url} alt="" width={44} height={44} className="hidden rounded-lg object-cover sm:block" />}
          <div className="min-w-0 w-[calc(100%-52px)] sm:w-40"><p className="truncate text-xs text-bone">{activeTrack.file.file_name.replace(/\.[^.]+$/,"")}</p><p className="truncate font-mono text-[9px] uppercase tracking-eyebrow text-bone/30">{activeTrack.item.title}</p></div>
          <button aria-label={isPlaying?"Pause":"Play"} onClick={togglePlay} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-void">{isPlaying?<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>:<svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}</button>
          <span className="font-mono text-[9px] text-bone/40">{formatTime(currentTime)}</span>
          <input aria-label="Playback position" type="range" min={0} max={duration||0} value={currentTime} onChange={seek} className="min-w-0 flex-1 accent-lavender" />
          <span className="font-mono text-[9px] text-bone/40">{formatTime(duration)}</span>
          <button aria-label="Close player" onClick={()=>{saveProgress();setActiveTrack(null);setIsPlaying(false);audioRef.current?.pause();}} className="rounded-full p-2 text-bone/40 transition hover:bg-white/5 hover:text-bone">×</button>
        </div>
      </div>}
    </div>
  );
}
