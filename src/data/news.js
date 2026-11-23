// Update news: letters that arrive in everyone's mailbox (src/state/mailbox.js).
// Each one is delivered once per save, the next time the game opens.
//
// To send news with an update, add a letter to the TOP of this list with a
// new `id` (never reuse or change an old id, or people get it again).
//
//   id     unique name, like 'update-pets'
//   date   'YYYY-MM-DD', shown on the letter
//   title  short, it's shown in the mailbox list (about 20 letters)
//   text   the letter itself (a few short sentences)
//   gift   optional: { coins, glimmers, items: ['item-id', ...] }
//          (you open the letter and press Claim to get it)
export const NEWS = [
  {
    id: 'update-mailbox',
    date: '2026-11-23',
    title: 'You have a mailbox!',
    text:
      'Letters from the market now land here: news about updates, and little rewards when you reach an achievement. ' +
      'Check the Achievements tab to see what you can earn. Here are a few Glimmers to start.',
    gift: { glimmers: 5 },
  },
  {
    id: 'update-big-market',
    date: '2026-11-22',
    title: 'The big market update',
    text:
      'Glimmers are here, a rarer currency for fancy things. The shops now have catalogue books, over a hundred new clothes ' +
      'and a big furniture pack. Timber & Twig opened at the end of the street, and the Seasonal Cart sells things in season.',
  },
  {
    id: 'welcome',
    date: '2026-11-17',
    title: 'Welcome to the market!',
    text:
      'Welcome to My Cozy Market! Your coins grow while you play (and a little while you are away). ' +
      'Spend them in the shops, dress up your pal at the dresser and make your home cozy. Have some coins on us!',
    gift: { coins: 100 },
  },
];

// Who the letters are from.
export const MARKET_KEEPERS = 'The Market Keepers';
