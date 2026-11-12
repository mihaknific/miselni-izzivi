// scripts/build-bundle-css.js
// Združi CSS datoteke v eno produkcijsko datoteko css/bundle.min.css
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_DIR = path.resolve(__dirname, '../css');
const FILES = [
  'icons.css',
  'tailwind.min.css',
  'main.css',
  'layout.css',
  'components.css',
  'form.css',
  'games.bundle.css',
];

const OUTPUT_FILE = path.join(CSS_DIR, 'bundle.min.css');

let combined = '';
for (const file of FILES) {
  const filePath = path.join(CSS_DIR, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Manjka CSS datoteka: ${file} na ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  combined += `/* --- ${file} --- */\n` + content + '\n';
}

fs.writeFileSync(OUTPUT_FILE, combined, 'utf8');
console.log(`✅ Uspešno ustvarjen css/bundle.min.css (${(combined.length / 1024).toFixed(1)} kB)`);
