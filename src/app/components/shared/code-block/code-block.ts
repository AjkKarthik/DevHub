import { Component, input, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import scss from 'highlight.js/lib/languages/scss';
import bash from 'highlight.js/lib/languages/bash';
import csharp from 'highlight.js/lib/languages/csharp';
import sql from 'highlight.js/lib/languages/sql';
import css from 'highlight.js/lib/languages/css';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('css', css);

export interface CodeTab {
  label: string;
  code: string;
  language?: 'typescript' | 'html' | 'scss' | 'bash' | 'csharp' | 'sql' | 'css';
}

@Component({
  selector: 'app-code-block',
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss',
})
export class CodeBlockComponent {
  tabs    = input.required<CodeTab[]>();
  visible = signal(false);
  active  = signal(0);

  highlighted = computed(() => {
    const tab = this.tabs()[this.active()];
    if (!tab) return '';
    const lang = tab.language ?? 'typescript';
    return hljs.highlight(tab.code.trim(), { language: lang }).value;
  });

  private platformId = inject(PLATFORM_ID);
  copied = signal(false);

  toggle()             { this.visible.update(v => !v); }
  selectTab(i: number) { this.active.set(i); }

  copy() {
    if (!isPlatformBrowser(this.platformId)) return;
    const code = this.tabs()[this.active()]?.code ?? '';
    navigator.clipboard.writeText(code.trim()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
