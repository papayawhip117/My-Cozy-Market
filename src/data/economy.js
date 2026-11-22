// Glimmers: the second, rarer currency (coins are set up in COINS in
// src/config.js). Rare and fancy things in the shops cost Glimmers.
//
// You get them two ways:
//   1. Passively, just with time: 5 an hour while the game is open, and a
//      slower 2 an hour while it's closed (time away only counts up to
//      8 hours, so 16 at most).
//   2. An active bonus: 5 more for every 30 minutes you're really playing
//      (the tab is open and you've pressed a key or moved the mouse in the
//      last couple of minutes). Up to 8 hours of play a day count.
//
// Achievements and mini games will hand out Glimmers too, later.
export const GLIMMERS = {
  passivePerHour: 5, // while the game is open
  offlinePerHour: 2, // while you're away (game closed or tab hidden)
  offlineCapHours: 8, // time away counts up to this long (8h x 2 = 16)
  activeBonus: 5, // Glimmers for each stretch of active play...
  activeMinutes: 30, // ...this many minutes long
  activeCapHours: 8, // at most this much active play counts each day
  idleAfterSeconds: 120, // no key or mouse for this long = not playing right now
};
