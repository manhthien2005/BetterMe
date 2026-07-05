# Dashboard Weather And Spotify Hero Design

## Goal

Replace the configurable Personal Widgets section with two fixed dashboard hero banners: a motion-rich Weather Hero and an official Spotify Embed Hero.

## Current Context

The current dashboard renders a `PersonalWidgets` section inside `src/components/dashboard/dashboard-client.tsx`. It includes Weather, Spotify, an add-widget button, and an optional Focus widget. The requested change removes the configurable widget behavior and makes Weather plus Spotify first-class fixed dashboard sections.

## Approved Direction

Use a custom visual shell for both banners, but make Spotify playback use the official Spotify embed iframe. This keeps the dashboard branded and polished while letting Spotify handle playback, login state, and music availability.

Spotify references:

- Official Embed overview: `https://developer.spotify.com/documentation/embeds`
- Embed creation guide: `https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed`
- Spotify iFrame API guide for future controls: `https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api`

Default Spotify content:

- `Deep Focus` playlist embed: `https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ`

## Weather Hero

The Weather Hero replaces the compact Weather widget with a larger planning banner.

Required content:

- Location: Bangkok
- Temperature: 31 C
- Condition: Clear evening
- Feels-like temperature
- Humidity
- Wind
- Rain chance
- UV index or air-quality style planning signal
- A short planning sentence, for example "Good window for a light walk after focus work."

Visual behavior:

- The card uses a moving GIF-like background effect implemented with CSS gradients and keyframe animation, so no network asset is required.
- A large weather emoji is displayed as the emotional anchor.
- Emoji animation changes by weather type:
  - Clear: slow float and subtle glow
  - Rain: vertical drift plus raindrop streaks
  - Cloudy: slow horizontal drift
  - Storm: quick pulse/flash treatment
- Initial implementation can hardcode the clear-weather variant, with a typed helper ready for future states.

## Spotify Hero

The Spotify Hero replaces the compact Spotify widget with a banner that feels intentionally Spotify-native.

Required content:

- Dark Spotify-style shell with green accents.
- Short heading such as "Focus session".
- Playlist context and current purpose, not a fake local playback state.
- Official Spotify iframe embed using the default Deep Focus playlist.
- A fallback link to open the playlist in Spotify if the iframe fails or the user wants the full app.

Implementation constraints:

- Use a plain iframe embed first, not the Spotify iFrame API.
- Do not fake playback controls outside Spotify. Playback controls belong inside the official embed.
- Keep the iframe responsive and non-overflowing on mobile.
- Use `loading="lazy"`, a clear title, and Spotify's recommended iframe allow attributes for media playback.

## Layout

Desktop dashboard:

- Weather and Spotify become two fixed banner sections in the existing 24-column grid.
- Weather should occupy a medium/wide section, Spotify should occupy a complementary medium/wide section.
- They should sit where Personal Widgets currently sits in the information flow, without pushing Today's Habits below the fold more than necessary.

Mobile dashboard:

- Weather and Spotify stack as full-width banners.
- The iframe height remains useful without causing horizontal overflow.
- Text and metrics wrap cleanly; no labels overlap the iframe.

## Accessibility

- The weather emoji has an accessible label.
- Animated decorative background layers are `aria-hidden`.
- Weather metrics are real text, not image-only content.
- Spotify iframe has a descriptive title.
- External Spotify link has visible text and an accessible name.
- Respect `prefers-reduced-motion` by disabling non-essential weather background and emoji animation.

## Tests

Update dashboard route/component tests to prove:

- "Personal Widgets" no longer renders.
- The add-widget button no longer renders.
- Weather Hero renders Bangkok, temperature, and weather planning metrics.
- Spotify Hero renders the official iframe with the expected embed URL.
- The optional Focus widget no longer appears.

Run:

- `pnpm run test -- src/app/dashboard/page.test.tsx`
- `pnpm run typecheck`

## Out Of Scope

- Real Weather API integration.
- Spotify OAuth or Web Playback SDK.
- Programmatic Spotify play/pause controls outside the iframe.
- User-configurable widget ordering.
- Persisted widget settings changes.
