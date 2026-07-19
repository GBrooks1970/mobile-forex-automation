// Tiny pure module so the unit placeholder (MF-01) tests something real
// rather than asserting true === true.
import { version } from '../package.json';

export const appName = 'Forex Demo';
export const appVersion = version;
