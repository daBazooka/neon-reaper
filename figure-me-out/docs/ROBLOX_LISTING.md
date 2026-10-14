# Roblox listing kit: Figure Me Out (Team Elimination)

Everything you need for the Creator Hub page, in the order the page asks for it. All art is in `docs/icons/` (regenerate with `python3 docs/icons/make_icons.py`; needs Pillow). The art is stylised and drawn by script (blocky Roblox-style avatars), not real Roblox renders. For the best results also add 2 to 3 real screenshots from Play mode in Studio (press the camera button in the Studio test window, or use Windows Snip).

## 1. Icon and thumbnails (Creator Hub > your experience > Game details / Media)
| Use | File | Size |
|---|---|---|
| **Icon** (pick one, best first) | `icons/game_icon_1_hero.png` (big face + number sign + crosshair, the best hook), `game_icon_3_teams.png`, `game_icon_2_number.png`, `game_icon_4_crowd.png` | square |
| **Thumbnails** (up to 10, upload in this order) | `thumbnails/thumbnail_1_hero.png`, `_2_guess`, `_3_elim`, `_4_items`, `_5_rewards`, `_6_quick`, `_7_lobby` | 1920 x 1080 |
| Logo (transparent) | `logo.png` | 1400 x 520 |
| Badge icons (8) | `badges/badge_*.png` | 512 x 512 |

Order matters: thumbnail 1 is the one people see in search, so it is the hero; the next ones explain the game in the order a new player needs it (type the number, red vs blue, gadgets, rewards, short rounds, lobby).

### What I could and could not check (be careful with this section)
- I **could not open Roblox** from my work environment (the connection is blocked), so I could not look at other creators' icons, and I could not download real avatar renders. I read published advice instead, and the pictures here follow it. Treat any "this gets X% more clicks" number you see online as unproven: nobody outside Roblox has your game's real numbers. Your own **Analytics** page is the only judge.
- What the advice agrees on ([Roblox staff on thumbnails](https://devforum.roblox.com/t/5-tips-from-roblox-staff-to-get-the-most-out-of-thumbnail-personalization/3471689), [icon sizes in the Creator Hub docs](https://create.roblox.com/docs/production/promotion/game-icons)):
  - Upload **several thumbnails** (Roblox says keep up to 5 variations active so it can find the best one) and show **real gameplay**, not a fake. Misleading pictures can get a low-quality warning.
  - Icons are shown small (as small as about 150 px), so: **one clear subject, bright contrasting colours, very little text**. Mine is a big face, the number sign, a crosshair and the typed digits.
  - Icon: square, 512 x 512 recommended (mine are 1024 and scale down well). Thumbnails: 16:9, 1920 x 1080, under 3 MB. Keep important text away from the bottom edge, where player counts can cover it.
- The idea my pictures sell is the same one the game sells: **a number on a forehead, a crosshair, and red against blue**. A new player understands it in one second.

### Real Roblox characters (this is the part I could not do for you)
The characters in the pictures are my own blocky Roblox-style drawings. Real renders look better. Two ways to get them (both are yours to do in Studio or on the website):
1. **Studio screenshots (best, shows the real game):** play a 2-player test, stand your two players close together, and take screenshots with the camera button in the test window or Windows Snip. Upload the best 2 or 3 as thumbnails 8 to 10. Real gameplay is exactly what Roblox asks for.
2. **Avatar renders on a transparent background:** in Studio open the **Avatar** tab > **Avatar Preview** (or use any avatar image you own), save PNGs with a transparent background, and put them in `docs/icons/avatars/` named `red_1.png`, `red_2.png`, `blue_1.png`, `blue_2.png`. Then run `python3 docs/icons/make_icons.py thumbs` and it builds `thumbnails/thumbnail_0_real_avatars.png` with your real avatars on the red/blue split. (You can ask me to run it if you drop the files here.)
Use only avatars and items you own or are allowed to use; do not use other people's avatars or the Roblox logo in your pictures.

## 2. Name
**Figure Me Out** (you chose `FigureMeOut`; the page shows it as written, so `Figure Me Out` reads better). Max 50 characters.
Other ideas if you ever want to change it: Figure Me Out: Team Elimination, Number Hunters.

## 3. Description (max 1000 characters; paste this one, 940 characters)
```
RED vs BLUE! Everyone has a secret 4-digit number on a sign on their forehead. Type the number of an enemy and they are OUT. Wipe out the other team to win!

HOW TO PLAY
- Put the dot on an enemy and type their 4 digits (or tap the on-screen number pad). It sends by itself.
- Right number: they are out. Wrong number: you freeze for a moment.
- Hide your own number: a wall in front of your forehead does not count!
- F = take a photo, G = binoculars. Pick up chests for stun grenades, smoke and sound grenades.

FEATURES
- 10 vs 10 team matches, one life each
- Short 4-minute rounds, a new match every 30 seconds
- Winners get bonus coins, and the MVP gets even more
- Daily quests, win streaks and kill streaks
- Six maps you vote on, with a School Yard map first
- Real Roblox avatars and names
- Works on phone, tablet and PC

Invite your friends: the more players, the better the match! Wipe out the other team and claim the win.
```
Shorter version (for a short tagline or social posts): *Type the number on their forehead and wipe out the other team. 10 vs 10, 4-minute matches!*

## 4. Genre and tags
Creator Hub only lets you pick from its own genre list, which changes over time, so choose the closest one you see. Best fits, in order: a party / casual or "all genres" style option, then action or shooter-like. Subgenre: leave as None if nothing fits. A genre can only be changed every 3 months, so decide once.
Search words to use wherever the page asks for keywords or tags: guessing, numbers, team, red vs blue, 10 vs 10, multiplayer, pvp, party, casual, mobile friendly, capture, eliminate, friends.

## 5. Settings to check (Creator Hub > Publish settings and Studio Game Settings)
- **Manage audience**: access Public when you are ready; set it to Private while you test.
- **Max players**: 20 (Studio > Home > Game Settings > Basic Info, or the place settings). Server size 20 fits 10 vs 10.
- **Devices**: Computer, Phone, Tablet on (the game has an on-screen number pad). Console off. VR off.
- **Avatar type**: Player Choice (the game uses real avatars).
- **Content rating** (Publish settings > Content rating): answer the questionnaire honestly. The game has cartoon "eliminations" (a player is sent to the lobby), no blood, no weapons that look real, and no chat features of its own. If asked about violence, choose the mildest option that describes the elimination.
- **Enable Studio access to API services**: not needed, leave it off. (The game saves coins and wins with data stores. They need this on only when testing inside Studio: Game Settings > Security > Enable Studio Access to API Services.)
- **Monetization**: leave for later. Reaching players first matters more.

## 6. Badges (Creator Hub > Engagement > Badges > Create; each costs nothing for the first few)
Badges are created on the website and their IDs are not in the game yet, so for now they are a title for the page. Use each badge image, name and description:
| Badge | Name | Description |
|---|---|---|
| welcome | Welcome! | Joined Figure Me Out |
| first_hit | First Hit | Typed a number right |
| first_win | First Win | Won a match with your team |
| ten_wins | 10 Wins | Won 10 matches |
| streak | Win Streak | Won 3 matches in a row |
| survivor | Survivor | Stayed alive to the end of a match |
| flag_capture | Capture! | Captured the flag |
| explorer | Explorer | Played on a new map |

## 7. After it is live (first week)
- Share the link with friends and ask them to play in groups: the game needs two players, and ten is best.
- Put the play link in your social posts with thumbnail 3 and thumbnail 5.
- Look at **Analytics** after a few days: if players leave in the first minute, the lobby wait is the first thing to shorten (`Config.Match.Intermission`).
