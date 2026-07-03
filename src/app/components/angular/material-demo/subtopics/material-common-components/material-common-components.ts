import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-material-common-components-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './material-common-components.html',
  styleUrl: './material-common-components.scss',
})
export class MaterialCommonComponentsSubtopic {

  materialDeps = { '@angular/material': 'latest', '@angular/cdk': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Six button variants, one color API',
      points: [
        '<code>mat-flat-button</code> (filled), <code>mat-raised-button</code> (elevated shadow), <code>mat-stroked-button</code> (outlined), <code>mat-button</code> (plain text), <code>mat-icon-button</code> (icon only), <code>mat-fab</code> (floating action) — all six accept the SAME <code>color="primary|accent|warn"</code> attribute.',
      ],
    },
    {
      heading: 'MatSnackBar — temporary toast messages',
      points: [
        '<code>MatSnackBar.open(message, action, { duration: 3000 })</code> shows a temporary toast at the bottom of the screen for the given duration. Handle the action button with <code>.afterDismissed().subscribe()</code> to detect whether the user actually clicked it (as opposed to it auto-dismissing).',
      ],
    },
    {
      heading: 'MatDialog — modal overlays',
      points: [
        '<code>MatDialog.open(MyDialogComponent, { data: {...} })</code> opens a component inside a modal overlay, passing data through the config object. Inside the dialog, inject <code>MAT_DIALOG_DATA</code> to read that data, and inject <code>MatDialogRef</code> to close it: <code>inject(MatDialogRef).close(result)</code> — the value passed to <code>close()</code> is what the ORIGINAL caller\'s <code>afterClosed()</code> subscription receives.',
      ],
    },
    {
      heading: 'MatCard and mat-icon',
      points: [
        '<code>MatCard</code> is a surface container with optional header (<code>mat-card-header</code>), content (<code>mat-card-content</code>), and actions (<code>mat-card-actions</code>) slots — a consistent content-grouping element used everywhere in a Material UI.',
        '<code>mat-icon</code> renders icons from the Material Symbols font by name — add the font <code>&lt;link&gt;</code> to <code>index.html</code>, or register a custom SVG icon set via <code>MatIconRegistry</code> for icons outside the built-in set.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: \`
    <h2 mat-dialog-title>Confirm</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="ref.close(false)">Cancel</button>
      <button mat-flat-button color="warn" (click)="ref.close(true)">Confirm</button>
    </mat-dialog-actions>
  \`,
})
export class ConfirmDialog {
  data = inject(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<ConfirmDialog>);
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatSnackBarModule, MatDialogModule],
  template: \`
    <mat-card>
      <mat-card-content>
        <button mat-flat-button color="primary" (click)="showSnackbar()">Show snackbar</button>
        <button mat-raised-button color="warn" (click)="openDialog()">Open confirm dialog</button>
      </mat-card-content>
    </mat-card>
  \`,
})
export class App {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  showSnackbar() {
    this.snackBar.open('Saved successfully', 'Undo', { duration: 3000 })
      .afterDismissed()
      .subscribe(info => console.log('Dismissed via action click:', info.dismissedByAction));
  }

  openDialog() {
    this.dialog.open(ConfirmDialog, { data: { message: 'Delete this item?' } })
      .afterClosed()
      .subscribe(result => console.log('Dialog closed with:', result));
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideAnimationsAsync()] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Material common components</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Wrap the two buttons in a mat-card-actions section, and add a mat-card-header with a mat-card-title above them.',
    hint: '<mat-card-header><mat-card-title>Actions</mat-card-title></mat-card-header> above the existing <mat-card-content>, then move both buttons into a new <mat-card-actions> section instead of leaving them inside mat-card-content.',
    solution: `<mat-card>
  <mat-card-header>
    <mat-card-title>Actions</mat-card-title>
  </mat-card-header>
  <mat-card-actions>
    <button mat-flat-button color="primary" (click)="showSnackbar()">Show snackbar</button>
    <button mat-raised-button color="warn" (click)="openDialog()">Open confirm dialog</button>
  </mat-card-actions>
</mat-card>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the six button variants (flat, raised, stroked, plain, icon, fab) each need their own separate color API.',
      reality: 'all six accept the exact same color="primary|accent|warn" attribute — the variant controls the visual STYLE (filled, outlined, elevated, etc.), while color is a completely independent, consistently-named concern across all of them.',
    },
    {
      thought: 'MatDialog.open() returns the dialog\'s result value directly, synchronously.',
      reality: 'MatDialog.open() returns a MatDialogRef immediately — the actual result only arrives asynchronously via .afterClosed().subscribe(), once the user closes the dialog and MatDialogRef.close(result) is called from inside it.',
    },
    {
      thought: 'MatSnackBar.open() blocks further code execution until the user dismisses the toast.',
      reality: 'open() returns immediately — the snackbar shows asynchronously and auto-dismisses after its duration. .afterDismissed().subscribe() is how you react to the dismissal later, not a blocking wait.',
    },
  ];
}
