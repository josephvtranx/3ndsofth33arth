import { copyFile,mkdir } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
await mkdir(new URL('public/',root),{recursive:true});
await copyFile(new URL('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs',root),new URL('public/maplibre-gl-worker.mjs',root));
