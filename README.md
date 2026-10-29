# JoustLine: The First

A mobile-first jousting duel: three taps per pass, six rivals, one crown. You are not a nameless rider — you pick a knight, a squire and the lady whose colours you wear, then spend the purse on steel and Glow on how the steel looks. It's a plain static site — no framework, no build step, no image or audio assets. Every knight, horse, banner and sound is generated in code at runtime. It installs to a phone home screen and plays offline.

## In the LeonLink ecosystem

JoustLine: The First is a [LeonLink](https://leonlink.net) game and the jousting seat at the Glowline table. Glow is the one wallet shared across the lobby: [Glowline](https://glowline.leonlink.net) holds the wallet and the doors to Afterglow (the free-to-play neon social casino, play money only) and Arcadeline (the arcade). This build keeps its Glow in the local save under `joustline-the-first-v1` and spends it on barding; there is no wallet-sync API in this repo yet, so Glow earned here does not yet move into the shared wallet.

## The story

You are the squire of Montresor. Sixteen years old, no title, no money, and very good with a horse. Six winters ago a knight on the wrong road found you holding a panicking bridle in a burning coaching inn, and told the court he won you at dice.

That knight is **Lord Bart Sheen**: a magnificent jouster, a worse drunk, and the reason the court calls a leg cramp a *Bart-horse*. He is also the reason you are in the saddle at all.

**Chapter One is six riders in the lists:**

| # | Rival | Where they come from |
| --- | --- | --- |
| I | Guillaume Sorel | Champion of the Montresor fair, and loud with it |
| II | Isabeau de Loches | A rival squire with her own lance and better boots |
| III | Bonnivet | The admiral, who keeps riders the way a man keeps hawks |
| IV | Charles Brandon | The English party, silk pavilions and all |
| V | The Duke of Bourbon | A colour that changes hands |
| VI | Lord Bart Sheen | Healed leg, borrowed colours, a goblet raised before the charge |

**The Bart-horse.** Before his fight, Bart's leg seizes mid-toast and the squire reflex takes over: ten quick rubs before he topples off Tancrede. Work the knot and you take a Glow for your trouble; miss it and he rides it out anyway, shouting *WINNING!* while the court physician calls it a most unusual horse-cramp.

The prologue plays once. Each rival's story panels play the first time you face them, and every tilt ends on a beat — win or lose. Prose lives in `js/story.js`, canon-true to `joustline/docs`: comedy and tragedy in the same breath, puns never explained, and nothing that the player is supposed to work out is ever said out loud.

**The retinue is the cast.** Whose colours you carry (Bart, the Baron of Vaudrecourt, or Bayard), which squire rides with you (Old Gaspard, Isabeau, Brother Anselme), and whose favour you wear (Queen Claude, Marguerite de Navarre, Diane de Poitiers, Catherine de' Medici — the last three earned).

## Play

```bash
npm start                      # http://localhost:3000
```

`npm start` runs a tiny static server with the right PWA MIME types. Start url works from any path, not just the domain root.

**Every launch opens on the cold open**, before the prologue: *LEONLINK PRESENTS*, then the arms spinning up out of black to full gilding, the title, and finally **WINNING!** Six and a half seconds, and any tap skips it.

## The loop

Each pass ("tilt") is three timed taps. Tap anywhere on the arena.

1. **Gallop** — a needle sweeps a bar. Tap inside the gold band for a full run-up, which multiplies your strike force.
2. **Aim** — a reticle sweeps up a target rail over the rival. The window is two seconds and the sweep accelerates, so you cannot line up a perfect shot forever. Tap to lock a plate:
   - **HELM** ×2.0 — the big damage, but the plate soaks the first hit
   - **CHEST** ×1.1 — steady and well armoured
   - **SHIELD** ×0.45 — almost no body damage, but breaking it strips their guard: they lose their deflection bonus and part of their own strike power
3. **Strike** — tap in the gold window for a clean hit; a perfect strike is ×1.75.

Both riders land their blow at the same time. Plates absorb part of each hit until they shatter; when a body runs out of stamina that rider is unhorsed.

## Your retinue

**Knight** — whose colours you carry, three ways to lean the numbers. Lord Bart Sheen pays better and rides frailer, the Baron of Vaudrecourt brings bought steel with a thinner guard, and Sir Bayard is simply clean. Each carries different heraldic colours, and your chosen field replaces their cloth.

**Squire** — Old Gaspard (+purse, and gets the history wrong), Isabeau de Loches (+1 Glow per win, and knows every purse on the circuit) or Brother Anselme (+14% purse from the Montresor estate). Squire perks are economic and timing only; they never touch the damage maths.

**Ride for** — every knight wears someone's favour. Queen Claude is waiting at court; the rest have to be earned. Marguerite de Navarre wants one rival in the sand, Diane de Poitiers wants three, and Catherine de' Medici rides with nobody until six have fallen. Each lady carries a boon (+purse, +lance or a wider perfect strike).

## Two currencies

| | Earned by | Spent on |
| --- | --- | --- |
| **Purse** (gold) | every tilt — more for a win, more still for finishing with stamina left | **Lance** (damage), **Harness** (stamina, plate, deflection), **Destrier** (gallop and a wider perfect-strike window) |
| **Glow** | won tilts: 2 per win, +1 for a rival's first fall, +1 for finishing above half stamina | **Horse armour** (barding) — how you look, not how hard you hit |

Glow is the LeonLink lobby currency, the same one Glowline's wallet shows. This game tracks its own balance for now.

## Coat of arms

The armory's heraldry panel has six fields and six charges. Fields are free to wear as they unlock; charges are **never for sale** — each symbol is earned by unhorsing rivals.

| Symbol | Rivals beaten |
| --- | --- |
| Chevron, Cross (fields: Gules, Azure) | 0 |
| Saltire / Vert field | 1 |
| Roundel / Sable field | 2 |
| Lion / Purpure field | 4 |
| Crown / Or field | 6 |

Barding is cumulative and bought with Glow: **Peytral** (2) puts a steel breastplate on the horse, **Chanfron** (4) adds the armoured head, **Full bard** (7) runs crinet plates down the neck, **Gilded bard** (11) trims the whole harness in gold. The chosen field, charge and barding are drawn straight onto the rider in the arena — including the aim close-up.

Progress is saved to `localStorage` under `joustline-the-first-v1`. A save from the old *Lance & Crown* build (`lance-and-crown-v1`) is migrated on first boot.

## Install & offline

- `manifest.webmanifest` — standalone portrait launch, theme colours, `any` + `maskable` icons.
- `sw.js` — precaches the whole game (16 files). Navigations are network-first, so a deploy lands on the next load; assets are stale-while-revalidate, so the game paints instantly from cache and refreshes in the background. (Network-first on assets is what made the game feel slow on a phone — every frame's worth of CSS waited on the network.)
- `icons/` — real PNGs at 192, 512, a 512 maskable variant, and a 180 apple-touch icon, all generated by `npm run icons` (a small rasteriser + PNG encoder, no image libraries).
- **Android** shows an "Install the game" button when the browser fires `beforeinstallprompt`.
- **iOS** shows a one-line Share → Add to Home Screen hint when not already standalone.

Bump `VERSION` in `sw.js` when you ship a change you want returning players to pick up on their next visit; the new worker calls `skipWaiting()` and claims clients.

## Tests

```bash
npm test        # balance + pwa + smoke
```

- `tests/balance.mjs` — simulates 4,000 tilts per rival per skill profile and flags matchups outside the intended win-rate band.
- `tests/pwa.mjs` — checks the manifest, icon sizes and that every precached path exists.
- `tests/smoke.mjs` — jsdom end-to-end: boot, the cold open and its skip, legacy save migration, a full tilt, the armory purchase path, retinue choices and heraldry gating.

There is no lockfile committed, so CI installs with `npm install` rather than `npm ci`.

## Deploy to Vercel

Vercel serves the repo root as-is: framework preset **Other**, no build command, root directory `./`.

- `vercel.json` sets `application/manifest+json` for the manifest, `must-revalidate` for `sw.js` (a CDN-cached service worker is how PWAs get stuck on old code), long-lived caching for icons, and basic security headers.
- `.vercelignore` keeps `tests/`, `tools/`, `package.json`, logs and docs out of the deployment, so the output is exactly `index.html`, `css/`, `js/`, `icons/`, `manifest.webmanifest`, `sw.js`.

### Push to deploy

**This repository does not deploy itself.** The Vercel project was created without a Git link, so Vercel never receives a push event — the repo's Deployments API has stayed empty through every push, and production only moves when a deployment is created through the API. Two ways to close that gap:

- **Native, no secrets.** Vercel dashboard → the `lance-and-crown` project → **Settings → Git → Connect Git Repository** → `leonptucker3886-lab/lance-and-crown`. The GitHub app already has access to the repo, so this is the one-click route; pushes to `main` build automatically from then on.
- **CI, already committed.** `.github/workflows/deploy.yml` runs the three suites on every push to `main`, then deploys with the Vercel CLI. It needs one repository secret, `VERCEL_TOKEN` (Vercel → Account Settings → Tokens). The org and project ids are committed in the workflow because they are public identifiers, not credentials. Until that secret exists the workflow tests the push and skips the deploy rather than failing.

Pick one. Once the Git link is in place the workflow's deploy step is redundant — delete it or leave it disabled.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Screens, HUD, canvas host, cold-open markup, PWA meta |
| `manifest.webmanifest` | Install metadata |
| `sw.js` | Offline precache + runtime caching |
| `icons/` | Generated PNG icon set |
| `css/style.css` | Mobile-first styling, safe-area handling |
| `css/intro.css` | Cold-open timeline: brand, arms, title, WINNING! |
| `js/main.js` | Save state, cold open, screens, ladder, armory, retinue, heraldry, install prompt, worker registration |
| `js/match.js` | Pass state machine, camera, damage resolution, canvas HUD widgets |
| `js/art.js` | Procedural backdrop, crowd, lists, mounted knight, barding, charges, effects |
| `js/crest.js` | Gilded shield + crown charge, drawn frame by frame for the intro spin |
| `js/data.js` | Knights, squires, ladies, heraldry, barding, rivals, plate maths, economy, rival AI roll (DOM-free) |
| `js/story.js` | Chapter One prose: prologue, rival intros, win/loss beats (DOM-free) |
| `.github/workflows/deploy.yml` | Tests every push to `main`, deploys when `VERCEL_TOKEN` is set |
