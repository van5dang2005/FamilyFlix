import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useContentDetail } from "../hooks/useContent";

// ─── YouTube URL Parser ───────────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function buildEmbedUrl(videoId: string, options: EmbedOptions): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    origin: window.location.origin,
  });

  if (options.autoplay) params.set("autoplay", "1");
  if (options.muted) params.set("mute", "1");
  if (options.loop) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }
  if (options.startTime) params.set("start", String(options.startTime));

  const host = options.noCookie
    ? "https://www.youtube-nocookie.com"
    : "https://www.youtube.com";

  return `${host}/embed/${videoId}?${params.toString()}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmbedOptions {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  startTime?: number;
  noCookie?: boolean;
}

interface VideoPlayerProps {
  /** Mặc định sẽ lấy tự động từ URL params qua useContentDetail nếu không truyền prop này */
  url?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
  title?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  startTime?: number;
  noCookie?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VideoPlayer({
  url = "",
  aspectRatio = "16/9",
  title: initialTitle = "YouTube Video",
  autoplay = false,
  muted = false,
  loop = false,
  startTime,
  noCookie = false,
  className = "",
}: VideoPlayerProps) {
  // Lấy id từ URL phục vụ cho việc gọi API qua hook custom
  const { id } = useParams<{ id: string }>();
  const { content, loading, error: apiError } = useContentDetail(id);

  const [inputUrl, setInputUrl] = useState(url);
  const [activeUrl, setActiveUrl] = useState(url);
  const [customError, setCustomError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Đồng bộ hóa dữ liệu khi API tải thành công nội dung video
  useEffect(() => {
    if (content?.mediaUrl) {
      setInputUrl(content.mediaUrl);
      setActiveUrl(content.mediaUrl);
      setIsLoaded(false); // Reset trạng thái để hiện màn hình chờ khi đổi video mới
    }
  }, [content]);

  // Đồng bộ hóa nếu có sự thay đổi từ props bên ngoài truyền vào
  useEffect(() => {
    if (url) {
      setInputUrl(url);
      setActiveUrl(url);
      setIsLoaded(false);
    }
  }, [url]);

  const videoId = extractYouTubeId(activeUrl);
  const embedUrl = videoId
    ? buildEmbedUrl(videoId, { autoplay, muted, loop, startTime, noCookie })
    : null;

  // Tổng hợp lỗi từ cả hệ thống (API) lẫn lỗi nhập tay của người dùng
  const displayError = customError || apiError;
  const currentTitle = content?.title || initialTitle;

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setCustomError(null);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setCustomError("Vui lòng nhập URL YouTube.");
      return;
    }
    const id = extractYouTubeId(trimmed);
    if (!id) {
      setCustomError("URL không hợp lệ. Hãy thử: https://youtu.be/xxx hoặc https://youtube.com/watch?v=xxx");
      return;
    }
    setCustomError(null);
    setIsLoaded(false);
    setActiveUrl(trimmed);
  }, [inputUrl]);

  const paddingMap: Record<string, string> = {
    "16/9": "56.25%",
    "4/3": "75%",
    "1/1": "100%",
  };
  const paddingTop = paddingMap[aspectRatio] ?? "56.25%";

  // Giao diện hiển thị trạng thái chờ trong khi hook đang gọi API lấy dữ liệu ban đầu
  if (loading && !activeUrl) {
    return (
      <div style={{ maxWidth: 860, margin: "2rem auto", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #333", borderTopColor: "#ff0000", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      className={`vp-root ${className}`}
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        maxWidth: 860,
        margin: "0 auto",
        padding: "1.5rem",
        background: "#0f0f0f",
        borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        color: "#e8e8e8",
      }}
    >
      {/* URL Input bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Dán link YouTube vào đây… (youtu.be, watch?v=, /shorts/…)"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1.5px solid #333",
            background: "#1a1a1a",
            color: "#fff",
            fontSize: 14,
            outline: "none",
            transition: "border-color .2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#ff0000")}
          onBlur={(e) => (e.target.style.borderColor = "#333")}
        />
        <button
          onClick={handleSubmit}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "#ff0000",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "#cc0000")}
          onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "#ff0000")}
        >
          ▶ Phát
        </button>
      </div>

      {/* Error Display */}
      {displayError && (
        <p style={{
          background: "#2a0000",
          border: "1px solid #ff4444",
          borderRadius: 8,
          padding: "8px 14px",
          color: "#ff8888",
          fontSize: 13,
          marginBottom: "1rem",
        }}>
          ⚠️ {displayError}
        </p>
      )}

      {/* Player Container */}
      <div
        style={{
          position: "relative",
          paddingTop,
          borderRadius: 12,
          overflow: "hidden",
          background: "#000",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}
      >
        {!embedUrl && !displayError && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#555", gap: 12,
          }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="16" fill="#1a1a1a" />
              <path d="M26 20l20 12-20 12V20z" fill="#333" />
            </svg>
            <span style={{ fontSize: 14 }}>Nhập link YouTube để bắt đầu</span>
          </div>
        )}

        {embedUrl && (
          <>
            {!isLoaded && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#000",
                zIndex: 2,
              }}>
                <div style={{
                  width: 40, height: 40,
                  border: "3px solid #333",
                  borderTopColor: "#ff0000",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={currentTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={handleLoad}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: "none",
                opacity: isLoaded ? 1 : 0,
                transition: "opacity .4s",
              }}
            />
          </>
        )}
      </div>

      {/* Video ID badge & Metadata Details */}
      {videoId && (
        <div style={{
          marginTop: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "#666",
          }}>
            <span style={{
              background: "#ff000022",
              border: "1px solid #ff000055",
              color: "#ff6666",
              padding: "2px 8px",
              borderRadius: 6,
              fontFamily: "monospace",
            }}>
              ID: {videoId}
            </span>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#666", textDecoration: "none" }}
            >
              ↗ Mở trên YouTube
            </a>
          </div>

          {/* Đổ thông tin chi tiết động của video từ CMS xuống bên dưới */}
          {content && (
            <div style={{
              marginTop: "0.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid #1f1f1f"
            }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#fff" }}>
                {content.title}
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#aaaaaa", margin: "0 0 1rem 0", lineHeight: "1.5" }}>
                {content.description}
              </p>
              <div style={{ display: "flex", gap: 8, fontSize: "0.75rem", color: "#666" }}>
                {content.category && (
                  <span style={{ background: "#222", padding: "4px 10px", borderRadius: 12, color: "#aaa" }}>
                    {content.category}
                  </span>
                )}
                {content.duration != null && (
                  <span style={{ background: "#222", padding: "4px 10px", borderRadius: 12, color: "#aaa" }}>
                    {Math.floor(content.duration / 60)}m {content.duration % 60}s
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .vp-root * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}