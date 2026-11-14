# Character art sources

- `academy-crest.svg`: original BetterMe book/star shield; shared by the accepted
  female player and Khoa outfits. No franchise emblem.
- `khoa-portrait-source.vrm`: owner-approved Khoa portrait master, SHA-256
  `db44d0f7723fb2bd047053fd005c856f295d1fd9f5939cbefd97dfc2120a8312`.
  Preserves the accepted charcoal hair, green iris, round glasses, face and morphs.
  This source is intentionally outside `public`; only the final dressed model
  is served. Its embedded pixiv/VRM Public License 1.0 metadata is retained.

`node scripts/create-academy-character.mjs --npcs` builds Khoa's robe from this
frozen portrait via `scripts/refine-khoa-robe.mjs`. The approved portrait is the
source, rather than regenerating the rejected earlier male face/hair recipe.
Historical exploration sources stay in the local ignored research folder; the
shipped generator needs none of those files.

## Sky integrity fixture

`moon-lroc-color-2k.jpg` is the unchanged NASA SVS source used to check the
published moon texture. SHA-256:
`f7130a1822681fa7512d7dcfd40db8c10b9ba4f06777910348698260ed7a2170`.
Source: https://svs.gsfc.nasa.gov/4720/; credit: NASA SVS / Ernie Wright
(USRA), LRO / LROC / LOLA. Keep this fixture in Git so a clean clone can
verify source-to-runtime equality without the historical authoring output.
