import { supabase, isOnline } from './supabase.js';
import { gameState } from './gameState.js';

// Logging in, signing up and logging out (Supabase accounts).
//
// Every function returns { ok: true } or { ok: false, error: 'friendly words' },
// so the login screen can just show `error` to the player.
//
// Signing up is invite-only: you need a code from the invite_codes table
// (see supabase/schema.sql). The real check happens in the database, so
// it can't be skipped; checking here first just gives a nicer message.

// The current session (who's logged in), or null.
export async function getSession() {
  if (!isOnline) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function login(email, password) {
  if (!isOnline) return { ok: false, error: 'Accounts are offline right now.' };
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { ok: false, error: friendly(error) } : { ok: true };
}

export async function signUp({ inviteCode, email, password, displayName }) {
  if (!isOnline) return { ok: false, error: 'Accounts are offline right now.' };

  const code = inviteCode.trim().toUpperCase();
  const name = displayName.trim();
  if (!code) return { ok: false, error: 'You need an invite code to join.' };
  if (!name) return { ok: false, error: 'Pick a name for your pal!' };
  if (password.length < 6) return { ok: false, error: 'Your password needs at least 6 characters.' };

  // Ask the database if the code is good before making the account.
  const check = await supabase.rpc('check_invite', { code });
  if (check.error) return { ok: false, error: friendly(check.error) };
  if (!check.data) return { ok: false, error: "That invite code doesn't work. Check the spelling, or ask for a new one." };

  // The database trigger reads these, uses up the code, and makes your profile.
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { invite_code: code, display_name: name } },
  });
  if (error) return { ok: false, error: friendly(error) };

  // If "Confirm email" is on in Supabase, there's no session until the
  // player clicks the link in their email.
  if (!data.session) return { ok: true, needsConfirm: true };
  return { ok: true };
}

// Save, sign out, and go back to the login screen.
// Returns true if you were actually logged out.
export async function logout() {
  if (!isOnline) return false; // guest mode: nothing to log out of
  await gameState.save();
  await gameState.backend.flush?.(); // make sure the cloud save went out
  await supabase.auth.signOut();
  // Reloading starts the game fresh, which shows the login screen.
  window.location.reload();
  return true;
}

// Turn Supabase's error messages into something a player understands.
function friendly(error) {
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('invalid login credentials')) return "That email and password don't match. Try again?";
  if (msg.includes('email not confirmed')) return 'Check your email and click the link to confirm your account first.';
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'There is already an account with that email. Try logging in.';
  if (msg.includes('database error saving new user') || msg.includes('invite'))
    return "That invite code doesn't work (it may already be used).";
  if (msg.includes('password')) return error.message; // e.g. "Password should be at least 6 characters"
  if (msg.includes('email') && msg.includes('invalid')) return "That email address doesn't look right.";
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Too many tries. Wait a minute and try again.';
  if (msg.includes('fetch') || msg.includes('network')) return "Can't reach the server. Check your internet and try again.";
  return error?.message || 'Something went wrong. Please try again.';
}
