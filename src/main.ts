import { appName } from './meta.js';
import {
  clearProfile,
  createProfile,
  loadProfile,
  saveProfile,
  validateCredentials,
  type Profile,
} from './app/session.js';
import { formatGbpPence } from './core/format.js';

// App orchestration (MF-04): login screen <-> trading shell.
// The watchlist / order panel / history slices land in MF-05..MF-08.

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('App shell mount point #app not found');
const root: HTMLElement = app;

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
  root.innerHTML = `
    <header class="app-header shell-header">
      <h1 data-testid="app-title">${appName}</h1>
      <div class="session-info">
        <span data-testid="account-email">${profile.email}</span>
        <span class="balance" data-testid="account-balance">${formatGbpPence(profile.balancePence)}</span>
        <button type="button" data-testid="sign-out">Sign out</button>
      </div>
    </header>
    <section class="pane" data-testid="trading-shell">
      <p class="hint">Watchlist, orders and history arrive in MF-05..MF-08.</p>
    </section>
  `;

  root
    .querySelector<HTMLButtonElement>('[data-testid="sign-out"]')
    ?.addEventListener('click', () => {
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
