// Phase 11 hub scaffolder. Usage: node tools/phase11/scaffold.js tools/phase11/rust.config.js
// Idempotent: each insertion is skipped when its marker already exists.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const cfg = require(path.resolve(process.argv[2]));
const writeDataFile = require('./datafile');
const R = p => path.join(root, p);
const read = p => fs.readFileSync(R(p), 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(R(p)), { recursive: true }); fs.writeFileSync(R(p), s); };
function edit(p, marker, fn) {
  const s = read(p);
  if (s.includes(marker)) { console.log('skip', p, '(', marker.slice(0, 40), ')'); return; }
  const t = fn(s);
  if (t === s) throw new Error('no change in ' + p + ' for ' + marker);
  fs.writeFileSync(R(p), t); console.log('edit', p);
}
function insertBefore(s, anchor, text) { const i = s.indexOf(anchor); if (i < 0) throw new Error('anchor not found: ' + anchor); return s.slice(0, i) + text + s.slice(i); }
function insertAfter(s, anchor, text) { const i = s.indexOf(anchor); if (i < 0) throw new Error('anchor not found: ' + anchor); return s.slice(0, i + anchor.length) + text + s.slice(i + anchor.length); }
const k = cfg.key, C = cfg.constName, Cls = cfg.className, P = cfg.prefix, rt = cfg.route;
const pascal = s => s.split(/[^a-zA-Z0-9]/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('');
const topicClass = t => Cls + pascal(t.slug);
const nonRef = cfg.topics.filter(t => !t.reference);

// ── 1. Home component ──────────────────────────────────────────────────────
const groups = ['All', ...Object.keys(cfg.badges)];
write(`src/app/components/${cfg.folder}/home/home.ts`, `import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = ${JSON.stringify(cfg.badges)};
const GROUP_ORDER = ${JSON.stringify(groups)};

const ALL_TOPICS: Topic[] = ${JSON.stringify(cfg.topics.map(t => ({ title: t.title, route: `/${rt}/${t.slug}`, badge: t.group, description: t.desc, keyPoints: t.keyPoints, available: true })), null, 2)};

@Component({ selector: 'app-${k}-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class ${Cls}Home {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
`);
const testingHtml = read('src/app/components/fundamentals/testing/home/home.html');
write(`src/app/components/${cfg.folder}/home/home.html`, testingHtml
  .replace('<div class="hero-logo">Test</div>', `<div class="hero-logo">${cfg.homeLogo}</div>`)
  .replace('<h1>Testing</h1>', `<h1>${cfg.name}</h1>`)
  .replace(/<p class="subtitle">[\s\S]*?<\/p>/, `<p class="subtitle">${cfg.homeSubtitle}</p>`)
  .replace('<span class="stat-num">8</span><span class="stat-label">Categories</span>', `<span class="stat-num">${Object.keys(cfg.badges).length}</span><span class="stat-label">Categories</span>`)
  .replace('<span class="stat-num">Multi-stack</span><span class="stat-label">Coverage</span>', `<span class="stat-num">${nonRef.length}</span><span class="stat-label">Trackable Topics</span>`));
const badgeColors = ['background: #e0f2fe; color: #0369a1;', 'background: #ede9fe; color: #5b21b6;', 'background: #d1fae5; color: #065f46;', 'background: #fef9c3; color: #854d0e;', 'background: #f1f5f9; color: #475569;'];
write(`src/app/components/${cfg.folder}/home/home.scss`, read('src/app/components/fundamentals/testing/home/home.scss')
  .replace('$accent: #0369a1;', `$accent: ${cfg.accent};`)
  .replace('$accent-dark: #7dd3fc;', `$accent-dark: ${cfg.darkText};`)
  .replace('$tint: #f0f9ff;', `$tint: ${cfg.tint};`)
  .replace(/font-size: \.7rem; font-weight: 900;/, 'font-size: 1.3rem; font-weight: 900;')
  .replace('border-top: 1px solid #bae6fd;', `border-top: 1px solid ${cfg.border};`)
  .replace(/\.hero \.hero-logo \{ background: #0284c7; \}/, `.hero .hero-logo { background: ${cfg.accentDark}; }`)
  .replace(/&\.active \{ background: #0284c7; border-color: #0284c7; color: #fff; \}/, `&.active { background: ${cfg.accentDark}; border-color: ${cfg.accentDark}; color: #fff; }`)
  .replace(/\.badge-foundations[\s\S]*?\.badge-reference \{[^}]*\}/, Object.values(cfg.badges).map((b, i) => `.badge-${b} { ${badgeColors[i % badgeColors.length]} }`).join('\n')));

// ── 2. Nav component (data-driven, with subtopic accordion support) ───────
const navGroups = Object.keys(cfg.badges).map(g => ({ label: g, items: cfg.topics.filter(t => t.group === g).map(t => ({ slug: t.slug, label: t.title, track: !t.reference })) }));
write(`src/app/components/shared/${k}-nav/${k}-nav.ts`, `import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SUBTOPICS } from '../../../data/subtopics';

interface NavItem { slug: string; label: string; track: boolean; }
interface NavGroup { label: string; items: NavItem[]; }

const GROUPS: NavGroup[] = ${JSON.stringify(navGroups, null, 2)};

@Component({
  selector: 'app-${k}-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: \`
    <a routerLink="/${rt}" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏠 ${cfg.name} Home</span>
    </a>
    @for (g of groups; track g.label) {
      <div class="nav-group">
        <p class="nav-group-label">{{ g.label }}</p>
        @for (item of g.items; track item.slug) {
          <a [routerLink]="'/${rt}/' + item.slug" routerLinkActive="active"><span class="nl-text">{{ item.label }}</span>@if (item.track && p.isDone('${cfg.searchPrefix}' + item.slug)) {<span class="nl-done">✓</span>}@if (subtopicsOf(subKey(item.slug))) {<button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded(subKey(item.slug))" (click)="toggleSubtopics(subKey(item.slug), $event)" aria-label="Toggle subtopics">›</button>}</a>
          @if (subtopicsOf(subKey(item.slug)); as subs) {
            @if (isSubtopicsExpanded(subKey(item.slug))) {
              <div class="nav-subtopics">
                @for (sub of subs; track sub.route) {
                  <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
                }
              </div>
            }
          }
        }
      </div>
    }
  \`,
})
export class ${Cls}NavComponent {
  p = inject(ProgressService);
  groups = GROUPS;
  private router = inject(Router);
  private expandedTopics = signal<Set<string>>(new Set());

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.autoExpandForCurrentUrl());
    this.autoExpandForCurrentUrl();
  }

  // SUBTOPICS is one flat map shared by every hub. Topic slugs that collide with another
  // hub's key are stored hub-prefixed ('${P}-<slug>'); every other slug is stored bare.
  subKey(slug: string): string {
    return SUBTOPICS['${P}-' + slug] ? '${P}-' + slug : slug;
  }

  private autoExpandForCurrentUrl(): void {
    const url = this.router.url.split('?')[0];
    for (const [slug, subs] of Object.entries(SUBTOPICS)) {
      if (subs.some(s => s.route === url)) {
        this.expandedTopics.update(set => new Set(set).add(slug));
      }
    }
  }

  subtopicsOf(slug: string) {
    const subs = SUBTOPICS[slug] ?? null;
    return subs && subs.length && subs[0].route.startsWith('/${rt}/') ? subs : null;
  }

  isSubtopicsExpanded(slug: string): boolean {
    return this.expandedTopics().has(slug);
  }

  toggleSubtopics(slug: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.expandedTopics.update(set => {
      const next = new Set(set);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }
}
`);

// ── 3. Generated data file ─────────────────────────────────────────────────
writeDataFile(cfg, root);

// ── 4. Routes ──────────────────────────────────────────────────────────────
edit('src/app/app.routes.ts', `{ path: '${rt}', children: [`, s => insertBefore(s, "  { path: '**', redirectTo: '' },",
  `  { path: '${rt}', children: [
    { path: '', loadComponent: () => import('./components/${cfg.folder}/home/home').then(m => m.${Cls}Home) },
${cfg.topics.map(t => `    { path: '${t.slug}', loadComponent: () => import('./components/${cfg.folder}/${t.slug}/${t.slug}').then(m => m.${topicClass(t)}) },`).join('\n')}
  ] },
`));

// ── 5. app.ts ──────────────────────────────────────────────────────────────
edit('src/app/app.ts', `${Cls}NavComponent`, s => {
  s = insertAfter(s, "import { AiNavComponent } from './components/shared/ai-nav/ai-nav';", `\nimport { ${Cls}NavComponent } from './components/shared/${k}-nav/${k}-nav';`);
  s = s.replace('DsaNavComponent, AiNavComponent],', `DsaNavComponent, AiNavComponent, ${Cls}NavComponent],`);
  s = s.replace("'/dsa','/testing-hub','/ai',", `'/dsa','/testing-hub','/ai','/${rt}',`);
  s = s.replace("| 'dsa' | 'ai' | 'hub'>", `| 'dsa' | 'ai' | '${k}' | 'hub'>`);
  s = s.replace("    if (url.startsWith('/ai'))           return 'ai';", `    if (url.startsWith('/ai'))           return 'ai';\n    if (url.startsWith('/${rt}'))${' '.repeat(Math.max(1, 13 - rt.length))}return '${k}';`);
  return s;
});
// ── 6. app.html ────────────────────────────────────────────────────────────
edit('src/app/app.html', `<app-${k}-nav />`, s => {
  const cls = `[class.section-testing-hub]="currentSection()==='testing-hub'"`;
  s = s.split(cls).join(`${cls} [class.section-${k}]="currentSection()==='${k}'"`);
  s = insertBefore(s, '    <!-- ── C# Navigation', `    <!-- ── ${cfg.name} Navigation ── -->\n    @if (currentSection() === '${k}') {\n      <app-${k}-nav />\n    }\n\n`);
  s = insertBefore(s, "      } @else {\n        Dev Learning Hub", `      } @else if (currentSection() === '${k}') {\n        ${cfg.footer}\n`);
  return s;
});
// ── 7. app.scss + styles.scss ──────────────────────────────────────────────
edit('src/app/app.scss', `.left-nav.section-${k} `, s => {
  s = insertAfter(s, '.left-nav.section-ai           .nav-progress-bar { background: linear-gradient(90deg, #7c3aed, #5b21b6); }', `\n.left-nav.section-${k}${' '.repeat(Math.max(1, 15 - k.length))}.nav-progress-bar { background: linear-gradient(90deg, ${cfg.accent}, ${cfg.accentDark}); }`);
  s = insertBefore(s, '.nav-soon-note {', `.left-nav.section-${k} a {\n  &:hover { background: ${cfg.tint}; color: ${cfg.accent}; }\n  &.active { background: ${cfg.accent}; color: #fff; }\n\n  body.dark &:hover { background: ${cfg.darkBg}; color: ${cfg.darkText}; }\n  body.dark &.active { background: ${cfg.accentDark}; color: #fff; }\n}\n\n`);
  s = insertAfter(s, '.left-nav.section-ai           .nav-hub-back:hover { color: #7c3aed !important; background: #f5f3ff !important; }', `\n.left-nav.section-${k}${' '.repeat(Math.max(1, 15 - k.length))}.nav-hub-back:hover { color: ${cfg.accent} !important; background: ${cfg.tint} !important; }`);
  s = insertAfter(s, 'body.dark header.section-ai .nav-toggle span { background: #a78bfa; }', `\nheader.section-${k} .nav-toggle span { background: ${cfg.accent}; }\nbody.dark header.section-${k} .nav-toggle span { background: ${cfg.darkText}; }`);
  return s;
});
edit('src/styles.scss', `.left-nav.section-${k} a`, s => insertAfter(s, ".left-nav.section-ai a         { &:hover { background: #f5f3ff; color: #7c3aed; } &.active { background: #7c3aed; color: #fff; } body.dark &:hover { background: #1e1b4b; color: #a78bfa; } body.dark &.active { background: #5b21b6; color: #fff; } }",
  `\n.left-nav.section-${k} a${' '.repeat(Math.max(1, 9 - k.length))}{ &:hover { background: ${cfg.tint}; color: ${cfg.accent}; } &.active { background: ${cfg.accent}; color: #fff; } body.dark &:hover { background: ${cfg.darkBg}; color: ${cfg.darkText}; } body.dark &.active { background: ${cfg.accentDark}; color: #fff; } }`));
// ── 8. Breadcrumb ──────────────────────────────────────────────────────────
edit('src/app/components/shared/breadcrumb/breadcrumb.ts', `${C}_LABELS`, s => {
  const firstImport = s.indexOf('import ');
  s = s.slice(0, firstImport) + `import { ${C}_LABELS } from '../../../data/hub-${k}';\n` + s.slice(firstImport);
  s = insertAfter(s, "  'ai':              { label: 'AI & LLMs',             path: '/ai'              },", `\n  '${rt}':${' '.repeat(Math.max(1, 16 - rt.length))}{ label: ${JSON.stringify(cfg.name)}, path: '/${rt}' },`);
  s = s.replace("                 : hubSlug === 'ai'             ? AI_LABELS", `                 : hubSlug === 'ai'             ? AI_LABELS\n                 : hubSlug === '${rt}'${' '.repeat(Math.max(1, 14 - rt.length))}? ${C}_LABELS`);
  return s;
});
// ── 9. Page sidebar ────────────────────────────────────────────────────────
edit('src/app/components/shared/page-sidebar/page-sidebar.ts', `${C}_SIDEBAR`, s => {
  s = insertAfter(s, "export interface SidebarData {", '');
  const firstImport = s.indexOf('import ');
  s = s.slice(0, firstImport) + `import { ${C}_DEFAULT, ${C}_SIDEBAR } from '../../../data/hub-${k}';\n` + s.slice(firstImport);
  s = s.replace("export const SIDEBAR_MAP: Record<string, SidebarData> = {", `export const SIDEBAR_MAP: Record<string, SidebarData> = {\n  ...${C}_SIDEBAR,`);
  s = s.replace("| 'testing-hub' | 'dsa' | 'ai' |", `| 'testing-hub' | 'dsa' | 'ai' | '${k}' |`);
  s = s.replace("    : this.currentUrl().startsWith('/ai')            ? 'ai'", `    : this.currentUrl().startsWith('/ai')            ? 'ai'\n    : this.currentUrl().startsWith('/${rt}')${' '.repeat(Math.max(1, 14 - rt.length))}? '${k}'`);
  s = s.replace("           : this.section() === 'ai'            ? AI_DEFAULT", `           : this.section() === 'ai'            ? AI_DEFAULT\n           : this.section() === '${k}'${' '.repeat(Math.max(1, 14 - k.length))}? ${C}_DEFAULT`);
  s = s.replace("      case 'ai':              return '📖 AI/ML Docs';", `      case 'ai':              return '📖 AI/ML Docs';\n      case '${k}':${' '.repeat(Math.max(1, 16 - k.length))}return '📖 ${cfg.name} Docs';`);
  return s;
});
// ── 10. Search ─────────────────────────────────────────────────────────────
edit('src/app/services/search.service.ts', `${C}_SEARCH`, s => {
  const firstImport = s.indexOf('import ');
  const head = firstImport >= 0 && firstImport < s.indexOf('export interface SearchEntry') ? firstImport : 0;
  s = s.slice(0, head) + `import { ${C}_SEARCH } from '../data/hub-${k}';\n` + s.slice(head);
  const end = s.indexOf('\n];', s.indexOf('export const SEARCH_INDEX'));
  return s.slice(0, end) + `\n  ...${C}_SEARCH,` + s.slice(end);
});
edit('src/app/components/shared/search/search.ts', `'/${rt}/'`, s => insertBefore(s, "    if (route.startsWith('test-'))", `    if (route.startsWith('${cfg.searchPrefix}'))${' '.repeat(Math.max(1, 14 - cfg.searchPrefix.length))}return '/${rt}/'${' '.repeat(Math.max(1, 18 - rt.length))}+ route.slice('${cfg.searchPrefix}'.length);\n`));
// ── 11. Progress ───────────────────────────────────────────────────────────
edit('src/app/services/progress.service.ts', `${cfg.progressKey}Total`, s => insertBefore(s, '  // ── Terraform (keys prefixed', `  // ── ${cfg.name} (keys prefixed '${cfg.searchPrefix}') ──\n  readonly ${cfg.progressKey}Total = ${nonRef.length};\n  readonly ${cfg.progressKey}Count = computed(() => [...this._done()].filter(r => r.startsWith('${cfg.searchPrefix}')).length);\n  readonly ${cfg.progressKey}Pct   = computed(() => Math.round((this.${cfg.progressKey}Count() / this.${cfg.progressKey}Total) * 100));\n\n`));
// ── 12. Hub home card ──────────────────────────────────────────────────────
edit('src/app/components/hub-home/hub-home.ts', `route: '/${rt}',`, s => {
  const h = cfg.homeCard;
  const card = `    {
      group: '${h.group}', name: ${JSON.stringify(h.name)}, time: '${h.time}',
      tagline: ${JSON.stringify(h.tagline)},
      icon: '${h.icon}', gradient: '${h.gradient}',
      textDark: ${h.textDark}, route: '/${rt}', available: true, topics: ${cfg.topics.length},
      sub: ${JSON.stringify(h.sub)},
      roles: ${JSON.stringify(h.roles)},
      highlights: ${JSON.stringify(h.highlights, null, 8).replace(/\n\]/, '\n      ]')},
    },
`;
  const anchor = h.group === 'backend' ? '\n    // ── Data: SQL' : '\n    // ── AI ──';
  return insertBefore(s, anchor, '\n' + card.replace(/\n$/, ''));
});
console.log('scaffold done for', cfg.name);
