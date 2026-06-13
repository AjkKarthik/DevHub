# DevHub — Multi-Technology Learning Platform

A free, hands-on learning hub for developers. Structured topic pages with theory, code examples, challenges, quizzes, and a built-in progress tracker — covering Angular, C#, ASP.NET Core, SQL, and 30+ more technologies coming soon.

**Live:** [https://ajkkarthik.github.io/DevHub](https://ajkkarthik.github.io/DevHub)

---

## What's inside

Each technology hub contains:

- **Topic pages** — theory, code examples (multi-tab), interactive challenge, quiz, and Q&A
- **Practice pages** — Cheat Sheet, Common Errors, Interview Prep, Design Patterns, Decision Guides, Glossary, Mini Projects, Learning Paths
- **Progress tracking** — mark topics complete, per-hub completion bar (localStorage)
- **Search** — Ctrl+K full-text search across all hubs
- **Dark mode** — system-aware toggle

---

## Hubs

### Live (full content)

| Hub | Topics | Practice pages |
|---|---|---|
| Angular | 45 | 10 |
| C# | 41 | 9 |
| ASP.NET Core | 33 | 9 |
| SQL | 17+ | 9 |

### Coming soon (scaffolded, expanding)

Frontend: React, Vue, TypeScript, JavaScript, HTML, CSS, Web Performance, Blazor  
Backend: Node.js, Python, Go  
Cloud & Infra: AWS, Azure, Containers/Kubernetes, Terraform, DevOps/CI-CD, Linux, Service Mesh  
Data: MongoDB, Redis, GraphQL, Messaging (Kafka/RabbitMQ)  
Architecture: Arch Patterns, API Design, System Design, Security, Observability  
Fundamentals: DSA, Testing, AI/ML  

---

## Tech stack

- **Angular 22** — standalone components only, no NgModules
- **Angular Signals** — `signal`, `computed`, `effect` throughout
- **SCSS** — per-component styles; global theme in `src/styles.scss`
- Deployed to **GitHub Pages** via `gh-pages` branch

---

## Running locally

```bash
npm install
npx ng serve
```

Open `http://localhost:4200/`

### Production build

```bash
npx ng build --configuration=production
```

Build artifacts land in `dist/`. Known harmless warnings: Sass `lighten()`/`darken()` deprecation, initial bundle budget.

---

## Project structure

```
src/app/
  app.ts / app.html / app.scss      # Shell: left nav, breadcrumb, footer, sidebar
  app.routes.ts                     # All routes (lazy loadComponent)
  services/
    progress.service.ts             # Topic completion (localStorage)
    search.service.ts               # Ctrl+K search index
    dark-mode.service.ts            # body.dark class toggle
  components/
    hub-home/                       # DevHub landing page
    shared/                         # Shared UI: theory-block, code-block, quiz-block, etc.
    angular/                        # Angular hub pages
    backend/csharp/                 # C# hub pages
    backend/aspnet/                 # ASP.NET Core hub pages
    backend/sql/                    # SQL hub pages
    frontend/                       # React, Vue, TypeScript, JS, CSS, HTML, Blazor, ...
    backend/nodejs/ backend/python/ backend/go/
    cloud/                          # AWS, Azure, Containers, Terraform, DevOps, Linux, ...
    data/                           # MongoDB, Redis, GraphQL, Messaging
    architecture/                   # Arch Patterns, API Design, System Design, Security, Observability
    fundamentals/                   # DSA, Testing, AI/ML
```

---

## Contributing

Work happens on the `development` branch; `main` is for releases. See [CLAUDE.md](CLAUDE.md) for full conventions, wiring checklist, and theming rules.
