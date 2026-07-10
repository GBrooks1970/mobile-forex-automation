import { appName } from './meta.js';
import {
  clearProfile,
  createProfile,
  loadProfile,
  saveProfile,
  validateCredentials,
  type Profile,
} from './app/session.js';
import { Portfolio } from './app/portfolio.js';
import { startTicker, type TickerHandle } from './app/ticker.js';
import { createFeed, parseSeed } from './core/feed.js';
import { formatGbpPence } from './core/format.js';
import { MVP_PAIRS, type CurrencyPair, type TradeDirection } from './core/types.js';
import { applyTicks, renderWatchlist } from './ui/watchlist.js';
import { parseLots2, renderOrderPanel } from './ui/orderPanel.js';
import { renderPositions, updatePositions } from './ui/positions.js';
import { renderHistory } from './ui/history.js';
import { layoutFor } from './ui/layout.js';

// App orchestration (MF-04/05/06): login screen <-> trading shell.
// The close/history and responsive slices land in MF-07..MF-08.

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('App shell mount point #app not found');
const root: HTMLElement = app;

// One feed per page load, seeded from ?seed= (deterministic test mode, NFR-1).
const feed = createFeed(parseSeed(new URLSearchParams(location.search).get('seed')));
let ticker: TickerHandle | null = null;
let portfolio: Portfolio | null = null;
let detachResize: (() => void) | null = null;

function stopTicker(): void {
  ticker?.stop();
  ticker = null;
}

/** Reflect the active breakpoint onto the workspace (mirrors the CSS grid). */
function applyLayout(): void {
  const ws = root.querySelector<HTMLElement>('[data-testid="workspace"]');
  if (ws) ws.dataset['layout'] = layoutFor(window.innerWidth);
}

const rateFor = (pair: CurrencyPair): number | null => feed.gbpQuoteRatePts(pair);

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

/** Refresh the balance + equity readouts (balance changes only on close). */
function refreshAccount(active: Portfolio): void {
  const balance = root.querySelector<HTMLElement>('[data-testid="account-balance"]');
  if (balance) balance.textContent = formatGbpPence(active.balancePence());
  const equity = root.querySelector<HTMLElement>('[data-testid="account-equity"]');
  if (equity) equity.textContent = formatGbpPence(active.equityPence(rateFor));
}

function renderShell(profile: Profile): void {
  stopTicker();
  portfolio = new Portfolio(profile.userId, profile.balancePence);
  const active: Portfolio = portfolio;

  root.innerHTML = `
    <header class="app-header shell-header">
      <h1 data-testid="app-title">${appName}</h1>
      <div class="session-info">
        <span data-testid="account-email">${profile.email}</span>
        <span class="balance">Bal <b data-testid="account-balance">${formatGbpPence(profile.balancePence)}</b></span>
        <span class="equity">Eq <b data-testid="account-equity">${formatGbpPence(profile.balancePence)}</b></span>
        <button type="button" data-testid="sign-out">Sign out</button>
      </div>
    </header>
    <div data-testid="trading-shell" data-seed="${feed.seed}">
      <div class="workspace" data-testid="workspace">
        <div class="col-watch" data-testid="col-watch">
          ${renderWatchlist(feed)}
        </div>
        <div class="col-main" data-testid="col-main">
          ${renderOrderPanel()}
          <div data-testid="positions-mount">${renderPositions(active, feed)}</div>
          <div data-testid="history-mount">${renderHistory(active)}</div>
        </div>
      </div>
    </div>
  `;

  applyLayout();
  const onResize = (): void => applyLayout();
  window.addEventListener('resize', onResize);
  detachResize = () => window.removeEventListener('resize', onResize);

  const orderForm = root.querySelector<HTMLFormElement>('[data-testid="order-form"]');
  orderForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
    const direction = (submitter?.value ?? 'BUY') as TradeDirection;
    placeOrder(active, direction);
  });

  // Close is delegated: the positions table re-renders, so bind on its stable mount.
  root.querySelector<HTMLElement>('[data-testid="positions-mount"]')?.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-close]');
    if (btn) closePosition(active, btn.dataset['close'] ?? '');
  });

  ticker = startTicker(feed, (ticks) => {
    applyTicks(root, ticks);
    updatePositions(root, active, feed);
    refreshAccount(active);
  });

  root
    .querySelector<HTMLButtonElement>('[data-testid="sign-out"]')
    ?.addEventListener('click', () => {
      stopTicker();
      detachResize?.();
      detachResize = null;
      portfolio = null;
      clearProfile(localStorage);
      renderLogin();
    });
}

function placeOrder(active: Portfolio, direction: TradeDirection): void {
  const pairSel = root.querySelector<HTMLSelectElement>('[data-testid="order-pair"]');
  const volInput = root.querySelector<HTMLInputElement>('[data-testid="order-volume"]');
  const errors = root.querySelector<HTMLElement>('[data-testid="order-errors"]');
  if (!pairSel || !volInput || !errors) return;

  const pair = pairSel.value as CurrencyPair;
  if (!(MVP_PAIRS as readonly string[]).includes(pair)) {
    errors.textContent = 'Choose a valid pair';
    return;
  }
  const lots2 = parseLots2(volInput.value);
  if (lots2 === null || lots2 <= 0) {
    errors.textContent = 'Enter a volume greater than 0 (e.g. 0.10)';
    return;
  }

  const outcome = active.open(
    { currencyPair: pair, tradeDirection: direction, volumeLots2: lots2 },
    feed.currentPricePts(pair),
    Date.now(),
  );
  if (!outcome.ok) {
    errors.textContent = outcome.violations.map((v) => v.message).join('; ');
    return;
  }
  errors.textContent = '';
  const mount = root.querySelector<HTMLElement>('[data-testid="positions-mount"]');
  if (mount) mount.innerHTML = renderPositions(active, feed);
  refreshAccount(active);
}

function closePosition(active: Portfolio, tradeId: string): void {
  const trade = active.getPosition(tradeId);
  if (!trade) return;
  const outcome = active.close(
    tradeId,
    feed.currentPricePts(trade.currencyPair),
    Date.now(),
    feed.gbpQuoteRatePts(trade.currencyPair),
  );
  if (!outcome.ok) return; // MVP: close always valid (exit>0, closed>=opened)
  const posMount = root.querySelector<HTMLElement>('[data-testid="positions-mount"]');
  if (posMount) posMount.innerHTML = renderPositions(active, feed);
  const histMount = root.querySelector<HTMLElement>('[data-testid="history-mount"]');
  if (histMount) histMount.innerHTML = renderHistory(active);
  refreshAccount(active);
}

const existing = loadProfile(localStorage);
if (existing) {
  renderShell(existing);
} else {
  renderLogin();
}
