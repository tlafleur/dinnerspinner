# 🎡 Dinner Spinner

Spin the wheel, pull the lever, feed the family. A playful meal planner for
iPhone and iPad (and any browser) that runs entirely on the device. Nothing is
uploaded; your family, meals, pantry and plans live in the browser's local
storage.

## What it does

| Tab | Mechanic | Scenario |
| --- | --- | --- |
| 🎡 **Tonight** | Prize wheel. Bigger slices are family favorites. Filters: Fridge raid, Kid-approved, Quick, Veggie. | "What do we cook tonight?" and "What can we make from what we have?" |
| 🎰 **Week** | Slot machine with one reel per dinner night. Hold the keepers, pull again, lock it in. Wildcard nights (takeout, leftovers…). Jackpot when every kid loves every meal. | Planning the week before a grocery run |
| 🛒 **Shop** | Shopping list generated from the locked week (plus tonight's pick), scaled to the family, grouped by aisle, minus what is in the pantry. Share via the iOS share sheet. "Done shopping" stocks the pantry. | The grocery trip |
| 🧺 **Pantry** | Tap what you have. Shows how many meals are ready to cook or 1–2 items away. "Fridge raid" spin uses only those. | Cooking from what's on hand |
| 👨‍👩‍👧 **Family** | Members with appetite, diets and "won't eat" ingredients. A swipe-style rating deck (Nope / Fine / Love it) that kids can use themselves. **Build-a-Plate**: a four-reel slot that assembles a plate from foods a picky eater actually eats. | Picky eaters |
| 📖 **Meals** | 54 sample dinners and 18 sides. Add your own with free-text ingredients ("1.5 lb chicken thighs"); aisles are guessed automatically. | Making it yours |
| ⚙️ **Settings** | Dinner nights, servings (auto from family or custom), weeknight time limit, house dietary rules, wildcards, sounds, confetti, stats, export/import. | Customizing |

### Game-show extras

- **Flick to spin.** Grab the wheel and throw it; speed and direction follow your finger.
- **One-tap mute.** The 🔊 button in the top bar silences everything.
- **Veto!** Anyone can veto a spin with a buzzer. It records a 🙅 for that person and spins again.
- **Face-off.** Pit the result against a challenger and let the kids tap the winner.
- **Sticker book.** 16 collectible stickers for milestones (first flick, Family Jackpot, 3-night streak, World Tour…).
- **Theme nights.** Taco Tuesday, Veggie Wednesday: the slot machine only lands on matching meals.
- **I'm feeling lucky.** One tap pulls the lever and locks in the week.
- **Text size** setting (normal / large / huge), on top of the iOS system size.

Sound effects are synthesized with the Web Audio API, so there are no audio
files. Confetti is a canvas overlay. Everything respects `prefers-reduced-motion`
and dark mode.

## How suggestions are chosen

`js/engine.js` scores every visible meal:

- Meals that break any house rule or any member's diet are excluded outright.
- Each ❤️ from a family member multiplies the weight by 1.5; each 🙅 by 0.25
  (and excludes the meal in Kid-approved mode). An ingredient on someone's
  "won't eat" list counts as a 🙅.
- Unrated meals use the kid-friendliness stars as a prior when the family has kids.
- Meals cooked in the last week are heavily down-weighted; ones you haven't had
  in a while get a small bump.
- In Fridge raid mode only meals missing at most two non-staple ingredients
  qualify, and fully-stocked meals are boosted.
- The week picker samples without replacement and penalizes repeating the same
  protein or cuisine back to back.

## Install on iPhone / iPad

Open the site in Safari, tap **Share → Add to Home Screen**. It launches
full-screen, works offline (service worker) and keeps its data between launches.

## Development

No build step. Serve the folder with any static server:

```sh
npm run serve      # http://localhost:8080
npm test           # engine unit tests (node:test)
npm run icons      # re-render PNG icons from icons/icon.svg (needs Playwright)
```

Files:

```
index.html            app shell, tabs
css/app.css           all styling (light + dark)
js/app.js             hash router, onboarding, service worker registration
js/store.js           state, persistence (localStorage), migrations
js/engine.js          parsing, scoring, picking, grocery aggregation (pure, tested)
js/sound.js           Web Audio sound effects
js/fx.js              confetti
js/badges.js          sticker definitions
js/data/seed.js       sample meals, sides, plate components, wildcards
js/ui/wheel.js        canvas prize wheel
js/ui/reels.js        slot reel
js/ui/*.js            one module per screen
sw.js                 offline cache
```

Bump `CACHE` in `sw.js` when shipping changes so installed apps refresh.

## Deploy

Pushing to `main` runs the tests and publishes to GitHub Pages through the
workflow in `.github/workflows/pages.yml`. In the repository settings, set
**Pages → Source** to **GitHub Actions** once.
