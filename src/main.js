import Phaser from 'phaser';
import StreetScene from './scenes/StreetScene.js';
import HomeScene from './scenes/HomeScene.js';
import ShopScene from './scenes/ShopScene.js';
import CreatorScene from './scenes/CreatorScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import { gameState } from './state/gameState.js';
import { supabase, isOnline } from './state/supabase.js';
import { supabaseBackend } from './state/storage.js';
import { getSession } from './state/account.js';
import { showLoginScreen } from './ui/LoginScreen.js';
import './audio/Music.js'; // calm background music (starts on your first click or key press)

// 1. Who's playing? If you're already logged in (Supabase remembers you),
//    skip the login screen. With no Supabase keys (see .env.example) the
//    game runs in guest mode and saves to this browser only.
let session = null;
if (isOnline) {
  session = (await getSession()) ?? (await showLoginScreen());
  gameState.useBackend(supabaseBackend(supabase, session.user.id));
}

// 2. Load the save (coins, and offline earnings), then start the game.
await gameState.load();

// 3. New here? The character creator starts with the name you signed up
//    with (Supabase keeps it as display_name).
gameState.signupName = session?.user.user_metadata?.display_name ?? null;

// While developing (npm run dev), type `pawPal` in the browser console to
// poke at the save: pawPal.coins, pawPal.addCoins(500), pawPal.reset().
if (import.meta.env.DEV) window.pawPal = gameState;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: '#16232f',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // The first scene in the list starts. Brand-new players make their
  // character first; everyone else goes straight to the street.
  scene: gameState.hasCharacter
    ? [StreetScene, HomeScene, ShopScene, CreatorScene]
    : [CreatorScene, StreetScene, HomeScene, ShopScene],
});
