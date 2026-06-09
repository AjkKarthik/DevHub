import { Component, input, signal } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../code-block/code-block';

export interface Challenge {
  title: string;
  description: string;
  starterCode: string;
  solution: string;
  language: 'typescript' | 'html' | 'scss' | 'csharp';
  hints?: string[];
  playgroundUrl?: string;
}

@Component({
  selector: 'app-challenge-block',
  standalone: true,
  imports: [CodeBlockComponent],
  template: `
    <div class="challenge">
      <div class="ch-header">
        <span class="ch-icon">⚡</span>
        <span class="ch-title">Challenge: {{ item().title }}</span>
      </div>
      <div class="ch-body">
        <p class="ch-desc">{{ item().description }}</p>

        <app-code-block [tabs]="starterTabs()" />

        @if (item().hints?.length) {
          <div class="ch-hints" [class.open]="hintsOpen()">
            <button type="button" class="hint-toggle" (click)="hintsOpen.update(v => !v)">
              💡 {{ hintsOpen() ? 'Hide hints' : 'Show hints (' + item().hints!.length + ')' }}
            </button>
            @if (hintsOpen()) {
              <div class="hint-list">
                @for (h of item().hints; track h) {
                  <div class="hint-item">{{ h }}</div>
                }
              </div>
            }
          </div>
        }

        <div class="ch-actions">
          <button type="button" class="reveal-btn" (click)="revealed.update(v => !v)">
            {{ revealed() ? '🙈 Hide Solution' : '👁 Reveal Solution' }}
          </button>
          <a class="playground-btn"
             [href]="item().playgroundUrl || 'https://angular.dev/playground'"
             target="_blank" rel="noopener">
            ▶ Try in Playground
          </a>
        </div>

        @if (revealed()) {
          <div class="solution-box">
            <p class="solution-label">✅ Solution</p>
            <app-code-block [tabs]="solutionTabs()" />
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .challenge {
      border: 2px solid #f59e0b; border-radius: 12px; margin: 1.5rem 0; overflow: hidden;
    }
    .ch-header {
      display: flex; align-items: center; gap: .6rem;
      background: #fffbeb; padding: .75rem 1.1rem; border-bottom: 1px solid #fcd34d;
    }
    .ch-icon  { font-size: 1.1rem; }
    .ch-title { font-weight: 700; font-size: .9rem; color: #92400e; }

    .ch-body { padding: 1.1rem; display: flex; flex-direction: column; gap: .9rem; }
    .ch-desc { font-size: .9rem; color: #374151; line-height: 1.5; margin: 0; }

    .ch-hints { }
    .hint-toggle {
      padding: .3rem .8rem; border: 1px solid #fcd34d; border-radius: 6px;
      background: #fef3c7; color: #92400e; font-size: .82rem; font-weight: 600; cursor: pointer;
      &:hover { background: #fde68a; }
    }
    .hint-list { margin-top: .5rem; display: flex; flex-direction: column; gap: .3rem; }
    .hint-item {
      padding: .4rem .75rem; background: #fffbeb; border-left: 3px solid #f59e0b;
      font-size: .84rem; color: #451a03; border-radius: 0 5px 5px 0;
    }

    .ch-actions { display: flex; gap: .6rem; flex-wrap: wrap; }
    .reveal-btn {
      padding: .4rem 1.1rem; background: #f59e0b; color: #fff; border: none;
      border-radius: 6px; font-size: .85rem; font-weight: 600; cursor: pointer;
      &:hover { background: #d97706; }
    }
    .playground-btn {
      padding: .4rem 1.1rem; background: #0ea5e9; color: #fff;
      border-radius: 6px; font-size: .85rem; font-weight: 600;
      text-decoration: none; display: inline-flex; align-items: center;
      &:hover { background: #0284c7; }
    }

    .solution-box {
      border: 2px solid #10b981; border-radius: 8px; overflow: hidden;
    }
    .solution-label {
      background: #d1fae5; padding: .5rem .9rem; font-size: .82rem; font-weight: 700;
      color: #065f46; margin: 0;
    }
  `],
})
export class ChallengeBlockComponent {
  item = input.required<Challenge>();

  revealed   = signal(false);
  hintsOpen  = signal(false);

  starterTabs = () => [{
    label: 'Starter Code',
    language: this.item().language,
    code: this.item().starterCode,
  }] as CodeTab[];

  solutionTabs = () => [{
    label: 'Solution',
    language: this.item().language,
    code: this.item().solution,
  }] as CodeTab[];
}
