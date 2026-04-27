const fs = require('fs');
const path = require('path');
const https = require('https');

const USERNAME = process.env.GITHUB_USERNAME;
const TOKEN = process.env.GITHUB_TOKEN;

const COMMITS_PER_LEVEL = 100;

const TITLES = [
  'Newcomer', 'Script Kiddie', 'Bug Hunter', 'Code Monkey',
  'Dev Apprentice', 'Junior Dev', 'Regular Dev', 'Senior Dev',
  'Commit Mage', 'Code Wizard', 'Senior Wizard', 'Architect',
  '10x Engineer', 'Open Source Sage', 'Legendary Hacker', 'Max Level'
];

function getTitle(level) {
  return TITLES[Math.min(level, TITLES.length - 1)];
}

function fetchJSON(url, headers) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'xp-bar-action', ...headers } };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function getTotalCommits() {
  const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};

  const since = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const url = `https://api.github.com/search/commits?q=author:${USERNAME}&per_page=1`;
  const searchHeaders = { ...headers, Accept: 'application/vnd.github.cloak-preview+json' };

  const result = await fetchJSON(url, searchHeaders);
  return result.total_count || 0;
}

function generateSVG(commits) {
  const level = Math.floor(commits / COMMITS_PER_LEVEL);
  const xp = commits % COMMITS_PER_LEVEL;
  const pct = Math.round((xp / COMMITS_PER_LEVEL) * 100);
  const toNext = COMMITS_PER_LEVEL - xp;
  const title = getTitle(level);

  const W = 420;
  const H = 60;
  const badgeW = 52;
  const pad = 14;
  const barX = badgeW + pad + 10;
  const barW = W - barX - pad;
  const fillW = Math.round((pct / 100) * barW);

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .font { font-family: 'Courier New', monospace; }
      @media (prefers-color-scheme: dark) {
        .bg-card { fill: #1e1e2e; }
        .bg-badge { fill: #3C3489; }
        .txt-badge { fill: #CECBF6; }
        .txt-title { fill: #cdd6f4; }
        .txt-xp { fill: #a6adc8; }
        .txt-next { fill: #6c7086; }
        .bar-track { fill: #313244; }
        .bar-fill { fill: #7F77DD; }
        .stroke-card { stroke: #313244; }
      }
      @media (prefers-color-scheme: light) {
        .bg-card { fill: #ffffff; }
        .bg-badge { fill: #EEEDFE; }
        .txt-badge { fill: #3C3489; }
        .txt-title { fill: #1e1e2e; }
        .txt-xp { fill: #5F5E5A; }
        .txt-next { fill: #888780; }
        .bar-track { fill: #e5e5e5; }
        .bar-fill { fill: #7F77DD; }
        .stroke-card { stroke: #e5e5e5; }
      }
    </style>
  </defs>

  <rect width="${W}" height="${H}" rx="10" class="bg-card stroke-card" stroke-width="0.5"/>

  <rect x="${pad}" y="${pad}" width="${badgeW}" height="${H - pad * 2}" rx="6" class="bg-badge"/>
  <text x="${pad + badgeW / 2}" y="${H / 2 - 4}" text-anchor="middle" class="font txt-badge" font-size="11" font-weight="500">Lv.</text>
  <text x="${pad + badgeW / 2}" y="${H / 2 + 10}" text-anchor="middle" class="font txt-badge" font-size="16" font-weight="700">${level}</text>

  <text x="${barX}" y="20" class="font txt-title" font-size="12" font-weight="500">${title}</text>
  <text x="${W - pad}" y="20" text-anchor="end" class="font txt-xp" font-size="11">${commits} / ${(level + 1) * COMMITS_PER_LEVEL} XP</text>

  <rect x="${barX}" y="26" width="${barW}" height="8" rx="4" class="bar-track"/>
  <rect x="${barX}" y="26" width="${fillW}" height="8" rx="4" class="bar-fill"/>

  <text x="${barX}" y="48" class="font txt-next" font-size="10">${toNext} commits to Lv. ${level + 1}</text>
  <text x="${W - pad}" y="48" text-anchor="end" class="font txt-next" font-size="10">updated weekly</text>
</svg>`;
}

async function main() {
  console.log(`Fetching commits for ${USERNAME}...`);
  const commits = await getTotalCommits();
  console.log(`Total commits this year: ${commits}`);

  const svg = generateSVG(commits);

  const outDir = path.resolve(__dirname, '../../assets');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'xp-bar.svg');
  fs.writeFileSync(outPath, svg);
  console.log(`SVG written to ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
