import { Component, input, signal, computed } from '@angular/core';

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;       // 0-based index of correct option
  explanation: string;
}

@Component({
  selector: 'app-quiz-block',
  standalone: true,
  template: `
    <div class="quiz-block">
      <div class="quiz-header">
        <span class="quiz-icon">🧠</span>
        <span class="quiz-title">Knowledge Check</span>
        @if (!finished()) {
          <span class="quiz-progress">{{ current() + 1 }} / {{ items().length }}</span>
        }
      </div>

      @if (!finished()) {
        <div class="quiz-body">
          <p class="quiz-q">{{ items()[current()].q }}</p>
          <div class="quiz-options">
            @for (opt of items()[current()].options; track opt; let i = $index) {
              <button type="button" class="quiz-opt"
                      [class.correct]="answered() && i === items()[current()].answer"
                      [class.wrong]="answered() && selected() === i && i !== items()[current()].answer"
                      [class.selected]="selected() === i"
                      [disabled]="answered()"
                      (click)="pick(i)">
                <span class="opt-letter">{{ letters[i] }}</span>
                {{ opt }}
              </button>
            }
          </div>
          @if (answered()) {
            <div class="quiz-feedback" [class.correct-fb]="isCorrect()" [class.wrong-fb]="!isCorrect()">
              <span class="fb-icon">{{ isCorrect() ? '✓' : '✗' }}</span>
              <span>{{ isCorrect() ? 'Correct! ' : 'Wrong. ' }}{{ items()[current()].explanation }}</span>
            </div>
            <button type="button" class="quiz-next" (click)="next()">
              {{ current() < items().length - 1 ? 'Next →' : 'See Score' }}
            </button>
          }
        </div>
      } @else {
        <div class="quiz-result">
          <div class="score-circle" [class.perfect]="score() === items().length">
            {{ score() }}/{{ items().length }}
          </div>
          <p class="score-label">{{ scoreLabel() }}</p>
          <div class="score-answers">
            @for (r of answers(); track $index; let i = $index) {
              <div class="ans-row" [class.ans-ok]="r.correct" [class.ans-bad]="!r.correct">
                <span>{{ r.correct ? '✓' : '✗' }}</span>
                <span class="ans-q">Q{{ i + 1 }}: {{ items()[i].q }}</span>
              </div>
            }
          </div>
          <button type="button" class="quiz-retry" (click)="reset()">Retry Quiz</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .quiz-block {
      border: 2px solid #6366f1; border-radius: 12px;
      margin: 1.5rem 0; overflow: hidden;
    }
    .quiz-header {
      display: flex; align-items: center; gap: .6rem;
      background: #eef2ff; padding: .75rem 1.1rem; border-bottom: 1px solid #c7d2fe;
    }
    .quiz-icon  { font-size: 1.1rem; }
    .quiz-title { font-weight: 700; font-size: .9rem; color: #3730a3; flex: 1; }
    .quiz-progress { font-size: .78rem; color: #6366f1; font-weight: 600; background: #fff; padding: 2px 8px; border-radius: 10px; }

    .quiz-body { padding: 1.25rem; display: flex; flex-direction: column; gap: .9rem; }
    .quiz-q { font-size: .95rem; font-weight: 600; color: #1f2937; line-height: 1.5; margin: 0; }

    .quiz-options { display: flex; flex-direction: column; gap: .45rem; }
    .quiz-opt {
      display: flex; align-items: center; gap: .7rem;
      padding: .6rem .9rem; border: 2px solid #e5e7eb; border-radius: 8px;
      background: #fff; text-align: left; font-size: .88rem; cursor: pointer;
      transition: all .15s; color: #374151;
      &:hover:not(:disabled) { border-color: #818cf8; background: #eef2ff; }
      &.selected { border-color: #6366f1; background: #eef2ff; }
      &.correct  { border-color: #16a34a; background: #dcfce7; color: #14532d; font-weight: 600; }
      &.wrong    { border-color: #dc2626; background: #fee2e2; color: #7f1d1d; }
      &:disabled { cursor: default; }
    }
    .opt-letter {
      min-width: 1.5rem; height: 1.5rem; border-radius: 50%; background: #e5e7eb;
      display: flex; align-items: center; justify-content: center;
      font-size: .72rem; font-weight: 700; color: #6b7280; flex-shrink: 0;
    }
    .quiz-opt.correct .opt-letter { background: #16a34a; color: #fff; }
    .quiz-opt.wrong   .opt-letter { background: #dc2626; color: #fff; }

    .quiz-feedback {
      display: flex; gap: .6rem; align-items: flex-start;
      padding: .75rem 1rem; border-radius: 8px; font-size: .85rem; line-height: 1.5;
      &.correct-fb { background: #dcfce7; color: #14532d; }
      &.wrong-fb   { background: #fee2e2; color: #7f1d1d; }
    }
    .fb-icon { font-size: 1rem; flex-shrink: 0; }

    .quiz-next {
      align-self: flex-end; padding: .4rem 1.1rem; background: #4f46e5;
      color: #fff; border: none; border-radius: 6px; font-size: .85rem;
      font-weight: 600; cursor: pointer; &:hover { background: #4338ca; }
    }

    .quiz-result {
      padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem;
    }
    .score-circle {
      width: 80px; height: 80px; border-radius: 50%;
      border: 4px solid #6366f1; display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 800; color: #4338ca;
      &.perfect { border-color: #16a34a; color: #15803d; }
    }
    .score-label { font-size: .95rem; color: #374151; font-weight: 600; margin: 0; }
    .score-answers { width: 100%; display: flex; flex-direction: column; gap: .3rem; }
    .ans-row {
      display: flex; gap: .5rem; align-items: flex-start; font-size: .82rem; padding: .3rem .5rem;
      border-radius: 5px;
      &.ans-ok  { background: #f0fdf4; color: #166534; }
      &.ans-bad { background: #fef2f2; color: #991b1b; }
    }
    .ans-q { flex: 1; }
    .quiz-retry {
      padding: .4rem 1.2rem; background: #4f46e5; color: #fff; border: none;
      border-radius: 6px; font-size: .85rem; font-weight: 600; cursor: pointer;
      &:hover { background: #4338ca; }
    }
  `],
})
export class QuizBlockComponent {
  items = input.required<QuizQuestion[]>();

  readonly letters = ['A', 'B', 'C', 'D'];

  current  = signal(0);
  selected = signal<number | null>(null);
  answered = signal(false);
  answers  = signal<{ correct: boolean }[]>([]);
  finished = signal(false);

  isCorrect = computed(() =>
    this.selected() === this.items()[this.current()].answer
  );

  score = computed(() => this.answers().filter(a => a.correct).length);

  scoreLabel = computed(() => {
    const s = this.score(), t = this.items().length;
    if (s === t) return '🎉 Perfect score! You nailed it.';
    if (s >= t * 0.8) return '🌟 Great job! Almost there.';
    if (s >= t * 0.5) return '👍 Good effort. Review the ones you missed.';
    return '📚 Keep studying — you\'ll get it next time!';
  });

  pick(i: number) {
    if (this.answered()) return;
    this.selected.set(i);
    this.answered.set(true);
  }

  next() {
    this.answers.update(a => [...a, { correct: this.isCorrect() }]);
    if (this.current() < this.items().length - 1) {
      this.current.update(c => c + 1);
      this.selected.set(null);
      this.answered.set(false);
    } else {
      this.finished.set(true);
    }
  }

  reset() {
    this.current.set(0);
    this.selected.set(null);
    this.answered.set(false);
    this.answers.set([]);
    this.finished.set(false);
  }
}
