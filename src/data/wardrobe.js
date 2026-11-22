// The big wardrobe: every outfit piece the clothes shop and the PJ store sell
// on top of the first few in SHOP_STOCK (src/config.js puts these lists into
// SHOP_STOCK, so everything that works for shop items works for these).
//
// Same fields as SHOP_STOCK (see the long comment above it in config.js):
//   id, name, desc, price (coins) or glimmers, cat (shop tab), wear (body slot),
//   tags (style labels, ONLY for us, never shown to players), season, rarity.
// Two extra ones for clothes:
//   fullBody: true -> a dress or one-piece: it takes the place of your bottoms
//   sleeves: true  -> long sleeves: the art script also draws
//                     wear-<id>-arms.png, which goes over your arms
//
// Pictures: tools/art/wardrobe.js draws every one of these (the character
// layer wear-<id>.png and the shop picture item-<id>.png). `npm run art`
// stops with an error if an item here has no drawing there.
//
// Prices: everyday things 30-150 coins; fancy or rare things 2-5 Glimmers.

// ---------- clothes shop ----------

const TOPS = [
  { id: 'basic-tee', name: 'Basic Tee', price: 35, tags: ['casual'], desc: 'A soft white tee. Goes with everything.' },
  { id: 'cropped-tee', name: 'Cropped Tee', price: 40, tags: ['y2k', 'casual'], desc: 'A short sage tee that shows a little tummy.' },
  { id: 'baby-tee', name: 'Baby Tee', price: 40, tags: ['y2k', 'girly'], desc: 'Tiny, tight and pink, with a little heart.' },
  { id: 'ringer-tee', name: 'Ringer Tee', price: 40, tags: ['casual', 'y2k'], desc: 'Cream tee with cherry red trim.' },
  { id: 'graphic-tee', name: 'Graphic Tee', price: 45, tags: ['emo', 'casual'], desc: 'A faded charcoal tee with a moth print.' },
  { id: 'band-tee', name: 'Band Tee', price: 50, tags: ['emo'], desc: 'Black tee from a band nobody else knows.' },
  { id: 'tank-top', name: 'Tank Top', price: 30, tags: ['casual'], desc: 'A simple ribbed tank in dusty blue.' },
  { id: 'camisole', name: 'Camisole', price: 40, tags: ['girly'], desc: 'Silky pink cami with a lace edge.' },
  { id: 'halter-top', name: 'Halter Top', price: 45, tags: ['y2k'], desc: 'Ties behind the neck. Very 2003.' },
  { id: 'tube-top', name: 'Tube Top', price: 40, tags: ['y2k'], desc: 'A stretchy lilac band. No straps!' },
  { id: 'long-sleeve', name: 'Long Sleeve Tee', price: 45, sleeves: true, tags: ['casual'], desc: 'An oatmeal tee for cool evenings.' },
  { id: 'striped-long-sleeve', name: 'Striped Long Sleeve', price: 50, sleeves: true, tags: ['casual', 'emo'], desc: 'Black and white stripes, all the way down.' },
  { id: 'mesh-top', name: 'Mesh Top', price: 50, sleeves: true, tags: ['emo'], desc: 'See-through black mesh. Layer it up.' },
  { id: 'fishnet-layer', name: 'Fishnet Layer', price: 45, sleeves: true, tags: ['emo'], desc: 'A black tank with fishnet sleeves.' },
  { id: 'peasant-blouse', name: 'Peasant Blouse', price: 55, tags: ['cottagecore'], desc: 'Loose and white with stitched flowers.' },
  { id: 'puff-sleeve-blouse', name: 'Puff Sleeve Blouse', price: 60, tags: ['cottagecore', 'girly'], desc: 'Big puffy sleeves, like a storybook.' },
  { id: 'lace-blouse', name: 'Lace Trim Blouse', price: 60, tags: ['girly'], desc: 'A cream blouse with a lacy collar.' },
  { id: 'ruffle-blouse', name: 'Ruffle Blouse', price: 60, tags: ['girly'], desc: 'Rows of soft pink ruffles down the front.' },
  { id: 'corset-top', name: 'Corset Top', glimmers: 2, rarity: 'uncommon', tags: ['girly', 'emo'], desc: 'Laced up the front, with puffy sleeves.' },
  { id: 'turtleneck', name: 'Turtleneck', price: 55, sleeves: true, tags: ['casual', 'emo'], desc: 'A cozy plum turtleneck. Very mysterious.' },
  { id: 'off-shoulder-sweater', name: 'Off-Shoulder Sweater', price: 65, sleeves: true, tags: ['girly'], desc: 'A rosy knit that slips off the shoulders.' },
  { id: 'chunky-knit', name: 'Chunky Knit Sweater', price: 75, sleeves: true, tags: ['cottagecore'], desc: 'Thick cable knit, warm as a hug.' },
  { id: 'cropped-sweater', name: 'Cropped Sweater', price: 60, sleeves: true, tags: ['y2k'], desc: 'A short baby blue sweater.' },
  { id: 'cropped-cardigan', name: 'Cropped Cardigan', glimmers: 2, sleeves: true, rarity: 'uncommon', tags: ['y2k', 'girly'], desc: 'Short pink knit with pearly buttons.' },
  { id: 'oversized-cardigan', name: 'Oversized Cardigan', glimmers: 3, sleeves: true, rarity: 'uncommon', tags: ['casual', 'cottagecore'], desc: 'A huge oatmeal knit to get lost in.' },
  { id: 'floral-cardigan', name: 'Floral Cardigan', glimmers: 3, sleeves: true, rarity: 'rare', tags: ['cottagecore'], desc: 'Sage knit dotted with tiny flowers.' },
  { id: 'star-cardigan', name: 'Star Cardigan', glimmers: 3, sleeves: true, rarity: 'rare', tags: ['emo', 'y2k'], desc: 'Black knit with little golden stars.' },
  { id: 'zip-hoodie', name: 'Zip Hoodie', price: 65, sleeves: true, tags: ['casual'], desc: 'A gray zip-up for lazy days.' },
  { id: 'sweater-vest', name: 'Sweater Vest', price: 55, tags: ['cottagecore'], desc: 'A brown argyle vest over a white tee.' },
  { id: 'flannel', name: 'Flannel Shirt', price: 60, sleeves: true, tags: ['casual', 'forest'], desc: 'Red plaid, perfect for chopping wood.' },
  { id: 'denim-jacket', name: 'Denim Jacket', price: 80, sleeves: true, tags: ['casual', 'y2k'], desc: 'A classic jean jacket over a white tee.' },
  { id: 'bomber-jacket', name: 'Bomber Jacket', price: 85, sleeves: true, tags: ['casual'], desc: 'Olive green with stripy cuffs.' },
  { id: 'cozy-shawl', name: 'Cozy Shawl', price: 70, tags: ['forest', 'cottagecore'], desc: 'A mossy wrap with a fringe, over a blouse.' },
  { id: 'reindeer-sweater', name: 'Reindeer Sweater', price: 70, sleeves: true, season: 'winter', tags: ['cottagecore', 'casual'], desc: 'A red knit with a little reindeer.' },
  { id: 'ugly-sweater', name: 'Ugly Sweater', price: 60, sleeves: true, season: 'winter', tags: ['casual'], desc: 'Zigzags, dots and lights. Gloriously ugly.' },
].map((item) => ({ ...item, cat: 'tops', wear: 'top' }));

const DRESSES = [
  { id: 'sundress', name: 'Sundress', price: 70, tags: ['cottagecore', 'girly'], desc: 'A buttery yellow dress for sunny days.' },
  { id: 'pinafore-dress', name: 'Pinafore Dress', price: 75, tags: ['cottagecore'], desc: 'A sage pinafore over a cream blouse.' },
  { id: 'prairie-dress', name: 'Prairie Dress', glimmers: 2, rarity: 'uncommon', tags: ['cottagecore'], desc: 'Long, floaty and covered in tiny flowers.' },
  { id: 'mushroom-dress', name: 'Mushroom Dress', glimmers: 3, rarity: 'rare', tags: ['forest', 'cottagecore'], desc: 'A red toadstool skirt with white spots.' },
  { id: 'puff-dress', name: 'Pastel Puff Dress', glimmers: 2, rarity: 'uncommon', tags: ['girly'], desc: 'Pink with big puffy sleeves and a bow.' },
  { id: 'tutu-dress', name: 'Tutu Dress', glimmers: 2, rarity: 'uncommon', tags: ['girly'], desc: 'A fluffy tulle skirt for twirling.' },
  { id: 'sailor-dress', name: 'Sailor Dress', price: 85, tags: ['girly', 'y2k'], desc: 'A navy collar and a red bow.' },
  { id: 'layered-dress', name: 'Black Layered Dress', glimmers: 3, rarity: 'rare', tags: ['emo'], desc: 'Tiers of black lace, like a raven.' },
  { id: 'plaid-dress', name: 'Plaid Skirt Dress', price: 80, tags: ['emo'], desc: 'A black top on a red plaid skirt.' },
  { id: 'slip-dress', name: 'Slip Dress', price: 60, tags: ['y2k', 'girly'], desc: 'Shiny champagne satin, very simple.' },
  { id: 'babydoll-dress', name: 'Babydoll Dress', price: 70, tags: ['y2k', 'girly'], desc: 'Short, swingy and lilac.' },
  { id: 'denim-overalls', name: 'Denim Overalls', price: 75, tags: ['casual'], desc: 'Blue overalls over a striped tee.' },
  { id: 'corduroy-overalls', name: 'Corduroy Overalls', price: 80, tags: ['cottagecore'], desc: 'Rust corduroy overalls over a cream tee.' },
  { id: 'shortalls', name: 'Shortalls', price: 70, tags: ['casual', 'y2k'], desc: 'Overall shorts over a pink tee.' },
  { id: 'jumper-dress', name: 'Jumper Dress', price: 70, sleeves: true, tags: ['cottagecore', 'casual'], desc: 'A long knit dress, like a big sweater.' },
  { id: 'witch-dress', name: 'Witchy Cape Dress', glimmers: 4, rarity: 'rare', tags: ['forest', 'emo'], desc: 'A long black dress with a purple cape.' },
  { id: 'snowflake-dress', name: 'Snowflake Dress', glimmers: 3, rarity: 'rare', season: 'winter', tags: ['girly'], desc: 'Icy blue with snowflakes and fluffy trim.' },
].map((item) => ({ ...item, cat: 'dresses', wear: 'top', fullBody: true }));

const BOTTOMS = [
  { id: 'flared-jeans', name: 'Flared Jeans', price: 60, tags: ['y2k'], desc: 'Jeans that bell out at the bottom.' },
  { id: 'baggy-jeans', name: 'Baggy Jeans', price: 60, tags: ['y2k', 'casual'], desc: 'Big, loose light-wash jeans.' },
  { id: 'low-rise-jeans', name: 'Low-Rise Jeans', price: 60, tags: ['y2k'], desc: 'Dark jeans with a butterfly belt.' },
  { id: 'black-cargo', name: 'Black Cargos', price: 65, tags: ['emo', 'y2k'], desc: 'Black cargo pants with dangly straps.' },
  { id: 'patchwork-pants', name: 'Patchwork Pants', glimmers: 2, rarity: 'uncommon', tags: ['cottagecore', 'forest'], desc: 'Sewn from scraps of every color.' },
  { id: 'leggings', name: 'Leggings', price: 35, tags: ['casual'], desc: 'Comfy black leggings.' },
  { id: 'sweatpants', name: 'Sweatpants', price: 45, tags: ['casual'], desc: 'Gray joggers with cuffs at the ankle.' },
  { id: 'denim-shorts', name: 'Denim Shorts', price: 40, tags: ['casual', 'y2k'], desc: 'Cut-offs with a frayed edge.' },
  { id: 'bike-shorts', name: 'Bike Shorts', price: 35, tags: ['casual', 'y2k'], desc: 'Snug black shorts. Ready to ride.' },
  { id: 'athletic-shorts', name: 'Athletic Shorts', price: 35, tags: ['casual'], desc: 'Red gym shorts with a white stripe.' },
  { id: 'ruffle-shorts', name: 'Ruffle Shorts', price: 45, tags: ['girly'], desc: 'Pink shorts with a frilly hem.' },
].map((item) => ({ ...item, cat: 'bottoms', wear: 'bottom' }));

const SKIRTS = [
  { id: 'mini-skirt', name: 'Mini Skirt', price: 40, tags: ['y2k'], desc: 'A short denim mini.' },
  { id: 'pleated-skirt', name: 'Pleated Skirt', price: 50, tags: ['girly'], desc: 'A crisp pleated skirt in baby pink.' },
  { id: 'tiered-skirt', name: 'Tiered Skirt', price: 55, tags: ['cottagecore'], desc: 'Three soft tiers in creamy calico.' },
  { id: 'tulle-skirt', name: 'Tulle Skirt', price: 65, rarity: 'uncommon', tags: ['girly'], desc: 'Layers of puffy lilac tulle.' },
  { id: 'long-skirt', name: 'Long Flowy Skirt', price: 60, tags: ['cottagecore', 'forest'], desc: 'A long moss green skirt that swishes.' },
].map((item) => ({ ...item, cat: 'skirts', wear: 'bottom' }));

const HATS = [
  { id: 'baseball-cap', name: 'Baseball Cap', price: 35, tags: ['casual'], desc: 'A navy cap with a little acorn on it.' },
  { id: 'trucker-hat', name: 'Trucker Hat', price: 40, tags: ['y2k'], desc: 'Pink front, mesh back. So 2004.' },
  { id: 'beanie', name: 'Beanie', price: 35, tags: ['casual', 'emo'], desc: 'A plain charcoal knit beanie.' },
  { id: 'pom-beanie', name: 'Pom-Pom Beanie', price: 40, tags: ['cottagecore'], desc: 'A cream knit with a big fluffy pom.' },
  { id: 'cat-beanie', name: 'Cat Ear Beanie', price: 45, tags: ['girly', 'emo'], desc: 'A black beanie with pointy cat ears.' },
  { id: 'newsboy-cap', name: 'Newsboy Cap', price: 45, tags: ['cottagecore'], desc: 'A tweedy brown cap. Extra extra!' },
  { id: 'cowl-hood', name: 'Cowl Hood', price: 55, tags: ['forest', 'emo'], desc: 'A deep green hood for misty walks.' },
  { id: 'sun-hat', name: 'Straw Sun Hat', price: 50, season: 'summer', tags: ['cottagecore'], desc: 'A wide straw hat with a ribbon.' },
  { id: 'witch-hat', name: 'Witch Hat', glimmers: 3, rarity: 'rare', tags: ['forest', 'emo'], desc: 'Tall, pointy and a little crooked.' },
  { id: 'princess-hat', name: 'Princess Cone Hat', glimmers: 2, rarity: 'uncommon', tags: ['girly'], desc: 'A tall pink cone with a floaty veil.' },
  { id: 'bow-headband', name: 'Bow Headband', price: 35, tags: ['girly'], desc: 'A big pink bow on a headband.' },
  { id: 'mushroom-hat', name: 'Mushroom Hat', glimmers: 2, rarity: 'uncommon', tags: ['forest'], desc: 'A red toadstool cap with white spots.' },
  { id: 'bunny-hat', name: 'Bunny Hat', price: 50, tags: ['girly'], desc: 'A fluffy white hat with floppy ears.' },
  { id: 'earmuffs', name: 'Earmuffs', price: 40, season: 'winter', tags: ['girly', 'casual'], desc: 'Fluffy pink muffs for frosty mornings.' },
  { id: 'santa-hat', name: 'Santa Hat', price: 45, season: 'winter', tags: ['casual'], desc: 'Red and white, with a jingly pom.' },
].map((item) => ({ ...item, cat: 'hats', wear: 'head' }));

const SHOES = [
  { id: 'platform-sneakers', name: 'Platform Sneakers', price: 70, tags: ['y2k'], desc: 'White sneakers on super thick soles.' },
  { id: 'ankle-boots', name: 'Ankle Boots', price: 65, tags: ['cottagecore', 'casual'], desc: 'Brown leather boots, nicely worn in.' },
  { id: 'combat-boots', name: 'Combat Boots', price: 75, tags: ['emo'], desc: 'Chunky black boots with laces.' },
  { id: 'mary-janes', name: 'Mary Janes', price: 60, tags: ['girly', 'cottagecore'], desc: 'Black strap shoes with frilly socks.' },
  { id: 'ballet-flats', name: 'Ballet Flats', price: 50, tags: ['girly'], desc: 'Pink flats with ribbons up the ankle.' },
  { id: 'clogs', name: 'Clogs', price: 55, tags: ['cottagecore', 'forest'], desc: 'Wooden clogs. Clip clop!' },
  { id: 'fuzzy-boots', name: 'Fuzzy Boots', price: 70, tags: ['y2k', 'girly'], desc: 'Tall, fluffy and very cozy.' },
].map((item) => ({ ...item, cat: 'shoes', wear: 'feet' }));

const BAGS = [
  { id: 'shoulder-bag', name: 'Shoulder Bag', price: 55, tags: ['y2k', 'girly'], desc: 'A tiny pink bag on a short strap.' },
].map((item) => ({ ...item, cat: 'bags', wear: 'bag' }));

// Little things: hair bits, glasses, necklaces...
const ACCESSORIES = [
  { id: 'butterfly-clips', name: 'Butterfly Clips', price: 30, wear: 'hair', tags: ['y2k', 'girly'], desc: 'Two glittery butterflies for your hair.' },
  { id: 'star-clips', name: 'Star Clips', price: 30, wear: 'hair', tags: ['y2k', 'emo'], desc: 'A pair of golden star clips.' },
  { id: 'pearl-clips', name: 'Pearl Clips', price: 35, wear: 'hair', tags: ['girly'], desc: 'A row of shiny pearls.' },
  { id: 'scrunchie', name: 'Scrunchie', price: 30, wear: 'hair', tags: ['y2k', 'casual'], desc: 'A puffy pink velvet scrunchie.' },
  { id: 'hair-ribbon', name: 'Hair Ribbon', price: 30, wear: 'hair', tags: ['girly', 'cottagecore'], desc: 'A soft red ribbon tied in a bow.' },
  { id: 'cat-eye-glasses', name: 'Cat-Eye Glasses', price: 45, wear: 'face', tags: ['girly'], desc: 'Glasses with flicky corners.' },
  { id: 'round-glasses', name: 'Round Glasses', price: 40, wear: 'face', tags: ['cottagecore'], desc: 'Thin gold frames for reading.' },
  { id: 'tinted-shades', name: 'Tinted Shades', price: 45, wear: 'face', tags: ['y2k'], desc: 'Little pink lenses. Rose-colored!' },
  { id: 'choker', name: 'Choker', price: 30, wear: 'neck', tags: ['emo', 'y2k'], desc: 'Black velvet with a tiny silver ring.' },
  { id: 'bell-collar', name: 'Bell Collar', price: 35, wear: 'neck', tags: ['girly'], desc: 'A pink ribbon with a jingly bell.' },
  { id: 'bandana', name: 'Bandana', price: 30, wear: 'neck', tags: ['casual', 'cottagecore'], desc: 'A red bandana tied around your neck.' },
].map((item) => ({ ...item, cat: 'acc' }));

const EXTRAS = [
  { id: 'scarf', name: 'Knit Scarf', price: 40, wear: 'neck', tags: ['cottagecore', 'casual'], desc: 'A long striped scarf.' },
  { id: 'mittens', name: 'Mittens', price: 35, wear: 'hands', season: 'winter', tags: ['cottagecore'], desc: 'Red knit mittens on a string.' },
  { id: 'arm-warmers', name: 'Arm Warmers', price: 35, wear: 'hands', tags: ['emo', 'y2k'], desc: 'Stripy black and pink arm warmers.' },
  { id: 'belt', name: 'Leather Belt', price: 30, wear: 'waist', tags: ['casual'], desc: 'Brown leather with a brass buckle.' },
  { id: 'chain-belt', name: 'Chain Belt', price: 40, wear: 'waist', tags: ['emo', 'y2k'], desc: 'A silver chain that hangs at your hip.' },
  { id: 'tights', name: 'Black Tights', price: 30, wear: 'legs', tags: ['emo', 'casual'], desc: 'Plain black tights. Go with anything.' },
  { id: 'striped-stockings', name: 'Striped Stockings', price: 35, wear: 'legs', tags: ['emo', 'girly'], desc: 'Long black and white stripes.' },
  { id: 'lace-stockings', name: 'Lace Stockings', price: 40, wear: 'legs', tags: ['girly', 'cottagecore'], desc: 'White stockings with a lacy top.' },
  { id: 'fairy-wings', name: 'Fairy Wings', glimmers: 3, wear: 'charm', rarity: 'rare', tags: ['forest', 'girly'], desc: 'Shimmery wings. They wiggle as you walk.' },
  { id: 'tail-bow', name: 'Tail Bow', price: 40, wear: 'charm', tags: ['girly'], desc: 'A satin bow with a bell, for your tail.' },
].map((item) => ({ ...item, cat: 'extras' }));

// ---------- PJ store ----------

const SLEEPWEAR = [
  { id: 'pajama-pants', name: 'Plaid PJ Pants', price: 40, cat: 'lounge', wear: 'bottom', tags: ['casual', 'cottagecore'], desc: 'Soft flannel PJ pants in sage plaid.' },
  { id: 'kimono-robe', name: 'Kimono Robe', price: 90, cat: 'lounge', wear: 'top', fullBody: true, sleeves: true, tags: ['girly', 'forest'], desc: 'A plum robe with cherry blossoms.' },
  { id: 'slippers', name: 'Slippers', price: 35, cat: 'feet', wear: 'feet', tags: ['casual'], desc: 'Simple cozy slippers in moss green.' },
];

// Winter things also go in the clothes shop's Winter catalogue book.
const winterBook = (item) => (item.season === 'winter' ? { ...item, books: ['winter'] } : item);

export const WARDROBE = {
  clothes: [...TOPS, ...DRESSES, ...BOTTOMS, ...SKIRTS, ...HATS, ...SHOES, ...BAGS, ...ACCESSORIES, ...EXTRAS].map(winterBook),
  pjs: SLEEPWEAR,
};
