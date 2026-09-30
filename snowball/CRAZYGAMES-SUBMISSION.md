# SNOWBALL EFFECT: CrazyGames Submission Listing

Upload `snowball/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**SNOWBALL EFFECT**

## Category
**Primary:** Casual · **Secondary:** Arcade

## Tags
one button, snowball, growing, satisfying, runner, winter, collection, upgrades, missions, casual, arcade, mouse, mobile, physics

## Short description
Start as a snowflake. End as an ice planet. Roll down the mountain, swallow everything smaller than you, and watch the world shrink as you grow.

## Long description
**Start as a snowflake. End as an ice planet.**

Your snowball rolls down an endless mountain. Anything smaller than you sticks to it and makes you bigger: mittens, carrots, snowmen, cars, houses, castles, whole mountains, clouds, airliners... and one day, the Moon. Everything you swallow stays stuck on your ball as it rolls.

Anything bigger than you is trouble. **Tap to jump** over it, and **tap again in the air to SLAM** down and swallow everything around you.

- **The world keeps zooming out.** As you grow, the camera pulls back and the mountain shrinks beneath you. The sky turns from winter blue to starry space.
- **10 size tiers:** Snowflake, Snowball, Big Snowball, Boulder, Avalanche, Glacier, Mountain Eater, Sky Swallower, Ice Planet and Cosmic Snowball.
- **🌪 AVALANCHE MODE:** fill the meter with a swallowing streak and unleash a roaring wave that eats things three times your size.
- **The sun is melting you,** faster and faster. Keep swallowing to stay ahead of it!
- **The Snow Globe:** collect all 45 things you can swallow. The ones you haven't found yet show as dark silhouettes...
- **Missions and ranks:** three missions at a time. Finish them to rank up from Snowflake to Absolute Zero.
- **6 upgrades** you can buy right on the results screen: Bigger Start, Frost Coat, Sticky Snow, Avalanche Fuel, Crystal Magnet and Crystal Value.

Every run takes a minute or two, and every run makes you bigger. How big can you get?

## Controls
- **Mouse:** click to jump, click again in the air to slam
- **Touch:** tap to jump, tap again in the air to slam
- **Keyboard:** **Space / ↑ / W** jump and slam · **Esc / P** pause · **Enter** roll again

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
**Yes, using the Data Module from the CrazyGames SDK.**

## Age suitability
Cartoon and non-violent: a snowball rolling up snowmen, houses and mountains. No chat and no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `snowball/dist/index.html` (zip it)

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a run starts. **`gameplayStop()`** on the results screen, the pause menu, the title screen and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on reaching Boulder tier or above, starting an Avalanche, a new size record and a rank up.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called.

## Note for the reviewer
All scenery is drawn in code and all music and sound effects are synthesized in code, with no third-party assets. The things you swallow are the system's built-in emoji.
