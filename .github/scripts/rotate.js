const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../');

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff =
    now - start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000;
  return Math.floor(diff / 604800000);
}

function pickItem(list, week) {
  return list[week % list.length];
}

function replaceBetween(content, startMarker, endMarker, newBlock) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Could not find markers: ${startMarker} / ${endMarker}`);
  }

  // Keep the end marker in the output by slicing from `end` (not `end + endMarker.length`).
  return (
    content.slice(0, start + startMarker.length) +
    '\n' +
    newBlock +
    '\n' +
    content.slice(end)
  );
}

const START_MARKER = '<!-- ALGO_START -->';
const END_MARKER = '<!-- ALGO_END -->';

const algos = loadJSON('algos.json');
const week = getWeekNumber();

const algo = pickItem(algos, week);

const algoBlock = `> **Algo of the week: ${algo.name}** — ${algo.summary}
>
> Time: \`${algo.time}\` · Space: \`${algo.space}\` · [Learn more](${algo.link})
>
> *rotates every Monday · [see all algos](algos.json)*`;

let readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
readme = replaceBetween(readme, START_MARKER, END_MARKER, algoBlock);

fs.writeFileSync(path.join(ROOT, 'README.md'), readme);
console.log(`Week ${week}: set algo "${algo.name}"`);
