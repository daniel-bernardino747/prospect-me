/**
 * `output: 'standalone'` leaves the built CSS and JS behind: `.next/static`
 * (and `public/`, when there is one) must sit beside the standalone server or
 * every page is served unstyled. Run after `next build`.
 */
import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const labs = fileURLToPath(new URL('../', import.meta.url));
// The workspace root is the tracing root, so the server lands under labs/.
const server = `${labs}.next/standalone/labs/`;

cpSync(`${labs}.next/static`, `${server}.next/static`, { recursive: true });
if (existsSync(`${labs}public`)) cpSync(`${labs}public`, `${server}public`, { recursive: true });
