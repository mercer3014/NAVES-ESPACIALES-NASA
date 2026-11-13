import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `new URL(import.meta.url).pathname` keeps a leading slash and does not decode %20,
// so Windows paths like C:\Users\Cerezo Alex\... 404 every static file.
export function resolveStaticRoot(moduleUrl, staticDir = 'dist') {
  return path.resolve(path.dirname(fileURLToPath(moduleUrl)), '..', staticDir || 'dist');
}
