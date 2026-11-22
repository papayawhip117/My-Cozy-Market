// Catalogue books: when you press Shop, you first pick a book to look
// through, like flicking through a catalogue at the counter. Each book is a
// set of tabs (the `cat` ids from SHOP_TABS in config.js), and shows every
// item for sale whose `cat` is one of them.
//
//   { id: 'bedroom', name: 'Bedroom', tabs: ['beds', 'lamps', 'art', 'rugs'] }
//
// To add a book: add a line to its shop below. To add an item: give it a
// `cat` that one of the shop's books lists (and add the tab to SHOP_TABS if
// it's a new one). That's it.
//
// An item can also go in a book its `cat` isn't listed in, by naming the
// book in SHOP_STOCK: { id: 'desk', ..., books: ['bedroom'] }.
//
// Books with nothing in them yet (like Dresses, until we draw some) are
// hidden, so it's fine to add a book before its items. Every shop with
// more than one book also gets an "Everything" book at the end, so nothing
// is ever out of reach.

export const ALL_BOOK = { id: 'all', name: 'Everything' };

export const CATALOGUES = {
  pjs: [
    { id: 'sleepwear', name: 'Sleepwear', tabs: ['sets', 'lounge'] },
    { id: 'cozy', name: 'Cozy Extras', tabs: ['head', 'feet'] },
  ],
  furniture: [
    { id: 'living', name: 'Living Room', tabs: ['chairs', 'tables', 'lamps', 'art', 'rugs'] },
    { id: 'bedroom', name: 'Bedroom', tabs: ['beds', 'lamps', 'art', 'rugs'] },
    { id: 'makeover', name: 'Walls & Floors', tabs: ['walls', 'floors', 'doors'] },
  ],
  plants: [
    { id: 'houseplants', name: 'Houseplants', tabs: ['potted', 'hanging'] },
    { id: 'trees', name: 'Indoor Trees', tabs: ['trees'] },
    { id: 'flowers', name: 'Flowers', tabs: ['flowers'] },
  ],
  clothes: [
    { id: 'tops', name: 'Tops', tabs: ['tops'] },
    { id: 'dresses', name: 'Dresses', tabs: ['dresses'] },
    { id: 'bottoms', name: 'Pants & Skirts', tabs: ['bottoms', 'skirts'] },
    { id: 'shoes', name: 'Shoes', tabs: ['shoes'] },
    { id: 'accessories', name: 'Hats & Bags', tabs: ['hats', 'bags'] },
    { id: 'bits', name: 'Little Extras', tabs: ['acc', 'extras'] },
    // winter things are put in this book by `books: ['winter']` (src/data/wardrobe.js)
    { id: 'winter', name: 'Frosty Finds', tabs: [] },
  ],
};
