import { Directive, ElementRef, HostListener, input } from '@angular/core';

@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  // input signal — modern replacement for @Input()
  appHighlight = input('#fff3cd');

  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter') onEnter() {
    this.el.nativeElement.style.backgroundColor = this.appHighlight();
  }

  @HostListener('mouseleave') onLeave() {
    this.el.nativeElement.style.backgroundColor = '';
  }
}
