# BO KATA — Store Listing Kit

Copy-paste text and form answers for Google Play and the Apple App Store.
Replace everything in `[BRACKETS]` with your own details.

---

## Google Play

### App details
| Field | Value |
|---|---|
| App name (max 30) | **BO KATA: Kite Fighting** |
| Short description (max 80) | Real-time kite fighting on festival rooftops. Cross threads, shout BO KATA! |
| App or game | Game |
| Category | **Action** (Casual also fits) |
| Tags (pick up to 5) | Casual · Multiplayer · Competitive multiplayer · Offline · Stylized |
| Free or paid | Free |
| Contains ads | **No** |
| In-app purchases | **No** |
| Contact email | [YOUR SUPPORT EMAIL] |
| Website | https://[YOUR-SERVER-ADDRESS] |
| Privacy policy URL | https://[YOUR-SERVER-ADDRESS]/privacy.html |

### Full description (max 4000)

> **Cut the sky.**
>
> Climb onto the rooftops on festival day. The sky is full of kites, the dhol is playing, friends are holding the spools, and every flyer has one dream: to cut your string and shout **BO KATA!**
>
> **ONE THUMB. ENDLESS SKILL.**
> Hold and your kite flies toward your finger. Let go and it spins and drifts on the wind, just like a real fighter kite. Learn it in five seconds. Master it forever.
>
> **WIN THE PENCH**
> When two threads cross, the pench begins: a tug-of-war cutting duel. Keep your kite flying fast, never let your thread go slack, and dive from above for extra cutting power. The faster thread wins.
>
> **LOOT FALLING KITES**
> Cut kites drift away on the wind. Chase them and snag them with your kite or thread, just like when we were kids, and they can join your collection.
>
> **PLAY ONLINE OR OFFLINE**
> • Sky Battle: 12 flyers, 3 kites each, last flyer standing
> • Duel: 1 vs 1 on neighbouring rooftops
> • Online matches fill up instantly, and you can always fly offline against rooftop rivals
>
> **42 KITES FROM AROUND THE WORLD**
> Indian patangs, Malaysian wau with their humming bows, Indonesian layang-layang fighting kites, Japanese rokkaku and Brazilian pipa, from common to legendary.
>
> **GEAR UP**
> Sharpen and strengthen your manja, pick your thread colour, and collect charkhi spools, from the Bamboo Charkhi to the Kelantan Gelendong and the Golden Charkhi.
>
> **7 FESTIVAL SKIES**
> Climb the Trophy Road through Gully Rooftops, Pink City, River Ghats, Desert Fort, Monsoon Sky, the Pantai Layang beach festival and the magical Lantern Night.
>
> **SOUNDS LIKE KITE DAY**
> Dhol and bansuri melodies, gamelan by the sea, wind in the paper, the buzz of a wau's bow, and plastic horns and cheers every time someone shouts BO KATA.
>
> Daily quests, a daily gift, a daily kite bazaar, and no ads.
>
> Fly safely in real life: never use glass-coated thread. It hurts birds and people.

### Graphics (in `store/graphics/`)
| Asset | File |
|---|---|
| App icon 512×512 | `www/icons/icon-512.png` |
| Feature graphic 1024×500 | `store/graphics/play-feature-1024x500.png` |
| Phone screenshots (1080×1920) | `store/graphics/play-phone-*.png` (6) |
| 10-inch tablet screenshots (1600×2560) | `store/graphics/play-tablet-*.png` (6) |
| 7-inch tablet screenshots | You can reuse the phone set |

### App content forms (Play Console → Policy → App content)
- **Privacy policy:** the URL above.
- **Ads:** No, the app does not contain ads.
- **App access:** All functionality is available without special access. There are no logins.
- **Content rating (IARC questionnaire):**
  - Category: Game.
  - Violence: none. Kites cut each other's threads; no people or animals are harmed.
  - Blood, sexuality, language, drugs, gambling: none.
  - Users can interact online: **Yes**. Players see each other's chosen nicknames in online matches; there is no chat.
  - Shares user location: No. Digital purchases: No.
  - Expected result: Everyone / PEGI 3 or 7 (the final rating comes from IARC).
- **Target audience:** we recommend **13 and over** for the first release. Choosing under-13 age groups puts the app in Google's Families programme, which adds extra requirements and review. The game has no ads or third-party SDKs, so it can qualify later if you want.
- **Data safety:**
  - Does your app collect or share user data? **Yes, it collects data.** Online play sends a nickname and gameplay input to your server.
  - Data types:
    - **Personal info → Name** (the in-game nickname).
    - **App activity → Other actions** (gameplay input).
  - For each type:
    - Collected: yes. Shared with third parties: **no**.
    - Processed ephemerally: **yes**.
    - Required or optional: **optional** (only when ONLINE is switched on).
    - Purpose: **App functionality**.
  - Encrypted in transit: **yes**, if your server runs on HTTPS/WSS (it should).
  - Users can request deletion: nothing is stored. Say "No" to deletion requests and explain that no data is retained.
- **Government app:** No. **Financial features:** None. **Health:** No. **News app:** No.

### Release notes (v1.0.0)
> First flight! Real-time kite fighting on festival rooftops: Sky Battles and Duels online or offline, 42 kites, 7 skies, daily quests and the Trophy Road. BO KATA!

---

## Apple App Store

| Field | Value |
|---|---|
| Name (max 30) | **BO KATA: Kite Fighting** |
| Subtitle (max 30) | Cut the sky on festival roofs |
| Primary category | Games → **Action** |
| Secondary category | Games → **Casual** |
| Price | Free |
| Promotional text (max 170) | Hold to pull, let go to spin. Cross threads, win the pench and shout BO KATA! Now with 42 kites from around the world and 7 festival skies. |
| Description | Same as the Google Play full description above |
| Keywords (max 100 characters, comma-separated, no spaces) | `kite,patang,manja,pench,uttarayan,basant,layang,wau,rokkaku,pipa,multiplayer,festival,rooftop` |
| Support URL | https://[YOUR-SERVER-ADDRESS] (or any page with your contact email) |
| Marketing URL (optional) | https://[YOUR-SERVER-ADDRESS] |
| Privacy policy URL | https://[YOUR-SERVER-ADDRESS]/privacy.html |
| Copyright | © [YEAR] [YOUR NAME] |

### Screenshots (in `store/graphics/`)
- iPhone 6.7" (1290×2796): `ios-6.7-*.png`
- iPhone 6.5" (1242×2688): `ios-6.5-*.png`
- iPad 12.9"/13" (2048×2732): `ipad-12.9-*.png` (needed because the app runs on iPad too)
- App icon: already in the Xcode project (1024×1024, no transparency).

### App Privacy (the "nutrition label")
Answer **Data Not Collected**. Apple defines "collect" as keeping data longer than needed to serve a request in real time. BO KATA only uses the nickname and inputs live during a match and never stores them. If you later add accounts, analytics or ads, you must update this.

### Age rating questionnaire
- Everything is "None".
- "Unrestricted web access": No.
- Gambling or contests: No.
- User-generated content: nicknames only, filtered, and players can hide them. Answer according to Apple's current wording.
- Expected rating: **4+**.

### Export compliance
Already answered in the build: `ITSAppUsesNonExemptEncryption = false`. The app only uses standard HTTPS/WSS.

### Notes for the App Review team
> BO KATA is a complete game bundled in the app and it works fully offline (tap FLY). ONLINE mode (toggle on the home screen) connects to our WebSocket game server at [wss://YOUR-SERVER-ADDRESS/ws] to play against other people; empty seats are filled by bots, so a reviewer can start an online match alone. There are no accounts, purchases or ads.

---

## Other stores and the web
- **Samsung Galaxy Store, Amazon Appstore, Huawei AppGallery:** upload the same signed build (an APK or AAB from `./gradlew bundleRelease` or `assembleRelease`). Reuse the same text and screenshots.
- **itch.io, CrazyGames, Poki and other web portals:** upload `bokata/dist/index.html` (a single file). Offline play works there; online play works when players set your server address in Settings, or when they open the game from your own server's address.
