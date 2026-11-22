// Glimmers: the second, rarer currency (coins are set up in COINS in
// src/config.js). Rare and fancy things in the shops cost Glimmers.
//
// You get them two ways:
//   1. Passively, just with time: 5 an hour, even while the game is closed
//      (but time away only counts up to 8 hours, so 40 at most).
//   2. An active bonus: 5 more for every 30 minutes you're really playing
//      (the tab is open and you've pressed a key or moved the mouse in the
//      last couple of minutes). Up to 8 hours of play a day count.
//
// Achievements and mini games will hand out Glimmers too, later.
export const GLIMMERS = {
  passivePerHour: 5,
  offlineCapHours: 8, // time away counts up to this long (8h x 5 = 40)
  activeBonus: 5, // Glimmers for each stretch of active play...
  activeMinutes: 30, // ...this many minutes long
  activeCapHours: 8, // at most this much active play counts each day
  idleAfterSeconds: 120, // no key or mouse for this long = not playing right now
};
