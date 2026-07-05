# Dashboard Weather And Spotify Heroes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the configurable Personal Widgets section with fixed Weather and Spotify hero banners.

**Architecture:** Keep the change local to the dashboard route. Add focused static read models for the Weather and Spotify banners inside `dashboard-client.tsx`, render them through two small components, and add only the CSS keyframes needed for the weather motion.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Spotify playback must use the official Spotify embed iframe.
- Weather data remains static; no real Weather API integration.
- Remove configurable widget behavior, the add-widget button, and optional Focus widget.
- Do not fake Spotify playback controls outside the iframe.
- Keep mobile layout non-overflowing.
- Respect `prefers-reduced-motion` for decorative animation.

---

### Task 1: Dashboard Assertions For Fixed Weather And Spotify Heroes

**Files:**
- Modify: `src/app/dashboard/page.test.tsx`

**Interfaces:**
- Consumes: Rendered `DashboardPage`.
- Produces: Test coverage proving the old Personal Widgets UI is gone and the new fixed heroes render.

- [ ] **Step 1: Write the failing test**

Add expectations inside the existing `"renders the habit dashboard for authenticated users"` test after the section heading assertions:

```tsx
expect(screen.queryByRole("heading", { name: "Personal Widgets" })).toBeNull();
expect(screen.queryByLabelText("Add widget")).toBeNull();
expect(screen.queryByText("Deep work")).toBeNull();

expect(screen.getByRole("heading", { name: "Bangkok weather" })).toBeTruthy();
expect(screen.getByText("31 C")).toBeTruthy();
expect(screen.getByText("Feels like 34 C")).toBeTruthy();
expect(screen.getByText("Humidity")).toBeTruthy();
expect(screen.getByText("Wind")).toBeTruthy();
expect(screen.getByText("Rain")).toBeTruthy();

expect(screen.getByRole("heading", { name: "Focus session" })).toBeTruthy();
const spotifyFrame = screen.getByTitle("Spotify Deep Focus playlist");
expect(spotifyFrame.getAttribute("src")).toContain(
  "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ"
);
expect(
  screen.getByRole("link", { name: "Open in Spotify" }).getAttribute("href")
).toBe(
  "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ"
);
```

Remove the old expectation:

```tsx
expect(screen.getByRole("heading", { name: "Personal Widgets" })).toBeTruthy();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm run test -- src/app/dashboard/page.test.tsx`

Expected: FAIL because `Bangkok weather` and `Focus session` do not exist yet, while `Personal Widgets` still renders.

- [ ] **Step 3: Commit test-only red state if the repo workflow requires it**

Do not commit if this project avoids red commits. Continue to Task 2 after confirming the test fails for the expected reason.

### Task 2: Replace Personal Widgets With Weather And Spotify Heroes

**Files:**
- Modify: `src/components/dashboard/dashboard-client.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/dashboard/page.test.tsx`

**Interfaces:**
- Produces: `WeatherHeroBanner`, `SpotifyHeroBanner`, `DASHBOARD_WEATHER`, `SPOTIFY_PLAYLIST_URL`, and `SPOTIFY_EMBED_URL`.

- [ ] **Step 1: Remove unused widget state and imports**

In `src/components/dashboard/dashboard-client.tsx`, remove `useState` usage for `extraWidgetVisible`, remove the `PersonalWidgets` render, and remove unused icons: `CloudSun`, `Music2`, `Play`, `Plus`, and `Target`.

Keep `useState` imported because dashboard hydration still uses it.

- [ ] **Step 2: Add static banner data**

Add constants near `STORAGE_KEY`:

```tsx
const SPOTIFY_PLAYLIST_URL = "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ";
const SPOTIFY_EMBED_URL =
  "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0";

const DASHBOARD_WEATHER = {
  location: "Bangkok",
  temperature: "31 C",
  condition: "Clear evening",
  feelsLike: "34 C",
  humidity: "68%",
  wind: "9 km/h",
  rainChance: "12%",
  uvIndex: "Low after 5 PM",
  planningNote: "Good window for a light walk after focus work.",
  emoji: "☀️",
  emojiLabel: "Clear weather"
} as const;
```

- [ ] **Step 3: Render fixed hero banners in the grid**

Replace:

```tsx
<PersonalWidgets
  extraWidgetVisible={extraWidgetVisible}
  onAddWidget={() => setExtraWidgetVisible(true)}
/>
```

with:

```tsx
<WeatherHeroBanner />
<SpotifyHeroBanner />
```

- [ ] **Step 4: Implement WeatherHeroBanner**

Replace the `PersonalWidgets` and `WidgetSurface` functions with:

```tsx
function WeatherHeroBanner() {
  const metricItems = [
    ["Feels like", DASHBOARD_WEATHER.feelsLike],
    ["Humidity", DASHBOARD_WEATHER.humidity],
    ["Wind", DASHBOARD_WEATHER.wind],
    ["Rain", DASHBOARD_WEATHER.rainChance],
    ["UV", DASHBOARD_WEATHER.uvIndex]
  ];

  return (
    <section className="weather-hero relative order-5 overflow-hidden rounded-lg p-4 text-white shadow-note sm:p-5 xl:order-4 xl:[grid-column:span_10/span_10]">
      <div aria-hidden="true" className="weather-hero__motion" />
      <div className="relative z-10 flex min-h-[280px] flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-white/75">Weather</p>
            <h2 className="mt-2 text-2xl font-bold tracking-normal text-white">Bangkok weather</h2>
            <p className="mt-1 text-sm font-semibold text-white/75">{DASHBOARD_WEATHER.condition}</p>
          </div>
          <span
            aria-label={DASHBOARD_WEATHER.emojiLabel}
            className="weather-hero__emoji"
            role="img"
          >
            {DASHBOARD_WEATHER.emoji}
          </span>
        </div>

        <div>
          <p className="text-5xl font-bold tracking-normal text-white sm:text-6xl">
            {DASHBOARD_WEATHER.temperature}
          </p>
          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-white/82">
            {DASHBOARD_WEATHER.planningNote}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {metricItems.map(([label, value]) => (
            <div className="rounded-lg border border-white/18 bg-white/14 p-3 backdrop-blur" key={label}>
              <p className="text-xs font-bold uppercase tracking-normal text-white/60">{label}</p>
              <p className="mt-1 text-sm font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Implement SpotifyHeroBanner**

Add after `WeatherHeroBanner`:

```tsx
function SpotifyHeroBanner() {
  return (
    <section className="order-6 overflow-hidden rounded-lg bg-[#121212] p-4 text-white shadow-note sm:p-5 xl:order-5 xl:[grid-column:span_14/span_14]">
      <div className="grid min-h-[280px] gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] lg:items-center">
        <div className="flex h-full flex-col justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#1db954]">Spotify</p>
            <h2 className="mt-2 text-2xl font-bold tracking-normal text-white">Focus session</h2>
            <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-white/64">
              Deep Focus by Spotify, ready for coding blocks and quiet review.
            </p>
          </div>

          <a
            className="inline-flex w-fit items-center rounded-md bg-[#1db954] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#1ed760] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ed760] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
            href={SPOTIFY_PLAYLIST_URL}
            rel="noreferrer"
            target="_blank"
          >
            Open in Spotify
          </a>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl">
          <iframe
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block h-[352px] w-full border-0"
            loading="lazy"
            src={SPOTIFY_EMBED_URL}
            title="Spotify Deep Focus playlist"
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Add weather animation CSS**

Add to `src/app/globals.css` inside `@layer utilities`:

```css
.weather-hero {
  background:
    radial-gradient(circle at 16% 14%, rgb(255 255 255 / 0.36), transparent 24%),
    linear-gradient(135deg, #0f766e 0%, #0ea5e9 48%, #fb7185 100%);
}

.weather-hero__motion {
  position: absolute;
  inset: -34%;
  background:
    radial-gradient(circle at 20% 30%, rgb(255 255 255 / 0.26), transparent 16%),
    radial-gradient(circle at 76% 22%, rgb(254 240 138 / 0.28), transparent 14%),
    radial-gradient(circle at 62% 76%, rgb(125 211 252 / 0.24), transparent 16%);
  animation: weather-drift 12s ease-in-out infinite alternate;
}

.weather-hero__emoji {
  display: inline-flex;
  font-size: 4rem;
  line-height: 1;
  filter: drop-shadow(0 14px 24px rgb(15 23 42 / 0.2));
  animation: weather-emoji-clear 3.6s ease-in-out infinite;
}

@keyframes weather-drift {
  from {
    transform: translate3d(-3%, -2%, 0) rotate(0deg) scale(1);
  }

  to {
    transform: translate3d(3%, 2%, 0) rotate(8deg) scale(1.04);
  }
}

@keyframes weather-emoji-clear {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-8px) scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .weather-hero__motion,
  .weather-hero__emoji {
    animation: none;
  }
}
```

- [ ] **Step 7: Run dashboard test to verify it passes**

Run: `pnpm run test -- src/app/dashboard/page.test.tsx`

Expected: PASS.

- [ ] **Step 8: Run typecheck**

Run: `pnpm run typecheck`

Expected: PASS.

- [ ] **Step 9: Commit implementation**

```bash
git add src/app/dashboard/page.test.tsx src/components/dashboard/dashboard-client.tsx src/app/globals.css docs/superpowers/plans/2026-07-05-dashboard-weather-spotify-heroes.md
git commit -m "feat: add fixed weather and spotify heroes"
```
