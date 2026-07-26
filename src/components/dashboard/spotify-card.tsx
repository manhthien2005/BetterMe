"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

import {
  DEFAULT_SPOTIFY_PLAYLIST_URL,
  loadWidgetSettings,
  parseSpotifyPlaylistId,
  saveWidgetSettings,
  spotifyEmbedUrl,
  spotifyPlaylistUrl
} from "@/components/dashboard/widget-settings";

/**
 * Nhạc tập trung — playlist Spotify do người dùng tự chọn (dán link bất kỳ),
 * lưu local trong betterme.widgets.v1; mặc định là Deep Focus.
 */
export function SpotifyCard() {
  const [playlistId, setPlaylistId] = useState<string>(
    () => parseSpotifyPlaylistId(DEFAULT_SPOTIFY_PLAYLIST_URL) ?? ""
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadWidgetSettings().spotifyPlaylistUrl;
    const storedId = stored ? parseSpotifyPlaylistId(stored) : null;

    if (storedId) setPlaylistId(storedId);
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = parseSpotifyPlaylistId(draft);

    if (!id) {
      setNote("Link chưa đúng — dán link dạng open.spotify.com/playlist/… nhé");
      return;
    }

    setPlaylistId(id);
    saveWidgetSettings({ ...loadWidgetSettings(), spotifyPlaylistUrl: spotifyPlaylistUrl(id) });
    setEditing(false);
    setDraft("");
    setNote(null);
  }

  return (
    <section className="card-lift overflow-hidden rounded-lg bg-[#15171A] p-4 text-white shadow-mochi ring-1 ring-white/10 sm:p-5">
      <div className="grid gap-4">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold uppercase tracking-wide text-[#1db954]">
                Spotify
              </p>
              <button
                aria-label="Đổi playlist"
                className="squishy flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760]"
                onClick={() => {
                  setEditing((current) => !current);
                  setNote(null);
                }}
                type="button"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">
              Nhạc tập trung
            </h2>
            <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-white/70">
              Playlist của Sếp cho giờ code và những phút ôn bài yên tĩnh — bấm ✏️ để dán
              link playlist khác.
            </p>
          </div>

          {editing ? (
            <form className="grid gap-2" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="spotify-url-input">
                Link playlist Spotify
              </label>
              <input
                autoFocus
                className="h-10 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760]"
                id="spotify-url-input"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="https://open.spotify.com/playlist/…"
                value={draft}
              />
              <div className="flex items-center gap-2">
                <button
                  className="squishy rounded-full bg-[#1db954] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#1ed760] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15171A]"
                  type="submit"
                >
                  Dùng playlist này
                </button>
                <button
                  className="squishy rounded-full px-3 py-2 text-sm font-bold text-white/60 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760]"
                  onClick={() => setEditing(false)}
                  type="button"
                >
                  Thôi
                </button>
              </div>
              {note ? <p className="text-xs font-bold text-white/70">{note}</p> : null}
            </form>
          ) : (
            <a
              className="squishy inline-flex w-fit items-center rounded-full bg-[#1db954] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#1ed760] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15171A]"
              href={spotifyPlaylistUrl(playlistId)}
              rel="noreferrer"
              target="_blank"
            >
              Mở trong Spotify
            </a>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
          <iframe
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block h-[352px] w-full border-0"
            loading="lazy"
            src={spotifyEmbedUrl(playlistId)}
            title="Playlist Spotify của Sếp"
          />
        </div>
      </div>
    </section>
  );
}
