import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import YouTubePlayer from "./YouTubePlayer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

let latestOnReadyCb: AnyFn | null = null;
let seekTo: ReturnType<typeof vi.fn>;
let getCurrentTime: ReturnType<typeof vi.fn>;
let destroy: ReturnType<typeof vi.fn>;

function makeYTPlayerConstructor() {
  seekTo = vi.fn();
  getCurrentTime = vi.fn().mockReturnValue(0);
  destroy = vi.fn();
  latestOnReadyCb = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function YTPlayer(this: any, _el: unknown, opts: any) {
    latestOnReadyCb = opts?.events?.onReady ?? null;
    this.seekTo = seekTo;
    this.getCurrentTime = getCurrentTime;
    this.destroy = destroy;
  }

  return YTPlayer;
}

function triggerReady() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  latestOnReadyCb?.({ target: { seekTo, getCurrentTime, destroy } } as any);
}

describe("YouTubePlayer component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).YT = { Player: makeYTPlayerConstructor() };
  });

  afterEach(() => {
    vi.useRealTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).YT;
    vi.restoreAllMocks();
  });

  it("calls seekTo(initialSeconds) when onReady fires", () => {
    render(
      <YouTubePlayer videoId="abc123" initialSeconds={90} onTimeUpdate={() => {}} />
    );

    triggerReady();

    expect(seekTo).toHaveBeenCalledWith(90, true);
  });

  it("calls onTimeUpdate via interval after onReady", () => {
    const onTimeUpdate = vi.fn();
    getCurrentTime = vi.fn().mockReturnValue(42.7);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).YT = { Player: makeYTPlayerConstructor() };
    getCurrentTime.mockReturnValue(42.7);

    render(
      <YouTubePlayer videoId="abc123" initialSeconds={0} onTimeUpdate={onTimeUpdate} />
    );

    triggerReady();
    act(() => { vi.advanceTimersByTime(1000); });

    expect(onTimeUpdate).toHaveBeenCalledWith(42);
  });

  it("calls player.destroy() on unmount", () => {
    const { unmount } = render(
      <YouTubePlayer videoId="abc123" initialSeconds={0} onTimeUpdate={() => {}} />
    );

    triggerReady();
    unmount();

    expect(destroy).toHaveBeenCalledOnce();
  });

  it("does not create player when videoId is empty", () => {
    const PlayerSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).YT = { Player: PlayerSpy };

    render(
      <YouTubePlayer videoId="" initialSeconds={0} onTimeUpdate={() => {}} />
    );

    expect(PlayerSpy).not.toHaveBeenCalled();
  });

  it("injects YT script when window.YT is absent", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).YT;
    const appendChildSpy = vi.spyOn(document.head, "appendChild");

    render(
      <YouTubePlayer videoId="abc123" initialSeconds={0} onTimeUpdate={() => {}} />
    );

    const injected = appendChildSpy.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ([el]: any[]) => (el as HTMLScriptElement).src?.includes("iframe_api")
    );
    expect(injected).toBeTruthy();
  });
});
