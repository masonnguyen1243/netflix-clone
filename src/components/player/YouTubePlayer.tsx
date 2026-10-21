"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function extractVideoId(videoUrl: string): string {
  try {
    const url = new URL(videoUrl);
    const v = url.searchParams.get("v");
    if (v) return v;
  } catch {
    // not a URL, use as-is
  }
  return videoUrl;
}

interface Props {
  videoId: string;
  initialSeconds: number;
  onTimeUpdate: (s: number) => void;
}

export default function YouTubePlayer({ videoId, initialSeconds, onTimeUpdate }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const resolvedId = extractVideoId(videoId);

    function initPlayer() {
      if (!divRef.current) return;
      playerRef.current = new window.YT.Player(divRef.current, {
        videoId: resolvedId,
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1 },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (e: any) => {
            e.target.seekTo(initialSeconds ?? 0, true);
            intervalRef.current = setInterval(() => {
              onTimeUpdate(Math.floor(e.target.getCurrentTime()));
            }, 1000);
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existing = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      clearInterval(intervalRef.current);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
    // initialSeconds and onTimeUpdate intentionally omitted — only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return <div ref={divRef} className="w-full h-full" />;
}
