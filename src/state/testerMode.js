// Tester mode: see and buy EVERYTHING, like `npm run dev`, but on the live
// site and only for accounts listed in the `testers` table (supabase/schema.sql).
// Regular players never get it: the table can only be filled in from the
// Supabase dashboard, and each player can only check their own row.
//
// What it turns on:
//   - every item is for sale, in any season (seasons.js)
//   - shop rotation starts OFF, so every shelf shows everything (stock.js);
//     in a shop, T turns rotation on/off and R skips to the next restock
//   - console helpers: pawPal.addCoins(1000), pawPal.addGlimmers(20),
//     pawPalStock.toggle(), pawPalStock.restock()

let on = import.meta.env.DEV; // npm run dev is always tester mode

export function isTester() {
  return on;
}

// Ask the database whether this account is a tester. Call once after login.
export async function loadTesterMode(supabase, userId) {
  if (on || !supabase || !userId) return on;
  const { data, error } = await supabase.from('testers').select('user_id').eq('user_id', userId).maybeSingle();
  if (error) console.warn('Could not check tester mode', error.message);
  on = !!data;
  if (on) console.log('%cTester mode is on: every item is for sale.', 'color:#d9a646');
  return on;
}
