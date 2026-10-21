import { describe, it, expect } from "vitest";
import { extractVideoId } from "./YouTubePlayer";

describe("extractVideoId", () => {
  it("trích xuất video ID từ full YouTube URL có ?v= param", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=abc123")).toBe("abc123");
  });

  it("trả về nguyên chuỗi khi đầu vào là bare video ID", () => {
    expect(extractVideoId("abc123")).toBe("abc123");
  });

  it("trả về chuỗi rỗng khi URL không có v param", () => {
    expect(extractVideoId("https://www.youtube.com/watch")).toBe("");
  });

  it("trả về chuỗi rỗng khi videoUrl là empty string", () => {
    expect(extractVideoId("")).toBe("");
  });

  it("trả về chuỗi rỗng khi URL có ?v= nhưng value rỗng", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=")).toBe("");
  });
});
