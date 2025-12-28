const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const content = `// This file is generated during build. Do NOT commit real keys.
window.__ENV__ = {
  SUPABASE_URL: "${SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}"
};
`;

const outDir = path.join(__dirname, '..', 'js');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'env.js'), content);

console.log('Generated js/env.js');
