import { appName, appVersion } from './meta.js';

// Minimal app shell (MF-01). The real UI slices land in MF-04..MF-08;
// this exists so the e2e placeholder has a stable, meaningful target.
const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('App shell mount point #app not found');

app.innerHTML = `
  <header class="app-header">
    <h1 data-testid="app-title">${appName}</h1>
    <p class="tagline" data-testid="app-status">scaffold ${appVersion} — features arrive in MF-04..MF-08</p>
  </header>
`;
