import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-js-bundlers',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './bundlers.html',
  styleUrl: './bundlers.scss',
})
export class JsBundlers {
  theory: TheoryPoint[] = [
    {
      heading: 'What Bundlers Do',
      points: [
        'A bundler takes your source files (JS, TS, CSS, images) and produces optimized output files for the browser. Core tasks: resolve module imports, transpile modern syntax, tree-shake dead code, split bundles, and hash filenames for cache busting.',
        '<strong>Tree shaking</strong>: bundlers analyze import/export statements statically and remove code that is never imported. Only works reliably with ESM (not CommonJS). Always prefer named exports over default for better tree-shaking.',
        '<strong>Code splitting</strong>: bundlers split output into multiple chunks. Route-level splitting via dynamic <code>import()</code> means users only download code for pages they visit.',
        '<strong>Source maps</strong>: in development, source maps map bundle output back to original source files so stack traces and debugger show your actual code.',
      ]
    },
    {
      heading: 'Vite',
      points: [
        'Vite uses native ESM in development — no bundling, just instant serving. Changes reload in <code>&lt;5ms</code> because only the changed module is re-served.',
        'In production, Vite uses Rollup under the hood to produce optimized bundles. Rollup is renowned for small, clean output with excellent tree-shaking.',
        'Configure via <code>vite.config.ts</code>. Key options: <code>build.rollupOptions</code>, <code>plugins</code>, <code>resolve.alias</code>, <code>build.target</code>.',
        '<code>import.meta.env</code> provides environment variables. <code>VITE_</code> prefix required for variables exposed to client code. <code>import.meta.hot</code> for HMR (Hot Module Replacement) in plugins.',
      ]
    },
    {
      heading: 'webpack',
      points: [
        'webpack is the most widely used bundler — powers Create React App, Angular CLI, Next.js. Highly configurable with a rich plugin ecosystem.',
        'Entry → Module → Loaders → Plugins → Output. Every file type needs a loader: <code>babel-loader</code> for JS/TS, <code>css-loader</code> for CSS, <code>file-loader</code>/<code>asset/resource</code> for images.',
        '<code>webpack-dev-server</code> for development with HMR. <code>SplitChunksPlugin</code> for vendor/common chunk extraction. <code>TerserPlugin</code> for JS minification.',
        'webpack.config.js is complex but full-featured. Most projects use a framework CLI that wraps webpack — avoid ejecting unless necessary.',
      ]
    },
    {
      heading: 'npm Scripts & Package Ecosystem',
      points: [
        '<code>package.json</code> <code>scripts</code> field defines runnable commands: <code>npm run dev</code>, <code>npm run build</code>, <code>npm test</code>. <code>npm start</code> runs the <code>start</code> script.',
        '<strong>dependencies</strong> vs <strong>devDependencies</strong>: runtime code (frameworks, libraries) goes in <code>dependencies</code>; build tools, linters, test runners go in <code>devDependencies</code>.',
        '<strong>peerDependencies</strong>: declare what the consumer must provide. Used by plugins and libraries (e.g. React components declare React as a peer). Not auto-installed.',
        '<code>package-lock.json</code> / <code>yarn.lock</code> / <code>pnpm-lock.yaml</code> lock exact versions for reproducible installs. Always commit lock files.',
        'Semantic versioning: <code>^1.2.3</code> allows minor updates (1.x.x); <code>~1.2.3</code> allows patch updates (1.2.x); <code>1.2.3</code> exact.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'vite.config.ts',              type: 'keyword',  desc: 'Vite config — plugins, alias, build options' },
    { name: 'import.meta.env.VITE_X',      type: 'accessor', desc: 'Client-side env var (VITE_ prefix required)' },
    { name: 'import.meta.hot',             type: 'accessor', desc: 'Vite HMR API in plugin code' },
    { name: 'webpack.config.js',           type: 'keyword',  desc: 'Entry, output, loaders, plugins, mode' },
    { name: 'npm run <script>',            type: 'syntax',   desc: 'Run package.json script' },
    { name: 'npm install --save-dev',      type: 'syntax',   desc: 'Add to devDependencies' },
    { name: '"sideEffects": false',        type: 'keyword',  desc: 'package.json flag enabling aggressive tree-shaking' },
    { name: 'dynamic import()',            type: 'function', desc: 'Trigger code splitting at this point' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Vite Config',
      language: 'typescript',
      code: `// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),  // import from '@/components/...'
    },
  },

  build: {
    target: 'es2020',        // output syntax target
    outDir: 'dist',
    sourcemap: true,         // for production debugging
    rollupOptions: {
      output: {
        // Manual chunks — keep vendor libraries in separate chunk
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash-es', 'date-fns'],
        },
      },
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});

// ── Environment variables ─────────────────────────────────────────────
// .env.local (not committed):
// VITE_API_URL=https://api.example.com
// VITE_STRIPE_KEY=pk_test_...

// In your code:
const apiUrl = import.meta.env.VITE_API_URL;
const isDev  = import.meta.env.DEV;
const isProd = import.meta.env.PROD;`,
    },
    {
      label: 'webpack Config',
      language: 'typescript',
      code: `// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',  // cache busting
      clean: true,                           // clean dist on each build
    },

    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'eval-source-map' : 'source-map',

    module: {
      rules: [
        {
          test: /\\.[jt]sx?$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\\.css$/,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
          ],
        },
        {
          test: /\\.(png|jpg|svg|gif)$/,
          type: 'asset/resource',           // built-in asset handling
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({ template: './public/index.html' }),
      !isDev && new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' }),
    ].filter(Boolean),

    optimization: {
      splitChunks: {
        chunks: 'all',   // split vendor chunks automatically
      },
    },
  };
};`,
    },
    {
      label: 'npm Scripts & Tree-Shaking',
      language: 'typescript',
      code: `// package.json
{
  "name": "my-app",
  "version": "1.0.0",
  "type": "module",
  "sideEffects": false,          // enables tree-shaking — mark side-effect files explicitly
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0"
  }
}

// ── Tree shaking — only import what you use ───────────────────────────
// ❌ Imports the ENTIRE lodash (531kb)
import _ from 'lodash';
const arr = _.uniq([1, 2, 2, 3]);

// ✓ Named import from ESM build — tree-shakeable (6kb)
import { uniq } from 'lodash-es';
const arr2 = uniq([1, 2, 2, 3]);

// ✓ Even better — direct subpath import (works with CJS lodash too)
import uniq from 'lodash/uniq';

// ── Code splitting via dynamic import ────────────────────────────────
// Each dynamic import becomes a separate chunk
const AdminPage = lazy(() => import('./pages/AdminPage'));    // React.lazy
// or Vite
const mod = await import('./heavy-lib.js');`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Importing entire libraries instead of named exports',
      wrong: `import _ from 'lodash';           // imports all 531kb
import * as R from 'ramda';       // entire library`,
      right: `import { debounce, throttle } from 'lodash-es';  // tree-shaken
import { map, filter } from 'ramda';               // only what's needed`,
      explanation: 'Default imports of large libraries pull in the entire bundle. Use named imports from ESM builds (lodash-es, not lodash) so bundlers can tree-shake unused code.',
    },
    {
      title: 'Forgetting sideEffects in package.json',
      wrong: `// package.json — no "sideEffects" field
// Bundler must assume ALL files have side effects → no tree-shaking`,
      right: `// package.json
{
  "sideEffects": false,          // safe to tree-shake all files
  // or list files that DO have side effects:
  "sideEffects": ["*.css", "./src/polyfills.js"]
}`,
      explanation: 'Without "sideEffects":false, bundlers conservatively keep all imported files even if nothing is used from them. For libraries, this is critical — improper sideEffects config bloats consumers\' bundles.',
    },
    {
      title: 'Putting build tools in dependencies instead of devDependencies',
      wrong: `npm install webpack vite typescript eslint
// Adds to dependencies — deployed to production, increases install size`,
      right: `npm install --save-dev webpack vite typescript eslint
// Adds to devDependencies — only installed in dev, excluded from prod deploys`,
      explanation: 'Build tools, linters, and test runners are needed to build your app, not to run it. They belong in devDependencies. This reduces production install size and clarifies what your app actually depends on at runtime.',
    },
    {
      title: 'Not committing lock files',
      wrong: `# .gitignore
package-lock.json
yarn.lock
# Result: team members get different dependency versions!`,
      right: `# .gitignore — do NOT add lock files
# Commit package-lock.json / yarn.lock / pnpm-lock.yaml
# Use "npm ci" in CI for clean reproducible installs`,
      explanation: 'Lock files record the exact installed versions. Without them, npm install may resolve different patch/minor versions on different machines. This causes "works on my machine" bugs. Always commit lock files.',
    },
  ];

  challenge: Challenge = {
    title: 'Analyze Bundle Impact',
    language: 'typescript',
    description: 'Given a list of npm package imports, write a `analyzeImports(code)` function that:\n- Extracts all imported package names from `import` statements\n- Distinguishes relative imports (./,  ../) from npm packages\n- Returns `{ packages: string[], relativeImports: string[] }`\n\nThis simulates what bundlers do when they scan for dependencies.',
    hints: [
      'Use regex to find all import statements',
      'A package import doesn\'t start with . or /',
      'Handle: import x from "pkg", import { x } from "pkg", import "pkg"',
      'Scoped packages start with @: @angular/core, @types/node',
    ],
    starterCode: `function analyzeImports(code) {
  // your implementation
}

const code = \`
import React, { useState } from 'react';
import { debounce } from 'lodash-es';
import MyComp from './components/MyComp';
import '../styles/global.css';
import '@angular/core';
\`;

console.log(analyzeImports(code));
// { packages: ['react', 'lodash-es', '@angular/core'], relativeImports: ['./components/MyComp', '../styles/global.css'] }`,
    solution: `function analyzeImports(code) {
  const importRe = /import\\s+(?:[\\s\\S]*?\\s+from\\s+)?['"]([^'"]+)['"]/g;
  const packages = [];
  const relativeImports = [];
  for (const [, path] of code.matchAll(importRe)) {
    if (path.startsWith('.') || path.startsWith('/')) {
      relativeImports.push(path);
    } else {
      packages.push(path);
    }
  }
  return { packages, relativeImports };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is tree-shaking?',
      options: [
        'Minifying CSS by removing unused rules',
        'Removing unused exports from the final bundle based on static import analysis',
        'Splitting the bundle into multiple files',
        'Compressing images for smaller bundle size',
      ],
      answer: 1,
      explanation: 'Tree-shaking analyzes which exports are actually imported and removes unused code from the final bundle. It relies on ESM\'s static import/export structure. CommonJS require() is dynamic and prevents effective tree-shaking.',
    },
    {
      q: 'What makes Vite faster than webpack in development?',
      options: [
        'Vite uses a faster JavaScript engine',
        'Vite pre-bundles all node_modules',
        'Vite serves files as native ES modules without bundling during dev',
        'Vite runs TypeScript natively without compilation',
      ],
      answer: 2,
      explanation: 'In development, Vite skips bundling entirely — it serves each module as a native ESM file. The browser fetches only the changed module on HMR. webpack rebuilds (even partially) on every change, which is slower.',
    },
    {
      q: 'Where should build tools like webpack and vite go in package.json?',
      options: ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'],
      answer: 1,
      explanation: 'Build tools are only needed during development/build — not at runtime. devDependencies are excluded from production deploys and signal that these are development-time tools, not runtime requirements.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is code splitting and how does it help?',
      a: 'Code splitting divides your bundle into smaller chunks that load on demand. Instead of one large JS file, users download only what they need for the current page. Bundlers do this automatically at dynamic <code>import()</code> boundaries. The result: faster initial load (less JS to parse) and lazy loading of heavy features (admin panels, PDF viewers, charts).',
    },
    {
      q: 'What does "sideEffects": false in package.json do?',
      a: 'It tells bundlers this package\'s files have no side effects — they only export values and don\'t modify globals or run code on import. This lets bundlers safely remove any file that isn\'t directly imported. Without it, bundlers keep all files to avoid breaking side effects. For library authors, setting this correctly is critical for tree-shaking.',
    },
    {
      q: 'Should I use Vite or webpack for new projects?',
      a: 'For most new projects, prefer Vite — faster dev server (native ESM), simpler config, and modern defaults. webpack is still the right choice when you need: deep integration with an existing webpack ecosystem (Angular CLI, CRA), complex custom loaders, or features not yet in Vite. Both are production-ready; the difference is mainly in DX speed and config complexity.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Bundlers resolve imports, tree-shake unused code (ESM only), code-split via dynamic import(), and hash filenames; Vite serves native ESM in dev (fast), uses Rollup in prod; always commit lock files and put build tools in devDependencies.',
    mustKnow: [
      'Tree-shaking removes unused exports — requires ESM, not CommonJS',
      'Code splitting: dynamic import() creates separate lazy-loaded chunks',
      'Vite: native ESM in dev (no bundle) + Rollup in prod',
      'webpack: loader per file type, highly configurable, SplitChunksPlugin',
      'dependencies = runtime; devDependencies = build/test tools',
      '"sideEffects":false enables aggressive tree-shaking of your library',
      'Always commit lock files (package-lock.json, yarn.lock, pnpm-lock.yaml)',
    ],
    interviewFocus: [
      'What is tree-shaking and why does it only work with ESM?',
      'What is code splitting and how do you enable it?',
      'Vite vs webpack — key differences',
      'dependencies vs devDependencies',
    ],
  };
}
