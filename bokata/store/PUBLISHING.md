# Publishing BO KATA: step by step

What is already done in this repository:
- the game itself
- native Android and iOS projects (Capacitor 8, target SDK 36) with icons, splash screens, back-button handling and version 1.0.0
- release-signing configuration (reads your keystore)
- the iOS export-compliance flag
- a privacy policy page
- the multiplayer server with a Dockerfile and a Render blueprint
- all store screenshots and the feature graphic
- the store text and form answers in `LISTING.md`

What only you can do: create the developer accounts, create the signing key, host the server, fill in your contact details, test on real phones, and press submit.

---

## 0. Decide two things first
1. **Package / bundle id.** It is currently `com.bokata.kites`. It must be unique and can never change after you publish, so pick your own now (for example `com.yourname.bokata`). To change it:
   - `capacitor.config.json` → `appId`
   - `android/app/build.gradle` → `namespace` and `applicationId`
   - move `android/app/src/main/java/com/bokata/kites/MainActivity.java` to the matching folders and update its `package` line
   - iOS: Xcode → App target → Signing & Capabilities → Bundle Identifier

   Then run `npx cap sync`.
2. **The name.** Search Google Play and the App Store for "Bo Kata" and "BO KATA" before you launch. If another app already uses the name, add a subtitle-style suffix (the listing already uses "BO KATA: Kite Fighting") or choose a variant.

## 1. Put the game server online (needed for ONLINE mode)
The easiest route is **Render**:
1. Push this repository to GitHub (already done if you use this branch).
2. On render.com: **New → Blueprint** → pick the repository. It reads `render.yaml` and builds `bokata/Dockerfile`.
3. After it deploys, open `https://<your-app>.onrender.com/health`. You should see `{"ok":true,...}`.
4. Open `https://<your-app>.onrender.com` in two browsers, switch ONLINE on in both, and press FLY. You are playing each other.

Notes:
- Use a paid "Starter" instance; free instances sleep.
- Any Docker host that supports WebSockets also works: Railway, Fly.io, DigitalOcean, or a VPS behind Caddy or nginx with HTTPS.
- **Scaling:** one Node process handles many rooms. Watch CPU; if it gets busy, run more instances.

## 2. Point the apps at your server and fill in your details
1. In `bokata/www/js/net.js`, set `const DEFAULT_SERVER = 'wss://<your-app>.onrender.com/ws';`. The ONLINE switch stays hidden in the apps until this is set.
2. In `bokata/www/privacy.html`, replace `[DATE]` and `[YOUR CONTACT EMAIL]`.
3. Rebuild the single-file web version if you use it, then run:
   ```
   cd bokata
   npm install
   npx cap sync
   ```

## 3. Android: build the release bundle (.aab)
Install **Android Studio**. It brings the Android SDK and Java.

1. Create your upload key once and **back it up**. If you lose it, you have to ask Google to reset it:
   ```
   keytool -genkeypair -v -keystore bokata-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
   Put `bokata-upload.jks` in `bokata/android/`.
2. Create `bokata/android/keystore.properties`. It is git-ignored; never commit it:
   ```
   storeFile=../bokata-upload.jks
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=upload
   keyPassword=YOUR_KEY_PASSWORD
   ```
3. Build:
   ```
   cd bokata/android
   ./gradlew bundleRelease          # → app/build/outputs/bundle/release/app-release.aab
   ./gradlew assembleRelease        # → an APK for Samsung, Amazon or Huawei stores and for sideloading
   ```
   Or use Android Studio → **Build → Generate Signed App Bundle**.
4. **Test on real phones.** Include a cheap phone:
   ```
   npx cap run android
   ```
   Or use Run in Android Studio.
5. **For every update**, raise `versionCode` (1 → 2 → 3…) and `versionName` in `android/app/build.gradle`.

## 4. Google Play Console
1. Create a developer account at play.google.com/console. It costs **US$25 once** and needs identity verification.
2. **Important for new personal accounts:** Google requires a **closed test with at least 12 testers for 14 days in a row** before you can publish to production. Start this early: invite friends and family by email or a Google Group.
3. **Create app.**
   - Name: BO KATA: Kite Fighting · Game · Free.
   - Accept the declarations.
4. **Store listing:** paste from `LISTING.md` and upload the images from `store/graphics/`.
5. **App content:** fill every form using the answers in `LISTING.md` (privacy policy, ads, app access, content rating, target audience, data safety, government / financial / health).
6. **Testing → Closed testing:** upload `app-release.aab` and add the testers. Keep **Play App Signing** on (the default).
7. After 14 days: **Production → Create release**, upload, choose countries, then **Send for review**. Reviews usually take from a few days to about a week.

## 5. iOS: App Store
You need a **Mac with Xcode** and the **Apple Developer Program** (US$99/year).
1. `cd bokata && npx cap open ios`
2. In Xcode:
   - App target → **Signing & Capabilities**: choose your Team and set your Bundle Identifier.
   - General: Version **1.0.0**, Build **1**.
3. Test on a real iPhone. Then **Product → Archive → Distribute App → App Store Connect**.
4. In App Store Connect: **My Apps → +** → new app with the same bundle id.
   - Fill the listing from `LISTING.md`.
   - Upload the `ios-6.7`, `ios-6.5` and `ipad-12.9` screenshots.
   - App Privacy: **Data Not Collected**.
   - Age rating questionnaire.
   - Add the review notes.
5. Test through **TestFlight** first, then **Submit for Review**. Reviews usually take 1–3 days.

## 6. Other stores and the web
- **Samsung Galaxy Store, Amazon Appstore, Huawei AppGallery:** the same signed build and listing.
- **itch.io and web portals:** upload `bokata/dist/index.html`.
- **Your own site:** the server already hosts the game at its address.

## 7. Before you press submit: device checklist
- [ ] Plays smoothly on a low-end Android phone. It lowers the graphics by itself when needed; try Settings → Graphics → LOW.
- [ ] Sound starts after the first tap; muting and backgrounding the app silence it; it comes back on return.
- [ ] Android back button: pauses a match, closes panels, and leaves the app from home.
- [ ] Portrait and landscape both work; notches and rounded corners do not hide the buttons.
- [ ] ONLINE: two phones on different networks meet in one match; switching the network off mid-match does not crash the app.
- [ ] Progress survives closing and reopening the app.
- [ ] The privacy policy opens from Settings and from its URL.

## 8. After launch
- Watch `https://<server>/health` and your host's CPU and memory graphs.
- Read reviews and fix what players report, then ship updates (always raise the version numbers).
- Coming next on the roadmap: accounts and cloud saves, friends and clans, a real-player leaderboard and more languages (Hindi, Urdu, Bengali, Gujarati, Punjabi, Malay, Indonesian).

## Honest limits of this package
- **No signed build.** I could not produce a signed `.aab` or `.ipa` here. This environment cannot download the Android SDK, and building for iOS needs a Mac. Your keys must stay with you in any case.
- **Browser-tested only.** The game was tested in Chromium at phone and tablet sizes, including online play with two browsers, but not on physical phones yet.
- **No guarantees from the stores.** Google and Apple decide approval and ratings. The answers in `LISTING.md` are my best reading of their current forms, so read each question as you go.
