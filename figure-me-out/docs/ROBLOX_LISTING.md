# Roblox listing kit: Figure Me Out (Team Elimination)

Everything you need for the Creator Hub page, in the order the page asks for it. All art is in `docs/icons/` (regenerate with `python3 docs/icons/make_icons.py`; needs Pillow). The art is stylised and drawn by script (blocky Roblox-style avatars), not real Roblox renders. For the best results also add 2 to 3 real screenshots from Play mode in Studio (press the camera button in the Studio test window, or use Windows Snip).

## 1. Icon and thumbnails (Creator Hub > your experience > Game details / Media)
| Use | File | Size |
|---|---|---|
| **Icon** (pick one, best first) | `icons/game_icon_3_teams.png` (red vs blue, best for the game), `game_icon_1_hero.png`, `game_icon_2_number.png`, `game_icon_4_crowd.png` | square |
| **Thumbnails** (up to 10, upload in this order) | `thumbnails/thumbnail_1_hero.png`, `_2_guess`, `_3_elim`, `_4_items`, `_5_rewards`, `_6_quick`, `_7_lobby` | 1920 x 1080 |
| Logo (transparent) | `logo.png` | 1400 x 520 |
| Badge icons (8) | `badges/badge_*.png` | 512 x 512 |

Order matters: thumbnail 1 is the one people see in search, so it is the hero; the next ones explain the game in the order a new player needs it (type the number, red vs blue, gadgets, rewards, short rounds, lobby).

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
