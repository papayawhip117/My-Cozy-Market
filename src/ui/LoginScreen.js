import './login.css';
import { login, signUp, getSession } from '../state/account.js';

// The login / sign-up screen, shown before the game starts.
//
// It's an HTML form laid over the page (not drawn in Phaser), because
// real <input> boxes give you typing, pasting, autofill and password
// managers for free. Styles are in login.css.
//
//   const session = await showLoginScreen(); // waits until you're logged in

export function showLoginScreen() {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'login';
    root.innerHTML = `
      ${fireflies(7)}
      <div class="login-panel">
        <h1 class="login-title">Paw Pal</h1>
        <p class="login-sub">a cozy forest bazaar</p>

        <div class="login-tabs" role="tablist">
          <button type="button" role="tab" data-tab="login" aria-selected="true">Log in</button>
          <button type="button" role="tab" data-tab="signup" aria-selected="false">Sign up</button>
        </div>

        <form data-form="login">
          <label>Email
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <label>Password
            <input name="password" type="password" autocomplete="current-password" required />
          </label>
          <button class="login-submit" type="submit">Log in</button>
        </form>

        <form data-form="signup" hidden>
          <label>Invite code
            <input name="inviteCode" autocomplete="off" autocapitalize="characters" spellcheck="false" required />
            <span class="hint">Paw Pal is invite-only for now.</span>
          </label>
          <label>Your pal's name
            <input name="displayName" autocomplete="nickname" maxlength="24" required />
          </label>
          <label>Email
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <label>Password
            <input name="password" type="password" autocomplete="new-password" minlength="6" required />
            <span class="hint">At least 6 characters.</span>
          </label>
          <button class="login-submit" type="submit">Join the bazaar</button>
        </form>

        <p class="login-msg" role="status" aria-live="polite"></p>
      </div>
    `;
    document.body.appendChild(root);

    const $ = (sel) => root.querySelector(sel);
    const msg = $('.login-msg');
    const forms = { login: $('[data-form="login"]'), signup: $('[data-form="signup"]') };

    const say = (text, kind = 'error') => {
      msg.textContent = text;
      msg.className = `login-msg ${kind}`;
    };

    // Switch between the two tabs.
    function showTab(name) {
      for (const tab of root.querySelectorAll('[data-tab]')) {
        tab.setAttribute('aria-selected', String(tab.dataset.tab === name));
      }
      forms.login.hidden = name !== 'login';
      forms.signup.hidden = name !== 'signup';
      say('');
      forms[name].querySelector('input').focus();
    }
    for (const tab of root.querySelectorAll('[data-tab]')) {
      tab.addEventListener('click', () => showTab(tab.dataset.tab));
    }

    // Done: fade the screen away and hand the session to main.js.
    async function finish() {
      const session = await getSession();
      root.classList.add('leaving');
      setTimeout(() => root.remove(), 400);
      resolve(session);
    }

    // Disable the button while waiting for the server, so it isn't double-clicked.
    async function busy(form, work) {
      const button = form.querySelector('button[type="submit"]');
      const label = button.textContent;
      button.disabled = true;
      button.textContent = 'One moment...';
      try {
        return await work();
      } catch (err) {
        console.error(err);
        return { ok: false, error: 'Something went wrong. Please try again.' };
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    }

    forms.login.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(forms.login);
      const result = await busy(forms.login, () => login(f.get('email'), f.get('password')));
      if (result.ok) finish();
      else say(result.error);
    });

    forms.signup.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(forms.signup);
      const result = await busy(forms.signup, () =>
        signUp({
          inviteCode: f.get('inviteCode'),
          displayName: f.get('displayName'),
          email: f.get('email'),
          password: f.get('password'),
        }),
      );
      if (!result.ok) return say(result.error);
      if (result.needsConfirm) {
        // Email confirmation is on in Supabase: they log in after clicking the link.
        showTab('login');
        forms.login.email.value = f.get('email');
        return say('Welcome! Check your email for a link to confirm your account, then log in here.', 'good');
      }
      finish();
    });

    forms.login.querySelector('input').focus();
  });
}

// Little glowing dots scattered around the sky.
function fireflies(count) {
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = 5 + Math.random() * 90;
    const top = 20 + Math.random() * 60;
    const delay = (-Math.random() * 7).toFixed(1);
    html += `<span class="firefly" style="left:${left}%;top:${top}%;animation-delay:${delay}s"></span>`;
  }
  return html;
}
