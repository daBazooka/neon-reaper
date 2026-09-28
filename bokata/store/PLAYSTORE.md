# BO KATA on Google Play: the complete procedure

Total cost: **US$25 once**. Time: about 1 hour of work, then a **14-day closed test** (Google's rule for new personal accounts), then review (usually a few days).

---

## Step 1: Create your Google Play developer account (day 1)
1. Go to **play.google.com/console** and sign in with the Google account that should own the game.
2. Choose **Yourself** (a personal account) or **An organization**. Organizations need a D-U-N-S number but skip the 12-tester rule.
3. Pay the **US$25** registration fee.
4. Verify your identity (government ID) and phone number. Verification can take a few days, so do it first.

## Step 2: Put the multiplayer server online
You can skip this if you launch offline-only. The ONLINE switch stays hidden until a server is set.
1. Create an account on **render.com** and connect your GitHub account.
2. **New → Blueprint** → choose the `neon-reaper` repository. Render reads `render.yaml` and deploys `bokata/Dockerfile`.
3. Open `https://<your-app>.onrender.com/health`. It should show `{"ok":true,...}`.
4. Open `https://<your-app>.onrender.com` in two browsers, turn ONLINE on in both, and press FLY. They meet in one match.
5. In the repository, edit `bokata/www/js/net.js`:
   ```js
   const DEFAULT_SERVER = 'wss://<your-app>.onrender.com/ws';
   ```
6. In `bokata/www/privacy.html`, replace `[DATE]` and `[YOUR CONTACT EMAIL]`. Commit.

Your privacy policy URL is now `https://<your-app>.onrender.com/privacy.html`.

## Step 3: Choose your permanent package name
The package name is currently `com.bokata.kites`. You can keep it or change it; it **can never change after the first upload**. To change it, edit:
- `bokata/capacitor.config.json` → `appId`
- `bokata/android/app/build.gradle` → `namespace` and `applicationId`
- `bokata/android/app/src/main/java/com/bokata/kites/MainActivity.java`: move it to the matching folders and update its first `package` line

## Step 4: Create your upload key (once, and back it up forever)
You need Java installed (`keytool`). Android Studio or any JDK 17+ includes it.
- **Windows:** double-click `bokata/store/make-upload-key.bat`
- **Mac/Linux:** run `bash bokata/store/make-upload-key.sh`

Answer the questions and choose a strong password. You get:
- `bokata-upload.jks`: your key. **Back it up** (cloud drive plus USB). Never put it in the repository.
- `bokata-upload.jks.base64.txt`: the same key as text, for GitHub.

## Step 5: Build the app with GitHub (no Android Studio needed)
1. On GitHub, open your repository: **Settings → Secrets and variables → Actions → New repository secret**. Add four secrets:

   | Name | Value |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | the whole contents of `bokata-upload.jks.base64.txt` |
   | `ANDROID_KEYSTORE_PASSWORD` | your keystore password |
   | `ANDROID_KEY_ALIAS` | `upload` |
   | `ANDROID_KEY_PASSWORD` | your key password (same as above if you pressed Enter) |

2. Go to **Actions → "BO KATA Android build" → Run workflow**.
3. After about 5–10 minutes, open the run and download from **Artifacts**:
   - `bokata-debug-apk`: install this on your phone to test. Allow "install unknown apps".
   - `bokata-release-for-google-play`: contains **`app-release.aab`**, the file you upload to Google Play.

   (Alternative: Android Studio → open `bokata/android` → Build → Generate Signed App Bundle.)
4. **For every future update:** raise `versionCode` (1 → 2 → 3…) and `versionName` in `bokata/android/app/build.gradle`, then run the workflow again.

## Step 6: Test on real phones
Install the debug APK on at least two phones, including a cheap one. Check:
- [ ] smooth play (Settings → Graphics → LOW if needed)
- [ ] sound starts after the first tap, stops when the app is in the background, and comes back
- [ ] back button: pauses a match, closes panels, leaves the app from the home screen
- [ ] portrait and landscape; nothing hidden by the notch
- [ ] ONLINE: two phones on different networks meet in a match
- [ ] progress is still there after closing and reopening

## Step 7: Create the app in Play Console
**Home → Create app:**
- App name: `BO KATA: Kite Fighting`
- Default language: English (United States)
- App or game: **Game**. Free or paid: **Free**.
- Tick the declarations → **Create app**

## Step 8: Store listing
**Grow users → Store presence → Main store listing:**

| Field | Paste |
|---|---|
| App name | BO KATA: Kite Fighting |
| Short description | Real-time kite fighting on festival rooftops. Cross threads, shout BO KATA! |
| Full description | the full description from `LISTING.md` |
| App icon | `bokata/www/icons/icon-512.png` |
| Feature graphic | `bokata/store/graphics/play-feature-1024x500.png` |
| Phone screenshots | `bokata/store/graphics/play-phone-1…6.png` |
| 7-inch tablet screenshots | the same phone screenshots |
| 10-inch tablet screenshots | `bokata/store/graphics/play-tablet-1…6.png` |

**Store settings:**
- Category: Game → **Action**
- Tags: Casual, Multiplayer, Competitive multiplayer, Offline, Stylized
- Email: your support email · Website: your server address

## Step 9: App content (Policy → App content): answer every section
| Section | Answer |
|---|---|
| Privacy policy | `https://<your-app>.onrender.com/privacy.html` |
| App access | All functionality is available without special access |
| Ads | No, my app does not contain ads |
| Content rating | Start the questionnaire. Category: **Game**. Violence, blood, sex, language, drugs, gambling: **No**. "Users can interact": **Yes** (online nicknames, no chat). Location sharing: No. Digital purchases: No. |
| Target audience | **13–15, 16–17, 18+**. Do not tick under-13 for the first release; it triggers the extra Families review. |
| News app | No |
| Data safety | See below |
| Government app / Financial features / Health | No / None / No |
| Advertising ID | No, the app does not use an advertising ID |

**Data safety form:**
1. Does your app collect or share user data? **Yes**
2. Is all user data encrypted in transit? **Yes** (your server uses HTTPS/WSS)
3. Do you provide a way to request deletion? **No** (explain: no data is stored)
4. Data types:
   - **Personal info → Name**: Collected (not shared) · Processed ephemerally: **Yes** · Optional · Purpose: **App functionality**
   - **App activity → Other user-generated content / Other actions**: same answers
5. Submit.

(If you launch **offline-only** with no server: answer **No, the app does not collect or share data**.)

## Step 10: Closed test (required for new personal accounts)
1. **Test and release → Testing → Closed testing → Create track** (or use "Alpha").
2. **Testers:** create an email list with **at least 12 people** (friends and family with Android phones and Gmail). Save.
3. **Create release:**
   - Keep **Play App Signing** on (the default: Google holds the final signing key, and you keep your upload key).
   - Upload **`app-release.aab`**.
   - Release name: `1.0.0 (1)`. Release notes: *First flight! Real-time kite fighting on festival rooftops…*
4. **Review release → Start rollout to Closed testing.** Countries: choose all, or your main markets.
5. Send testers the **opt-in link** (on the Testers tab). Each must accept it and install from Play.
6. Keep **12+ testers opted in for 14 consecutive days.** Ask them to really play, and fix anything they report. Each new AAB needs a higher `versionCode`.

## Step 11: Apply for production
After 14 days: **Dashboard → Apply for production access**. You answer questions about the test (how many testers, what feedback, what you changed). Then:
1. **Production → Countries/regions:** add countries.
2. **Create new release** → reuse the tested AAB → **Review → Start rollout to Production**.
3. Google reviews it, usually within a few days (it can take up to a week or two for new accounts).
4. When approved, the game is live at `https://play.google.com/store/apps/details?id=com.bokata.kites` (or your own package name).

## Step 12: After launch
- **Monitoring:**
  - Play Console → Quality → **Android vitals** (crashes, ANRs).
  - Ratings and reviews: reply to players.
  - Your server: `/health` and Render's CPU and memory graphs.
- **Updates:** change code → raise `versionCode` and `versionName` → run the workflow → Production → Create release → upload the new AAB.
- **Staged rollout:** release updates to 20% of users first, then 100%.

---

## Common rejection reasons and how this build avoids them
| Reason | Status |
|---|---|
| Missing or unreachable privacy policy | Hosted by your server. Fill in your email. |
| Target API too low | The build targets API 36. |
| Broken features for reviewers | ONLINE stays hidden until a server is set, and bots fill empty seats. |
| Metadata policy (misleading claims, keyword stuffing) | The listing text avoids superlatives and fake claims. |
| User-generated content without moderation | Nicknames are filtered and can be hidden; there is no chat. |
| Impersonating another app | Search Play for "Bo Kata" first. If the name is taken, change the title. |
