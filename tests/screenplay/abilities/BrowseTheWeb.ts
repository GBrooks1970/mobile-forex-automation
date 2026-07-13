// The one ability the mobile journeys need: driving a (touch-capable) browser
// page. Wraps the Playwright Page; tasks/questions reach the page only through
// an actor's ability, never directly.

import type { Page } from '@playwright/test';
import type { Ability } from '../core.js';

export class BrowseTheWeb implements Ability {
  private constructor(readonly page: Page) {}

  static using(page: Page): BrowseTheWeb {
    return new BrowseTheWeb(page);
  }
}
