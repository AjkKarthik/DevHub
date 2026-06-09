import { Directive, ElementRef, HostListener, inject, input, Renderer2 } from '@angular/core';

@Directive({ selector: '[appHighlight]', standalone: true })
export class HighlightDirective {
  /** The colour to apply on hover — parent passes it as [appHighlight]="'#fef08a'" */
  appHighlight = input('#fef08a');

  private el       = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  @HostListener('mouseenter') onEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'background-color', this.appHighlight());
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'background-color .2s');
  }

  @HostListener('mouseleave') onLeave() {
    this.renderer.removeStyle(this.el.nativeElement, 'background-color');
  }
}
