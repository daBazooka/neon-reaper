# KALEIDREAM: CrazyGames Submission Listing

Upload `kaleidream/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**KALEIDREAM**

## Category
**Primary:** Casual · **Secondary:** Arcade

## Tags
casual, arcade, colorful, cute, funny, collection, one button, mouse, mobile, surprise, rhythm, flying, boss, dream

## Short description
Every second, the dream changes. Fly, run, orbit a planet, stomp a tiny town, dance and paint, all in one run, while twists flip the world upside down.

## Long description
**Every second, the dream changes.**

You are a little dreamer in a dream that won't sit still. Every few seconds the world folds up like a **kaleidoscope** and becomes a completely different game:

- **FLY!** Tap to flap through spiky clouds.
- **DODGE!** Weave through a rain of grumpy raindrops.
- **RUN!** Jump and double jump over spikes and bats.
- **ORBIT!** Circle a planet and switch rings.
- **GIANT MODE!** You're enormous. Stomp the tiny town.
- **DIVE!** Fall down the rabbit hole.
- **DANCE!** Tap when the notes hit you.
- **PAINT!** Bring colour back to a grey world.
- **GROW!** Eat smaller critters, run from bigger ones.

And just when you get used to it, **a twist lands on top**. There are 24 of them, and you never know which is next:
- **Disco Dream**, **Upside Down**, **Mirror World** and **Jelly World**
- **Candy Rain** and **Meteor Shower**
- **Tiny Me**, **Mega Me** and **Big Head Mode**
- **Friendly Nightmares** (monsters want hugs), **Time Freeze**, **Lights Out** and **Slow Motion**
- **Double Trouble** (a clone helps you), **Star Magnet**, **Turbo** and **Star Storm**
- A **Jackpot** slot machine, a **Portal** that skips ahead, a **Friend** who brings a gift, and more

**Every dream ends with a Nightmare boss:** The Alarm Clock, Grumblecloud, the Sock Goblin, Captain Nope and friends. Everything you collect shoots a sparkle at them!

**Keep dreaming:**
- **12 dreamers to collect,** each with its own perk: extra hearts, a star magnet, a shield, slow motion and more.
- **15 hats, 9 trails and 11 emotes** from the **capsule machine**, including a Rubber Duck, a Tiny UFO and a Wizard Hat.
- **Endless dreams,** each with its own name (Jelly Desert, Disco Aquarium, Pickle Express...) and up to 3 stars.
- **Combos** that climb from NICE! to DREAMY!, MAGICAL! and beyond.
- **Missions, a Surprise Book** to fill with every mode and twist you discover, and a **7-day daily gift**.

## Controls
- **Mouse:** click to flap, jump, switch rings and dance, and move the mouse to steer
- **Touch:** tap to act and drag to steer
- **Keyboard:** **Space** acts · **arrows / WASD** steer · **Esc / P** pause

Each new dream mode shows its one-line instruction as it starts. Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
**Yes, using the Data Module from the CrazyGames SDK.**

## Age suitability
Cute, non-violent. Monsters are silly and get "hugged" or bonked by sparkles. No chat, no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `kaleidream/dist/index.html` (zip it)

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a dream starts. **`gameplayStop()`** on results, pause, the title screen and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on beating a nightmare, a jackpot triple, and Epic or Legendary capsule pulls.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called. The "keep dreaming" continue costs in-game crystals, not an ad.

## Note for the reviewer
All characters, monsters, backgrounds and effects are drawn in code, and all music and sound effects are synthesized in code, with no third-party assets. A few interface icons are the system's built-in emoji.
