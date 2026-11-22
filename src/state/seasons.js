// Real-world seasons. Some shop items are seasonal (`season: 'winter'` in
// SHOP_STOCK): shops only sell them while it's that season. If you sell one
// out of season, you can't buy it back until the season comes round again.
//
//   currentSeason()        -> 'autumn'  (from today's date)
//   inSeason('winter')     -> false in autumn; always true for null (not seasonal)

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

// Testing on your own computer (npm run dev)? Everything is for sale, in any
// season, so you can try every item we add. Players on the real site only
// get what's in season. Set this to false to test seasons the way players
// see them (and use SEASON_TEST below to pick the season).
export const SHOW_EVERYTHING = import.meta.env.DEV;

// Want to test another season? Set this to 'spring', 'summer', 'autumn' or
// 'winter'. Leave it null to use today's date. (Don't commit it changed!)
export const SEASON_TEST = null;

// Months 0-11 (January = 0), northern hemisphere: Dec-Feb winter,
// Mar-May spring, Jun-Aug summer, Sep-Nov autumn.
export function currentSeason(date = new Date()) {
  if (SEASON_TEST) return SEASON_TEST;
  return SEASONS[Math.floor(((date.getMonth() + 10) % 12) / 3)];
}

export function inSeason(season, date = new Date()) {
  return SHOW_EVERYTHING || !season || season === currentSeason(date);
}

// 'winter' -> 'Winter'
export function seasonName(season) {
  return season ? season[0].toUpperCase() + season.slice(1) : '';
}
