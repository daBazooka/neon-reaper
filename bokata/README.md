# BO KATA

**Cut the sky.** A real-time kite-fighting game set on festival rooftops.

"Bo kata!" is the cry shouted from rooftops when your kite cuts a rival's
string. It is a shared childhood memory for hundreds of millions of people
across South Asia and beyond (Uttarayan, Basant, Shakrain and kite
festivals everywhere).

## The game

- **One thumb.** Hold and your patang flies toward your finger (Point mode). Let go and it spins and drifts on the wind, just like a real fighter kite. Classic mode is for purists: hold to pull, and the kite darts wherever its nose points.
- **Pench.** When two threads cross, a cutting duel starts. The thread that saws faster wins. Keep your kite moving, pull (a slack thread loses), and come from above for +30%. Sharper and stronger thread helps. A tug-of-war meter shows who is winning.
- **BO KATA!** The loser's kite drifts away on the wind. Anyone can **loot** it by touching it with their kite or thread. Looted kites can join your collection.
- **Modes.**
  - **Sky Battle:** 12 flyers with 3 kites each over 3 minutes. Last flyer standing, or the best when time runs out, wins.
  - **Duel:** 1 vs 1.
- **Progression.** You earn trophies as you play. The trophy road climbs through seven skies:
  1. Gully Rooftops
  2. Pink City
  3. River Ghats
  4. Desert Fort
  5. Monsoon Sky
  6. Pantai Layang (a beach kite festival with gamelan music)
  7. Lantern Night

  You never drop out of a sky you have reached.
- **Online multiplayer.** Turn on **ONLINE** on the home screen to play real people. Empty seats fill with bots after a short wait, so a match always starts. See [Online server](#online-server).
- **Collection and upgrades.**
  - 42 kites in four rarities and five kite families: Indian patang, Malaysian **wau** (with the humming bow), Indonesian/Malaysian **layang-layang** fighting kites, Japanese **rokkaku** and Brazilian **pipa**.
  - 7 **charkhi spools** (the reel your friend holds). Better spools hold more thread, let slack out faster and pull harder.
  - A daily kite bazaar.
  - Thread upgrades (sharpness and strength).
  - 8 thread colours.
  - Daily quests and a daily gift streak.
- **First flight.** A guided practice duel teaches pull, slack, pench and your first BO KATA.
- **The sound of a kite sky.** Every match opens with a shehnai-and-dhol fanfare and countdown drums. While you fly you hear:
  - wind that follows the gusts
  - paper fluttering faster as your kite speeds up
  - the wau's buzzing bow (the "dengung") rising in pitch with speed
  - rooftop crowd murmur, distant pipudi horns and pigeons

  The match ends on a cadence that rises for a win and falls for a loss.
- **Made in code.** All art is procedural: skies, rooftops with water tanks, clotheslines and dishes, flyers with their spool-holding friends, pigeons, sky lanterns and rain. All music and sound is synthesized: dhol, harmonium drone, a bansuri-style flute, chimta, pipudi horns and crowd cheers. The whole game is about 116 KB.

## Project layout

| Path | What |
|---|---|
| `www/` | The game (HTML, CSS, JS). This is also the Capacitor web directory. |
| `server/` | The multiplayer server (Node.js + WebSocket). It also serves the web game. |
| `Dockerfile` | One container with the server and the game, for any cloud host. |
| `dist/index.html` | Single-file build for web portals and itch.io. |
| `android/` | Native Android project (Capacitor 8). Open it in Android Studio. |
| `ios/` | Native iOS project (Capacitor 8). Open it in Xcode. |
| `capacitor.config.json` | App id `com.bokata.kites`. Change it to your own reverse domain before publishing. |

## Run it

```
npx http-server www -p 8080     # then open http://localhost:8080
```

## Online server

The server (`server/server.js`) is authoritative. For every room it loads the game's own `core.js`, `sim.js` and `bots.js` into an isolated sandbox, so online matches follow exactly the same physics and rules as offline play. Clients only send their input.

- **Matchmaking:** by mode (Sky Battle 12 seats, Duel 2 seats). Bots fill empty seats after 12 s (battle) or 8 s (duel), matched to the players' trophies.
- **Tick rates:** the simulation runs at 60 Hz and sends snapshots at 20 Hz (about 11 KB/s per player in a full battle). Cuts and loots are sent as events.
- **Feel:** the client flies your own kite instantly (prediction with gentle correction) and smooths everyone else.
- **Disconnects:** if a player drops mid-match, a bot takes over their kite, so fights never vanish.
- **Protection:** input and loadouts are validated, messages are rate-limited, and dead connections are dropped.
- **Health check:** `GET /health` returns `{ ok, rooms, players }`.

Run it locally:

```
cd server && npm install && npm start      # http://localhost:8787  (game + /ws)
```

Open that address in two browsers, switch ONLINE on in both, and press FLY.
For testing, `LOBBY_WAIT=3 MATCH_SECONDS=30 npm start` shortens the lobby and matches.

**Deploy.** Deploy the `Dockerfile` to any host that supports WebSockets, such as Render, Railway, Fly.io or a small VPS behind nginx or Caddy with TLS. Then:
- **Browser players** who open the server's address play online automatically.
- **Store apps** need the server address set in `DEFAULT_SERVER` in `www/js/net.js` (use `wss://…` because Android and iOS require TLS). Then run `npx cap sync`. Players can also type an address in Settings, under "Online server".
- **Offline fallback.** If the server can't be reached, the game says so and starts the match against bots.

## Build the apps

Prerequisites: Node 20+, Android Studio (with the Android SDK), and for iOS a Mac with Xcode.

```
npm install
npx cap sync            # copies www/ into both native projects
npx cap open android    # build > Generate Signed App Bundle (.aab) for Google Play
npx cap open ios        # Product > Archive for the App Store
```

The icons (every Android density plus the iOS 1024 px icon) and the splash screens are already installed.

## Publishing

Everything for the stores is in `store/`:
- `store/PUBLISHING.md`: the step-by-step guide (server, signing, Google Play, App Store, other stores, a device checklist).
- `store/LISTING.md`: listing text and the answers for every store form.
- `store/graphics/`: screenshots for Google Play phone and tablet, iPhone 6.7" and 6.5", iPad 12.9", plus the 1024×500 feature graphic.
- `www/privacy.html`: the privacy policy (hosted by the server at `/privacy.html`).

## Store checklist (things only you can do)

- **Accounts.** A Google Play Console developer account and an Apple Developer Program membership.
- **App id.** Set your own `appId` in `capacitor.config.json`, then run `npx cap sync`.
- **Signing.**
  - Android: create an upload keystore and keep it safe.
  - iOS: set up a signing team in Xcode.
- **Privacy policy URL.** The game stores progress only on the device and collects nothing.
- **Content rating questionnaires.** The game has no violence against people, no chat and no purchases. The settings screen includes a real-world safety note about glass-coated thread.
- **Store listing.**
  - Name: BO KATA
  - Short description: "Real-time kite fighting on festival rooftops. Cross threads, win the pench, shout BO KATA!"
  - Screenshots from the game.

## Roadmap (honest status)

Done: offline play, the authoritative online server with matchmaking and bot fill, and native app projects. Still to do for a large-scale launch:

1. **Hosting.** Deploy the server (a running cost). One Node process handles many rooms; for large numbers of players, run several instances behind a load balancer, with a small matchmaker that sends players to the right instance.
2. **Accounts and cloud saves** (Play Games Services / Game Center, or your own backend).
3. **Friends, clans ("mohallas") and a real-player leaderboard.**
4. **Optional cosmetic-only purchases or rewarded ads**, added carefully so the game never becomes pay-to-win.
5. **Localisation:** Hindi, Urdu, Bengali, Gujarati, Punjabi.
