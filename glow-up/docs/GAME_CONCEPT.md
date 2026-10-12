# SUB 5 TO TRUE ADAM — game concept

> **One line:** you start as a short, round, weird-faced "Sub 5" and grow, level by level, into the perfect "True Adam".
> You can *see* yourself change (face, body, hair, aura), and there is always one more thing to unlock.

## 1. Why people come back (the design)

A Roblox game that people return to every day needs five things. Each one is a system in the game:

| Need | What it means | What the game has |
|---|---|---|
| **A visible fantasy** | you can *see* progress on your own character | the body, face and hair change every level (28 looks tiers, level 1 to 1250) |
| **A fast loop** | something rewarding every 10 seconds | swing, lift, run, hatch: Aura numbers pop, bars fill, sounds play |
| **A reason to return tomorrow** | a clock that makes today's login valuable | daily reward streak, 3 daily quests, timed play gifts, offline earnings |
| **A reason to return all month** | a long goal with a deadline | the 28-day **Mog Pass** season, ranked season, trophies, rebirths |
| **A reason to bring friends** | the game is better with other people | friend Aura bonus, ranked duels, the Mog Competition, shared server events |

## 2. The loops (what you do, and when)

- **10 seconds:** click to swing the hammer, hit a rep on a gym machine, run on a treadmill. Aura and XP flow in.
- **5 minutes:** buy the next hammer or treadmill, hatch a pet, open a crate, finish the current quest, win a duel.
- **One session (20 to 30 minutes):** level up, unlock a building, clear a stage battle, finish the 3 daily quests, collect play-time gifts.
- **One day:** claim the daily reward (a 7-day streak), complete the daily quests (a bonus crate for all 3), push the Mog Pass up a few tiers, come back for the next gift.
- **One season (28 days):** finish the 30-tier Mog Pass, climb the ranked ladder, earn trophies, rebirth for a permanent bonus.

## 3. The core features

### The fantasy: Sub 5 to True Adam
- 28 looks tiers (Sub 5, Sub 3, LTN, MTN, HTN, Chadlite, Chad, Adamlite, Adam, **True Adam**, True Adam+).
- Every player gets their own unique face (from their user id). It starts goofy (cross-eyed, buck teeth, unibrow, hair everywhere, a belly) and sharpens as you level.
- Taller, leaner and more muscular with every level; cosmetics, auras and wings on top.

### Earning
- **Hammer** with 10 upgrades, **treadmills** (20, with a heat bonus), **pets** (13 animals that give Aura and multipliers), **crates**, **rebirths**.
- **Gym machines** (new): six real machines with their own mini-games: dumbbell curls, bench press, squat rack, cable machine, punching bag and pull-up bar. The character really does the exercise.

### Competing
- **Ranked Arena:** 1v1 duels on a platform above a spike pit. Every win and loss moves your **rating** (Bronze up to Mogger Legend), and the ladder resets softly each season with tier rewards.
- **Stage battles:** 15 bosses to clear.
- **Mog Competition:** a timed server-wide contest for the best look.

### Goals (new in this version) — the "come back tomorrow" engine
- **Daily quests:** 3 fresh quests every day, sized to your level. Finish all three for a bonus crate.
- **Mog Pass:** a 28-day season with 30 tiers and two reward tracks (free and premium). Everything you do fills it.
- **Trophies:** 45 long-term achievements with rewards (and Roblox badges once you create them).
- **Codes:** redeem codes for Aura, crates and pass XP. Give out new ones on your game page and socials.
- **Friend bonus:** +10% Aura for every friend in the same server (up to +50%), so inviting friends is worth it.

### First visit
Silent: only arrows, a dotted trail and a pulsing hand. No banners, no popups, no voice.

## 4. Economy and monetization (kept fair)
- Aura is the main currency; hammers, treadmills and upgrades are the Aura sinks, so a big number always has a use.
- Real money buys **time and style, never exclusive power**: Starter Pack, VIP, 2x Aura, 2x Levels, Aura packs and the **Mog Pass premium track**. Every offer shows "Coming soon" until you paste its id into `Config.Store`.

## 5. What is built, and what is next

**Built (all in this repo, tested offline):** everything above except the items under "Next".

**Next (not built yet, in the order I would do them):**
1. A server-wide **boss event** ("Mog Titan") that everyone fights together, with shared rewards.
2. A **trading / gifting** system for pets.
3. Real **leaderboards** saved across servers (needs the game published, so it uses a real DataStore).
4. **Seasonal themed events** (Halloween, winter) that swap the plaza decorations and add limited cosmetics.

## 6. Assets: what is made from parts, and what you add yourself

I cannot download things from the Roblox Creator Store from here (it needs a Roblox login and permissions on each asset, and I cannot check that an asset is safe or allowed). So **everything you see is built from simple parts**, and the places where you can drop in real assets are ready:

| What | Where to paste it | Notes |
|---|---|---|
| Background music | `Config.MusicTrackId` | one looping song id (the game makes its own music if empty) |
| Sound effects | `Config.Sounds` | swap any of the four |
| Announcer voice lines | `Config.VoiceSoundIds` | recorded lines; a deep text-to-speech voice is used until then |
| Game passes and Robux items | `Config.Store` (`PassId`, `ProductId`) | create them on create.roblox.com, then paste the ids |
| Roblox badges | `Config.BadgeIds` | create badges on the game page, paste ids, and each trophy awards one |
| Game icon, thumbnails, trailer | the game page on create.roblox.com | these are what make people click Play |

Good free things to look for in the Creator Store (check the creator and the license yourself): a looping upbeat gym/hype track, a "level up" chime, a short crowd cheer, a punch/impact sound and a bell for round start.
