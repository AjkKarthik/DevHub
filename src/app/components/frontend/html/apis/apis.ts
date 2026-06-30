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
  selector: 'app-html-apis',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './apis.html',
  styleUrl: './apis.scss',
})
export class HtmlApis {
  quickRef: QuickRefItem[] = [
    { name: "navigator.geolocation.getCurrentPosition", type: "function", desc: "Asynchronously retrieves the current geographic position of the device." },
    { name: "Notification.requestPermission", type: "function", desc: "Requests user permission to display desktop notifications." },
    { name: "FileReader", type: "class", desc: "Allows web applications to asynchronously read the contents of files stored on the user's computer." },
    { name: "DataTransfer", type: "class", desc: "Holds data that is being dragged and dropped in a drag-and-drop operation." },
    { name: "navigator.clipboard.writeText", type: "function", desc: "Writes the specified text to the system clipboard." },
    { name: "navigator.share", type: "function", desc: "Invokes the native share sheet for sharing content via other apps." },
    { name: "File API (File/FileList/Blob)", type: "class", desc: "Interfaces representing files and binary large objects for reading/writing." },
    { name: "DragEvent", type: "interface", desc: "Interface for events related to dragging and dropping elements." },
    { name: "ClipboardEvent", type: "interface", desc: "Interface for events related to clipboard operations like copy/paste." },
    { name: "Web Share API", type: "interface", desc: "API that allows web apps to invoke the native share functionality." }
  ];

  theory: TheoryPoint[] = [
    {
      heading: "Geolocation API: getCurrentPosition, watchPosition, permissions",
      points: [
        "getCurrentPosition retrieves the user's location once, accepting success and error callbacks.",
        "watchPosition continuously monitors location changes, returning a watch ID to stop monitoring.",
        "Permissions must be granted by the user; browsers block access if denied or on insecure contexts (HTTP).",
        "The Position object contains coords (latitude, longitude, accuracy) and timestamp."
      ]
    },
    {
      heading: "Notifications API: requestPermission, new Notification(), options",
      points: [
        "requestPermission returns a Promise resolving to 'granted', 'denied', or 'default'.",
        "new Notification(title, options) creates a desktop notification visible even when the tab is inactive.",
        "Options include body, icon, tag (for grouping), and actions (buttons).",
        "Notifications require HTTPS and user permission; they are not supported in all mobile browsers."
      ]
    },
    {
      heading: "File API: File, FileReader, readAsText/readAsDataURL, FileList",
      points: [
        "File objects represent individual files from input[type=file] or drag-and-drop events.",
        "FileReader reads file contents asynchronously using methods like readAsText or readAsDataURL.",
        "readAsDataURL returns a base64 string suitable for displaying images in <img> tags.",
        "FileList is a collection of File objects, typically accessed via input.files."
      ]
    },
    {
      heading: "Drag and Drop API: draggable, dragstart/dragover/drop events, DataTransfer",
      points: [
        "Set draggable='true' on elements to make them draggable.",
        "dragstart initiates the drag; dragover must call preventDefault() to allow dropping.",
        "drop event receives the DataTransfer object containing dragged data.",
        "setData and getData on DataTransfer allow passing custom MIME types (e.g., text/plain)."
      ]
    },
    {
      heading: "Clipboard and Web Share APIs: writeText/readText, navigator.share, feature detection",
      points: [
        "navigator.clipboard.writeText requires HTTPS and user gesture context.",
        "readText returns a Promise resolving to the clipboard content string.",
        "navigator.share opens the native share sheet; check for existence before calling.",
        "Web Share API is mobile-friendly but not supported on all desktop browsers."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: "Geolocation + Notifications",
      language: "html",
      code: `<!-- Template -->
<div class="geo-notify-demo">
  <button (click)="getLocation()">Get Location</button>
  <button (click)="sendNotification()">Send Notification</button>
  <p *ngIf="location">{{ location.latitude }}, {{ location.longitude }}</p>
</div>

<!-- Component Logic -->
import { Component } from '@angular/core';

interface Position {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-geo-notify',
  template: \`
    <button (click)="getLocation()">Get Location</button>
    <button (click)="sendNotification()">Send Notification</button>
    <p *ngIf="location">{{ location.latitude }}, {{ location.longitude }}</p>
  \`
})
export class GeoNotifyComponent {
  location: Position | null = null;

  getLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
      },
      (err) => console.error(err)
    );
  }

  sendNotification(): void {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification('Hello!', { body: 'Location updated!' });
      }
    });
  }
}`
    },
    {
      label: "File drag-and-drop reader",
      language: "html",
      code: `<!-- Template -->
<div class="drop-zone"
     (dragover)="onDragOver($event)"
     (dragleave)="onDragLeave($event)"
     (drop)="onDrop($event)">
  <p>Drag files here</p>
</div>

<!-- Component Logic -->
import { Component } from '@angular/core';

@Component({
  selector: 'app-file-drop',
  template: \`
    <div class="drop-zone"
         (dragover)="onDragOver($event)"
         (dragleave)="onDragLeave($event)"
         (drop)="onDrop($event)">
      <p>Drag files here</p>
    </div>
  \`
})
export class FileDropComponent {
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files) {
      this.readFile(files[0]);
    }
  }

  readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => console.log(reader.result);
    reader.readAsText(file);
  }
}`
    },
    {
      label: "Clipboard copy + Web Share API",
      language: "html",
      code: `<!-- Template -->
<div class="share-demo">
  <button (click)="copyToClipboard()">Copy Text</button>
  <button (click)="shareContent()">Share Content</button>
</div>

<!-- Component Logic -->
import { Component } from '@angular/core';

@Component({
  selector: 'app-share-clipboard',
  template: \`
    <button (click)="copyToClipboard()">Copy Text</button>
    <button (click)="shareContent()">Share Content</button>
  \`
})
export class ShareClipboardComponent {
  async copyToClipboard(): Promise<void> {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText('Hello World');
      alert('Copied!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }

  async shareContent(): Promise<void> {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: 'Check this out',
        text: 'A great article!',
        url: window.location.href
      });
    } catch (err) {
      console.error('Share failed', err);
    }
  }
}`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: "Calling geolocation without checking permissions",
      wrong: "navigator.geolocation.getCurrentPosition(success, error)",
      right: "Check navigator.permissions.query({ name: 'geolocation' }) or handle errors gracefully.",
      explanation: "Browsers may block requests if permission is denied; always handle the error callback."
    },
    {
      title: "Creating Notification without permission",
      wrong: "new Notification('Hi')",
      right: "Notification.requestPermission().then(() => new Notification('Hi'))",
      explanation: "Notifications will fail silently or throw if permission is not granted first."
    },
    {
      title: "Not checking if browser supports share API",
      wrong: "navigator.share({ title: 'Share' })",
      right: "if (navigator.share) { navigator.share(...) }",
      explanation: "The Web Share API is not supported in all browsers; feature detection is required."
    },
    {
      title: "Missing preventDefault on dragover",
      wrong: "(dragover)='onDragOver($event)'",
      right: "(dragover)='$event.preventDefault(); onDragOver($event)'",
      explanation: "Without preventDefault, the drop event will not fire in most browsers."
    },
    {
      title: "Reading files synchronously with FileReaderSync in main thread",
      wrong: "const reader = new FileReaderSync(); reader.readAsText(file)",
      right: "Use async FileReader with onload callback.",
      explanation: "FileReaderSync blocks the UI thread; it should only be used in Web Workers."
    }
  ];

  challenge: Challenge = {
    title: "Build a drag-and-drop file reader that displays the name and size of dropped files",
    language: "html",
    description: "Create an Angular component with a drop zone. When files are dropped, display their names and sizes in KB.",
    hints: [
      "Use (drop) event on a div.",
      "Access e.dataTransfer.files to get the FileList.",
      "Convert bytes to KB by dividing by 1024."
    ],
    starterCode: `import { Component } from '@angular/core';

@Component({
  selector: 'app-file-reader',
  template: \`
    <div class="drop-zone" (drop)="onDrop($event)">
      Drop files here
    </div>
    <ul>
      <!-- Display file info here -->
    </ul>
  \`
})
export class FileReaderComponent {
  files: File[] = [];

  onDrop(e: DragEvent): void {
    e.preventDefault();
    // Implement logic here
  }
}`,
    solution: `import { Component } from '@angular/core';

@Component({
  selector: 'app-file-reader',
  template: \`
    <div class="drop-zone" (drop)="onDrop($event)">
      Drop files here
    </div>
    <ul>
      <li *ngFor="let file of files">
        {{ file.name }} - {{ (file.size / 1024).toFixed(2) }} KB
      </li>
    </ul>
  \`
})
export class FileReaderComponent {
  files: File[] = [];

  onDrop(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer?.files) {
      this.files = Array.from(e.dataTransfer.files);
    }
  }
}`
  };

  quiz: QuizQuestion[] = [
    {
      q: "Which method is used to request permission for desktop notifications?",
      options: ["Notification.permission", "Notification.requestPermission()", "window.notify()", "navigator.notifications.allow()"],
      answer: 1,
      explanation: "Notification.requestPermission() returns a Promise resolving to 'granted', 'denied', or 'default'. You must have permission before calling new Notification()."
    },
    { q: "Which event must you call preventDefault() on to allow a drop target to accept drops?", options: ["dragstart", "drag", "dragover", "drop"], answer: 2, explanation: "Browsers block drops by default. Calling event.preventDefault() on dragover signals that this element accepts the dropped data." },
    { q: "Which Clipboard API method reads text from the clipboard?", options: ["navigator.clipboard.getText()", "navigator.clipboard.readText()", "document.execCommand('paste')", "clipboard.read()"], answer: 1, explanation: "navigator.clipboard.readText() returns a Promise with the text content. It requires HTTPS and user permission." },
    { q: "What does navigator.geolocation.watchPosition() do differently from getCurrentPosition()?", options: ["It is faster", "It calls the callback once on load", "It continuously calls the callback as position changes", "It uses GPS only"], answer: 2, explanation: "watchPosition() returns a watcher ID and fires the callback each time the device position changes. getCurrentPosition() fires once." },
    { q: "When should you use the Web Share API over a custom share UI?", options: ["Never — build your own for full control", "When you want native OS share sheets on mobile devices", "Only on desktop browsers", "When sharing to a specific platform"], answer: 1, explanation: "navigator.share() triggers the native OS share sheet on mobile, giving access to all installed apps. Always feature-detect with 'navigator.share' in window before calling it." },
    { q: "What does the Battery Status API provide?", options: ["Control over charging", "Battery level, charging state, and time to charge/discharge", "Power management for the GPU", "A way to dim the screen"], answer: 1, explanation: "navigator.getBattery() returns a BatteryManager with .level (0–1), .charging (boolean), .chargingTime, and .dischargingTime. Useful for low-battery warnings or switching to a lightweight mode. The API has limited browser support due to fingerprinting concerns." }
  ];

  qna: QnaItem[] = [
    { q: "Why does the Geolocation API require explicit user permission?", a: "Location data is sensitive personal information. Browsers enforce a permission prompt so users consciously grant access. HTTPS is required — the API is blocked on insecure origins to prevent interception of location data in transit." },
    { q: "Why must you call event.preventDefault() on dragover?", a: "Browsers deny drops by default to prevent accidental data loss. Calling preventDefault() on the dragover event signals that the element is a valid drop target, enabling the drop event to fire." },
    { q: "What are the limitations of the Clipboard API?", a: "The Clipboard API requires HTTPS and user permission for readText(). writeText() typically works without a permission prompt but still requires a secure context. Some browsers (Firefox) require a user gesture (e.g. button click) to call clipboard methods." },
    { q: "When should you use Web Share API vs custom social share buttons?", a: "Use navigator.share() when targeting mobile users — it invokes the native OS share sheet and covers all installed apps with one button. Use custom share buttons when you need desktop support, specific platform targeting, or analytics on share actions." },
    { q: "What is the Notification API and what is required before showing a notification?", a: "The Notification API creates system-level notifications outside the browser window. You must first call Notification.requestPermission() and wait for the user to grant access. Best practice: only request permission after a user action (button click) rather than on page load — automatic permission prompts are often denied. Notifications require HTTPS and a Service Worker for Push Notifications (background delivery)." },
    { q: "How does the Page Visibility API help with performance?", a: "The Page Visibility API provides document.visibilityState ('visible', 'hidden') and fires a visibilitychange event when users switch tabs or minimise the window. Use it to: pause video/animations when hidden (saves CPU/battery), pause polling intervals, pause timers, or log analytics about engagement. Browsers already throttle inactive tabs, but your own intervals/animations still run unless you pause them." }
  ];

  revision: RevisionSummary = {
    oneLiner: "HTML5 Browser APIs unlock geolocation, notifications, file reading, drag-and-drop, clipboard access, and native OS sharing — all from JavaScript with appropriate permissions.",
    mustKnow: [
      "Geolocation: getCurrentPosition() for a one-shot fix; watchPosition() for continuous tracking — both require HTTPS and user permission",
      "Notifications: must call Notification.requestPermission() and get 'granted' before creating a new Notification()",
      "File API: use FileReader.readAsText() or readAsDataURL() — FileReader is async; listen to the 'load' event for the result",
      "Drag & Drop: dragover must call preventDefault() to enable drops; use event.dataTransfer to pass data between drag source and target",
      "Clipboard API: navigator.clipboard.writeText()/readText() — HTTPS required; readText() needs explicit permission",
      "Web Share API: navigator.share() — always feature-detect with 'share' in navigator before calling"
    ],
    interviewFocus: [
      "Why do browser APIs like Geolocation and Clipboard require HTTPS and user permission?",
      "Explain the drag-and-drop event sequence and why preventDefault on dragover is required",
      "How does FileReader work asynchronously — what event do you listen to for the result?",
      "When would you reach for navigator.share() and how do you handle unsupported browsers?"
    ]
  };
}
