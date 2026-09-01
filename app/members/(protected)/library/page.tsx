"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";

interface LibraryFile {
  id: string;
  file_name: string;
  r2_key: string;
  file_type: string;
}

interface LibraryItem {
  id: string;
  product_id: string;
  title: string;
  cover_url: string | null;
  access_type: string;
  files: LibraryFile[];
  progress?: {
    file_id: string;
    position: number;
    duration: number;
    completed: boolean;
  }[];
}

export default function MemberLibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<{
    item: LibraryItem;
    file: LibraryFile;
    streamUrl: string;
  } | null>(null);

  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetch("/api/members/library")
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const playTrack = useCallback(async (item: LibraryItem, file: LibraryFile) => {
    // Get signed stream URL
    const res = await fetch(`/api/members/stream?fileId=${file.id}`);
    const data = await res.json();
    if (!data.url) return;

    setActiveTrack({ item, file, streamUrl: data.url });
    setIsPlaying(true);
    setCurrentTime(0);

    // Check for saved progress
    const saved = item.progress?.find((p) => p.file_id === file.id);
    if (saved && saved.position > 0 && !saved.completed) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = saved.position;
        }
      }, 300);
    }
  }, []);

  // Save progress periodically
  const saveProgress = useCallback(() => {
    if (!activeTrack || !audioRef.current) return;
    const audio = audioRef.current;
    if (audio.duration && audio.currentTime > 0) {
      fetch("/api/members/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    progressTimer.current = setInterval(saveProgress, 15000);
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      saveProgress();
    };
  }, [saveProgress]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      saveProgress();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-bone/30">Loading your library...</p>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <p className="eyebrow mb-2">Your Collection</p>
      <h1 className="font-display text-3xl text-bone">My Library</h1>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-charcoal">
            <svg className="h-8 w-8 text-bone/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <p className="mt-6 text-lg text-bone/50">Your library is empty</p>
          <p className="mt-2 text-sm text-bone/30">
            Purchase subliminals from the store to access them here.
          </p>
          <a
            href="/"
            className="mt-6 border border-gold px-6 py-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-gold transition-colors hover:bg-gold hover:text-void"
          >
            Browse Store
          </a>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group border border-white/10 bg-charcoal transition-colors hover:border-gold/30"
            >
              {/* Cover */}
              <div className="relative aspect-square overflow-hidden bg-panel">
                {item.cover_url ? (
                  <Image
                    src={item.cover_url}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg className="h-12 w-12 text-bone/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
                {/* Play overlay */}
                {item.files.length > 0 && (
                  <button
                    onClick={() => playTrack(item, item.files[0])}
                    className="absolute inset-0 flex items-center justify-center bg-void/40 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold">
                      <svg className="ml-1 h-6 w-6 text-void" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-display text-sm text-bone">{item.title}</h3>
                <p className="mt-1 font-mono text-[10px] uppercase text-bone/30">
                  {item.files.length} {item.files.length === 1 ? "track" : "tracks"} · {item.access_type}
                </p>

                {/* Track list */}
                {item.files.length > 1 && (
                  <div className="mt-3 space-y-1">
                    {item.files.map((f, i) => {
                      const prog = item.progress?.find((p) => p.file_id === f.id);
                      const isActive = activeTrack?.file.id === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => playTrack(item, f)}
                          className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                            isActive ? "bg-gold/10 text-gold" : "hover:bg-white/5 text-bone/50"
                          }`}
                        >
                          <span className="w-4 font-mono text-[10px]">{i + 1}</span>
                          <span className="flex-1 truncate text-[12px]">{f.file_name.replace(/\.[^.]+$/, "")}</span>
                          {prog?.completed && (
                            <span className="text-[10px] text-emerald-400">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fixed bottom audio player */}
      {activeTrack && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-charcoal/95 backdrop-blur-md">
          <audio
            ref={audioRef}
            src={activeTrack.streamUrl}
            autoPlay
            onTimeUpdate={() => {
              if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
            }}
            onLoadedMetadata={() => {
              if (audioRef.current) setDuration(audioRef.current.duration);
            }}
            onEnded={() => {
              setIsPlaying(false);
              saveProgress();
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
            {/* Track info */}
            <div className="flex min-w-0 items-center gap-3">
              {activeTrack.item.cover_url && (
                <Image
                  src={activeTrack.item.cover_url}
                  alt=""
                  width={44}
                  height={44}
                  className="rounded"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm text-bone">
                  {activeTrack.file.file_name.replace(/\.[^.]+$/, "")}
                </p>
                <p className="truncate font-mono text-[10px] text-bone/40">
                  {activeTrack.item.title}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-1 flex-col items-center gap-1">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-void transition-transform hover:scale-105">
                  {isPlaying ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex w-full max-w-md items-center gap-2">
                <span className="w-10 text-right font-mono text-[10px] text-bone/40">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={seek}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-gold [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
                />
                <span className="w-10 font-mono text-[10px] text-bone/40">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => {
                saveProgress();
                setActiveTrack(null);
                setIsPlaying(false);
                if (audioRef.current) audioRef.current.pause();
              }}
              className="text-bone/30 hover:text-bone"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
