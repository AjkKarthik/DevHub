import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-text-in-view-crashes-only-in-production-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './text-in-view-crashes-only-in-production.html',
  styleUrl: './text-in-view-crashes-only-in-production.scss',
})
export class TextInViewCrashesOnlyInProductionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #6 Contains a Genuinely Dangerous Detail: "Dev Mode May Be Lenient"',
      points: [
        'Mistake #6\'s explanation states: "React Native\'s native renderer does not support text nodes as direct children of View. It crashes with \'Text strings must be rendered within a &lt;Text&gt; component.\' Dev mode may be lenient but production builds will crash." Most of the main page\'s other mistakes behave identically in dev and production — this one specifically does NOT, and that asymmetry is the actual danger.',
        'This subtopic isolates exactly WHY that asymmetry exists: it is not a coincidence or a minor inconsistency, it is a structural difference in how dev builds and production (release) builds validate the native view tree, which means a developer can genuinely ship this bug to the App Store / Play Store without ever seeing it locally.',
      ],
    },
    {
      heading: 'Why Dev and Production Builds Diverge Here Specifically',
      points: [
        'In a development build, React Native runs with additional runtime checks and warning machinery (similar in spirit to React\'s own StrictMode double-invocation) that can surface — or in some RN/Yoga-layout-engine versions, silently tolerate and even auto-wrap — a bare text node, sometimes producing a warning rather than a hard crash.',
        'A production (release) build strips out these development-time checks entirely for performance and bundle size — the native Yoga layout engine receives a text node where it expects a native view descriptor, and the native code path for that mismatch is an unhandled crash, not a graceful warning.',
        'The practical consequence: a component that "worked fine" throughout local development on a simulator can crash immediately on first launch of a TestFlight or Play Store internal-testing production build — precisely the build that is hardest to attach a debugger to, and the one your actual users see first.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — passes silently or warns in dev, crashes in production',
      language: 'typescript',
      code: `import { View, Text } from 'react-native';

function ProductBadge({ label, count }: { label: string; count: number }) {
  return (
    <View style={{ flexDirection: 'row', padding: 8 }}>
      {label}
      {/* A bare text node as a direct child of View.
          In a DEV build: may render with a yellow-box warning, or in
          some cases render visually with no crash at all.
          In a PRODUCTION build: hard crash --
          "Text strings must be rendered within a <Text> component." */}
      {count > 0 && \` (\${count})\`}
    </View>
  );
}`,
    },
    {
      label: 'The fix — every text node explicitly wrapped',
      language: 'typescript',
      code: `import { View, Text } from 'react-native';

function ProductBadge({ label, count }: { label: string; count: number }) {
  return (
    <View style={{ flexDirection: 'row', padding: 8 }}>
      <Text>{label}</Text>
      {count > 0 && <Text> ({count})</Text>}
    </View>
  );
}

// A conditional that renders 0 is a related, separate trap worth
// checking for at the same time: {count && <Text>{count}</Text>}
// renders the LITERAL number 0 as a bare text node when count is 0,
// because 0 is falsy but React still renders it. Use a boolean
// comparison instead: {count > 0 && <Text>{count}</Text>}`,
    },
    {
      label: 'Catching it before a real device — a lint rule + EAS production profile',
      language: 'typescript',
      code: `// eslint-plugin-react-native catches this statically, before ANY build:
// npm install --save-dev eslint-plugin-react-native
// .eslintrc: { "plugins": ["react-native"], "rules": { "react-native/no-raw-text": "error" } }

// The safest verification is testing an ACTUAL production-profile
// build locally, not just trusting Expo Go / the dev client:
//   eas build --profile production --platform ios --local
// Expo Go and dev clients run the SAME lenient dev-mode checks as
// the simulator -- they do not reproduce the production crash. Only
// an actual release-configuration build exercises the code path
// that will crash for real users.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "I tested this component thoroughly on my simulator with Expo Go and never saw a crash, so this raw-text-in-View bug must not apply here." What is wrong with that verification?',
    hint: 'Expo Go and a local dev client both run a DEVELOPMENT build under the hood — ask whether that build configuration is the one that actually strips the lenient checks.',
    solution: `The verification is incomplete because Expo Go (and any local dev
client) runs a DEVELOPMENT build -- the same build configuration
that the main page's Mistake #6 explicitly calls out as "may be
lenient." Testing exclusively through Expo Go or a dev client can
genuinely never reproduce this specific crash, no matter how
thoroughly the simulator is exercised, because the code path that
crashes only exists in a PRODUCTION (release) build configuration.

This is a case where "I tested it and it worked" is true but
insufficient -- the teammate tested a DIFFERENT build configuration
than the one that will actually run on users' devices after an App
Store / Play Store release. The only way to genuinely rule this bug
out is either a static lint rule (react-native/no-raw-text) that
catches it without needing any build at all, or an actual
production-profile build (eas build --profile production, or a
release-configuration Xcode/Android Studio build) run and tested
directly -- not Expo Go, not the standard dev client, and not the
simulator's default (development) configuration.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a component renders correctly in the Expo Go app or a dev client without any warning, the raw-text-in-View bug does not apply to it.',
      reality: 'Expo Go and dev clients run a DEVELOPMENT build configuration — the exact configuration the main page describes as potentially lenient. The bug can still exist and will surface specifically in a PRODUCTION build, which Expo Go never exercises.',
    },
    {
      thought: 'this is the same category of bug as any other React mistake — inconvenient to fix, but consistently reproducible wherever you test it.',
      reality: 'this specific mistake is unusual precisely because dev and production builds can genuinely behave differently — most bugs are consistent across build configurations, which makes this one easy to under-estimate during local testing.',
    },
    {
      thought: '{count && <Text>{count}</Text>} is a safe way to conditionally render a count badge, since count is a number and the JSX only renders when truthy.',
      reality: 'when count is 0, 0 is falsy but React still renders the LITERAL text "0" as a bare child — the exact bug this subtopic covers, hiding inside what looks like a normal conditional-render pattern. Use count > 0 && ... instead.',
    },
  ];
}
