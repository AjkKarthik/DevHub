import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-html-canvas-svg',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './canvas-svg.html',
  styleUrl: './canvas-svg.scss',
})
export class HtmlCanvasSvg {
  quickRef: QuickRefItem[] = [
    { name: 'getContext', type: 'method', desc: 'Retrieves the rendering context (e.g., "2d") for drawing on the canvas element.' },
    { name: 'fillRect', type: 'method', desc: 'Draws a filled rectangle. Takes x, y, width, and height parameters.' },
    { name: 'beginPath', type: 'method', desc: 'Starts a new path or resets the current path to ensure shapes are drawn independently.' },
    { name: 'arc', type: 'method', desc: 'Creates an arc/curve. Requires center coordinates, radius, start angle, end angle, and direction.' },
    { name: 'fillText', type: 'method', desc: 'Draws filled text on the canvas at specified x and y coordinates.' },
    { name: 'drawImage', type: 'method', desc: 'Draws an image element onto the canvas. Can scale or crop the image.' },
    { name: 'viewBox', type: 'syntax', desc: 'SVG attribute defining the coordinate system and aspect ratio for scaling.' },
    { name: 'path d', type: 'syntax', desc: "SVG path data — the 'd' attribute defines shapes with M (moveto), L (lineto), C (curveto), Z (closepath) commands." },
    { name: 'requestAnimationFrame', type: 'method', desc: 'Instructs the browser to call a specified function to update an animation before the next repaint.' },
    { name: 'save/restore', type: 'method', desc: 'Saves and restores the canvas state (transformations, styles) using a stack mechanism.' }
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Canvas vs SVG Differences',
      points: [
        'Canvas is raster-based (pixels), while SVG is vector-based (mathematical paths).',
        'Canvas does not support event handlers for individual shapes; SVG elements are DOM nodes and can have listeners.',
        'Canvas rendering is immediate; once drawn, pixels are gone unless redrawn. SVG remains in the DOM.',
        'SVG is resolution-independent and scales perfectly; Canvas depends on device pixel density.',
        'Canvas is better for high-performance graphics (games), while SVG is better for UI icons and charts.'
      ]
    },
    {
      heading: 'Canvas 2D Drawing API',
      points: [
        'Always call getContext("2d") to get the drawing context.',
        'Use beginPath() before starting a new shape to avoid merging paths.',
        'fillStyle and strokeStyle control colors for filled and outlined shapes respectively.',
        'Transformations like translate, rotate, and scale affect subsequent drawing operations.',
        'clearRect(x, y, w, h) is used to erase parts of the canvas.'
      ]
    },
    {
      heading: 'Canvas Text and Images',
      points: [
        'font property sets text size and family (e.g., "bold 14px Arial").',
        'textAlign and textBaseline control alignment relative to the x,y coordinate.',
        'drawImage can take source image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight for cropping/scaling.',
        'Images must be loaded before drawing; use onload event or await loading.',
        'Text metrics (width, ascent, descent) help in precise text placement.'
      ]
    },
    {
      heading: 'SVG Elements and Attributes',
      points: [
        'Basic shapes include <rect>, <circle>, <ellipse>, <line>, <polyline>, and <polygon>.',
        '<path> is the most powerful element, allowing complex curves and lines.',
        'viewBox="min-x min-y width height" defines the coordinate system for scaling.',
        'Attributes like fill, stroke, stroke-width control visual appearance.',
        'SVG elements support CSS styling and hover effects natively.'
      ]
    },
    {
      heading: 'Animation Approaches',
      points: [
        'Canvas animation uses requestAnimationFrame for smooth 60fps updates.',
        'In Canvas, you must clear the previous frame before drawing the new one.',
        'SVG animation can use CSS transitions/animations or SMIL (<animate> tags).',
        'CSS animations on SVG elements are performant and easy to implement.',
        'Canvas is generally more performant for many moving objects due to lack of DOM overhead.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Canvas Shapes & Text',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Canvas Basics</title>
  <style>
    canvas { border: 1px solid black; }
  </style>
</head>
<body>
  <canvas id="myCanvas" width="400" height="300"></canvas>

  <script>
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // Draw a filled rectangle
    ctx.fillStyle = '#FF5733';
    ctx.fillRect(10, 10, 100, 80);

    // Draw a stroked circle
    ctx.beginPath();
    ctx.arc(250, 50, 40, 0, Math.PI * 2);
    ctx.strokeStyle = '#33FF57';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Draw text
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#3333FF';
    ctx.textAlign = 'center';
    ctx.fillText('Hello Canvas', 200, 150);

    // Draw a line
    ctx.beginPath();
    ctx.moveTo(10, 200);
    ctx.lineTo(390, 200);
    ctx.strokeStyle = '#000';
    ctx.stroke();
  </script>
</body>
</html>`
    },
    {
      label: 'Canvas Animation Loop',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Canvas Animation</title>
  <style>
    canvas { display: block; margin: auto; background: #f0f0f0; }
  </style>
</head>
<body>
  <canvas id="animCanvas" width="600" height="400"></canvas>

  <script>
    const canvas = document.getElementById('animCanvas');
    const ctx = canvas.getContext('2d');
    
    let x = 50;
    let y = 50;
    const speed = 2;

    function animate() {
      // Clear the previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the moving circle
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'blue';
      ctx.fill();

      // Update position
      x += speed;
      if (x > canvas.width - 30 || x < 30) {
        speed *= -1;
      }

      // Request next frame
      requestAnimationFrame(animate);
    }

    // Start the animation
    animate();
  </script>
</body>
</html>`
    },
    {
      label: 'SVG Shapes & CSS Animation',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SVG Animation</title>
  <style>
    .animated-circle {
      fill: red;
      animation: moveCircle 3s infinite alternate ease-in-out;
    }

    @keyframes moveCircle {
      from { transform: translate(0, 0); }
      to { transform: translate(200px, 100px); }
    }
    
    svg { border: 1px solid #ccc; background: #fff; }
  </style>
</head>
<body>
  <svg width="400" height="300" viewBox="0 0 400 300">
    <!-- Static Rectangle -->
    <rect x="10" y="10" width="100" height="50" fill="blue" />
    
    <!-- Animated Circle -->
    <circle cx="50" cy="200" r="30" class="animated-circle" />
    
    <!-- Static Text -->
    <text x="150" y="150" font-size="24" fill="black">
      SVG is Scalable
    </text>
  </svg>
</body>
</html>`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Missing beginPath',
      wrong: 'ctx.arc(10, 10, 5, 0, Math.PI*2); ctx.stroke(); ctx.arc(20, 20, 5, 0, Math.PI*2); ctx.stroke();',
      right: 'ctx.beginPath(); ctx.arc(10, 10, 5, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(20, 20, 5, 0, Math.PI*2); ctx.stroke();',
      explanation: 'Without beginPath(), subsequent strokes might connect to previous paths or accumulate styles unexpectedly.'
    },
    {
      title: 'CSS vs HTML Canvas Size',
      wrong: '<canvas width="300" height="150" style="width: 600px; height: 300px;"></canvas>',
      right: '<canvas width="600" height="300" style="width: 600px; height: 300px;"></canvas>',
      explanation: 'Setting only CSS size scales the pixels, causing blurriness. The HTML width/height attributes define the actual resolution.'
    },
    {
      title: 'Canvas for Scalable Icons',
      wrong: 'Using Canvas to draw a logo that needs to be resized across different screen sizes.',
      right: 'Use SVG for logos and icons.',
      explanation: 'Canvas is pixel-based. If the container size changes, the image may become blurry or pixelated. SVG scales perfectly.'
    },
    {
      title: 'Missing save/restore',
      wrong: 'ctx.translate(100, 100); ctx.fillRect(0, 0, 50, 50); ctx.fillRect(0, 0, 50, 50);',
      right: 'ctx.save(); ctx.translate(100, 100); ctx.fillRect(0, 0, 50, 50); ctx.restore(); ctx.fillRect(0, 0, 50, 50);',
      explanation: 'Transformations persist. Without save/restore, subsequent drawings will be offset by the previous translation.'
    },
    {
      title: 'SVG without viewBox',
      wrong: '<svg width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>',
      right: '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>',
      explanation: 'Without viewBox, the coordinate system defaults to user space, which can cause scaling issues when the SVG is resized via CSS.'
    }
  ];

  challenge: Challenge = {
    title: 'Canvas Bar Chart',
    language: 'html',
    description: 'Draw a bar chart on an HTML5 Canvas element with 5 bars. The heights should be [120, 80, 150, 60, 100]. Each bar should have a width of 40px and be spaced by 10px. Start drawing from the bottom left.',
    hints: [
      'Calculate the total width needed for all bars and spacing.',
      'Use ctx.fillRect(x, y, width, height) for each bar.',
      'The y-coordinate should be calculated as canvasHeight - barHeight to anchor at the bottom.',
      'Loop through the heights array to draw each bar dynamically.'
    ],
    starterCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Canvas Bar Chart</title>
  <style>
    canvas { border: 1px solid #ccc; background: #f9f9f9; }
  </style>
</head>
<body>
  <canvas id="barChart" width="400" height="300"></canvas>
  <script>
    const heights = [120, 80, 150, 60, 100];
    const canvas = document.getElementById('barChart');
    const ctx = canvas.getContext('2d');
    // TODO: Draw bars using fillRect for each height
  </script>
</body>
</html>`,
    solution: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Canvas Bar Chart - Solution</title>
  <style>
    canvas { border: 1px solid #333; background: white; }
  </style>
</head>
<body>
  <canvas id="barChart" width="400" height="300"></canvas>
  <script>
    const heights = [120, 80, 150, 60, 100];
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    const canvas = document.getElementById('barChart');
    const ctx = canvas.getContext('2d');
    const barWidth = 40;
    const gap = 10;
    const startX = 20;
    const canvasH = canvas.height;
    heights.forEach((h, i) => {
      const x = startX + i * (barWidth + gap);
      ctx.fillStyle = colors[i];
      ctx.fillRect(x, canvasH - h, barWidth, h);
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(String(h), x + barWidth / 2, canvasH - h - 5);
    });
  </script>
</body>
</html>`
  };

  quiz: QuizQuestion[] = [
    { q: 'Which HTML element provides a pixel-based drawing surface?', options: ['<svg>', '<canvas>', '<picture>', '<video>'], answer: 1, explanation: '<canvas> gives a bitmap surface; JavaScript draws pixels onto it via getContext("2d") or WebGL.' },
    { q: 'What is the key rendering difference between Canvas and SVG?', options: ['Canvas is vector, SVG is raster', 'SVG is vector, Canvas is raster', 'Both are vector', 'Both are raster'], answer: 1, explanation: 'SVG describes shapes mathematically (resolution-independent). Canvas draws pixels that become blurry when scaled.' },
    { q: 'Which Canvas API method must you call before drawing each independent shape?', options: ['newShape()', 'resetPath()', 'beginPath()', 'clearPath()'], answer: 2, explanation: 'beginPath() starts a fresh path. Without it, shapes merge into the current path and inherit previous styles.' },
    { q: 'Which function produces smooth ~60fps Canvas animation?', options: ['setInterval(fn, 16)', 'setTimeout(fn, 16)', 'requestAnimationFrame(fn)', 'setImmediate(fn)'], answer: 2, explanation: 'requestAnimationFrame syncs with the display refresh, pauses in hidden tabs, and gives the smoothest animation.' },
    { q: 'Why does setting only CSS width/height on a canvas cause blurry output?', options: ['CSS overrides the internal resolution', 'HTML attributes define pixel buffer size; CSS just stretches that fixed buffer', 'Canvas ignores CSS dimensions entirely', 'Canvas defaults to 1x pixel density'], answer: 1, explanation: 'The canvas bitmap is fixed at the HTML attribute dimensions. CSS scaling stretches fewer pixels across a larger area, causing blur.' }
  ];

  qna: QnaItem[] = [
    { q: 'When should I choose Canvas over SVG?', a: 'Choose Canvas for high-frequency redraws with many objects (games, particles, real-time charts). Choose SVG when shapes need to be interactive, accessible, or easily styled with CSS.' },
    { q: 'How do I handle retina/HiDPI displays with Canvas?', a: 'Read window.devicePixelRatio, multiply canvas width/height HTML attributes by that ratio, call ctx.scale(dpr, dpr), then set CSS size back to the original logical pixels.' },
    { q: 'Is SVG accessible to screen readers?', a: 'Yes — SVG is DOM-based, so you can add <title>, <desc>, role="img", and aria-label. Canvas has no built-in accessibility; add fallback content inside the canvas element.' },
    { q: 'What is save()/restore() used for?', a: 'They push/pop the canvas drawing state (transforms, styles, clip regions) onto a stack. Use save() before temporary transforms and restore() after to prevent state leaking into subsequent draw calls.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Canvas renders pixels imperatively (fast, no DOM overhead); SVG describes shapes declaratively (scalable, accessible, CSS-styleable).',
    mustKnow: [
      'Canvas is raster: once drawn, pixels have no identity — redraw every frame for animation',
      'SVG is vector and DOM-based: each shape is a node you can query, style, and add event listeners to',
      'Always call beginPath() before each new shape to avoid merging paths unexpectedly',
      'Canvas size: HTML attributes set pixel resolution; CSS sets display size — mismatch causes blur',
      'requestAnimationFrame is the correct animation loop — not setInterval or setTimeout',
      'save()/restore() protect drawing state (transforms, fillStyle, etc.) across isolated draw calls'
    ],
    interviewFocus: [
      'Canvas vs SVG trade-offs: when to choose each for performance vs interactivity',
      'Why beginPath() is required and what happens without it',
      'How to support HiDPI/retina screens in Canvas',
      'Why SVG is preferred for icons and logos while Canvas suits games and particle systems'
    ]
  };
}
