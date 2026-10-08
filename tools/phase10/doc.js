// node doc.js <route> <todoText> <claudeEntry> <sectionMarker> <stateOld> <stateNew>
const fs = require('fs'); const [route, todoText, entry, marker, stOld, stNew] = process.argv.slice(2);
let t = fs.readFileSync('TODO.md', 'utf8'); const re = new RegExp('- \\[ \\] `' + route.replace(/[/]/g, '\\/') + '` — [^\\n]*');
if (!re.test(t)) throw 'todo'; t = t.replace(re, '- [x] 2026-10-08 `' + route + '` — ' + todoText); fs.writeFileSync('TODO.md', t);
let c = fs.readFileSync('CLAUDE.md', 'utf8'); const mi = c.indexOf(marker); if (mi < 0) throw 'marker';
const end = c.indexOf('\n## Current state', mi); const nextSec = c.indexOf('\n### ', mi + marker.length);
const ins = (nextSec > 0 && nextSec < end) ? nextSec : end;
c = c.slice(0, ins).replace(/\n*$/, '\n') + entry + '\n' + c.slice(ins);
if (stOld) { if (!c.includes(stOld)) throw 'state'; c = c.replace(stOld, stNew); }
fs.writeFileSync('CLAUDE.md', c); console.log('docs ok');
