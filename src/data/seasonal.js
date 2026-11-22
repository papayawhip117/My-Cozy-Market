// New seasonal decorations. They're added to the plant shop and furniture
// shop lists in src/config.js like any other item, but because they have a
// `season`, only the Seasonal Cart sells them (and only in that season).
// Once bought, you keep them all year. Same fields as SHOP_STOCK in config.js.
//
// Art: tools/art/seasonal.js (shop picture item-<id>.png, and iso-<id>.png
// for floor things; FOOTPRINT sizes are in src/data/furniture.js).
export const SEASONAL_PLANTS = [
  { id: 'festive-tree', name: 'Festive Tree', price: 95, cat: 'trees', season: 'winter', tags: ['cottagecore', 'girly'], desc: 'A little fir with ribbons, baubles and a star.' },
  { id: 'pumpkin-patch', name: 'Pumpkin Patch', price: 45, cat: 'potted', season: 'autumn', tags: ['cottagecore', 'forest'], desc: 'Three round pumpkins and a curly vine.' },
];

export const SEASONAL_FURNITURE = [
  { id: 'holly-garland', name: 'Holly Garland', price: 45, cat: 'wall', season: 'winter', tags: ['cottagecore', 'forest'], desc: 'Holly, berries and tiny lights to drape up high.' },
];
