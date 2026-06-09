import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-child-card',
  templateUrl: './child-card.html',
  styleUrl: './child-card.scss',
})
export class ChildCardComponent {
  // input() signal — modern @Input() replacement
  title       = input.required<string>();
  description = input.required<string>();
  accentColor = input('#4f6ef7');
  label       = input('Click me');

  // output() — modern @Output() replacement (no EventEmitter needed)
  cardClicked = output<string>();

  onClick() {
    this.cardClicked.emit(this.title());
  }
}
