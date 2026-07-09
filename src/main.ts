import { appName } from './meta.js';
import {
  clearProfile,
  createProfile,
  loadProfile,
  saveProfile,
  validateCredentials,
  type Profile,
} from './app/session.js';
import { startTicker, type TickerHandle } from './app/ticker.js';
import { createFeed, parseSeed } from './core/feed.js';
import { formatGbpPence } from './core/format.js';
import { applyTicks, renderWatchlist } from './ui/watchlist.js';

// App orchestration (MF-04/05): login screen <-> trading shell.
// The order panel / history / responsive slices land in MF-06..MF-08.

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('App shell mount point #app not found');
const root: HTMLElement = app;

// One feed per page load, seeded from ?seed= (deterministic test mode, NFR-1).
const feed = createFeed(parseSeed(new URLSearchParams(location.search).get('seed')));
let ticker: TickerHandle | null = null;

function stopTicker(): void {
  ticker?.stop();
  ticker = null;
}

function renderLogin(errorMessages: string[] = []): void {
  root.innerHTML = `
    <header class="app-header">
      <h1 data-testid="app-title">${appName}</h1>
      <p class="tagline">demo trading — no real money, no live data</p>
    </header>
    <section class="pane login-pane" aria-labelledby="login-heading">
      <h2 id="login-heading">Sign in</h2>
      <form data-testid="login-form" novalidate>
        <label>Email
          <input type="email" name="email" data-testid="login-email" autocomplete="username" required>
        </label>
        <label>Password
          <input type="password" name="password" data-testid="login-password" autocomplete="current-password" required>
        </label>
        <div class="form-errors" data-testid="login-errors" role="alert">
          ${errorMessages.map((m) => `<p>${m}</p>`).join('')}
        </div>
        <button type="submit" data-testid="login-submit">Sign in</button>
      </form>
      <p class="hint">Any well-formed email and password signs into a fresh £10,000 demo profile.</p>
    </section>
  `;

  const form = root.querySelector<HTMLFormElement>('[data-testid="login-form"]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const problems = validateCredentials(email, password);
    if (problems.length > 0) {
      renderLogin(problems.map((p) => p.message));
      return;
    }
    const profile = createProfile(email);
    saveProfile(localStorage, profile);
    renderShell(profile);
  });
}

function renderShell(profile: Profile): void {
  stopTicker();
  root.innerHTML = `
    <header class="app-header shell-header">
      <h1 data-testid="app-title">${appName}</h1>
      <div class="session-info">
        <span data-testid="account-email">${profile.email}</span>
        <span class="balance" data-testid="account-balance">${formatGbpPence(profile.balancePence)}</span>
        <button type="button" data-testid="sign-out">Sign out</button>
      </div>
    </header>
    <div data-testid="trading-shell" data-seed="${feed.seed}">
      ${renderWatchlist(feed)}
      <section class="pane">
        <p class="hint">Orders and history arrive in MF-06..MF-08.</p>
      </section>
    </div>
  `;

  ticker = startTicker(feed, (ticks) => applyTicks(root, ticks));

  root
    .querySelector<HTMLButtonElement>('[data-testid="sign-out"]')
    ?.addEventListener('click', () => {
      stopTicker();
      clearProfile(localStorage);
      renderLogin();
    });
}

const existing = loadProfile(localStorage);
if (existing) {
  renderShell(existing);
} else {
  renderLogin();
}
