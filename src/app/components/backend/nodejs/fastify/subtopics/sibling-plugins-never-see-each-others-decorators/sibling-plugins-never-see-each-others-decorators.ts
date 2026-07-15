import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './sibling-plugins-never-see-each-others-decorators.html',
  styleUrl: './sibling-plugins-never-see-each-others-decorators.scss'
})
export class SiblingPluginsNeverSeeEachOthersDecoratorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says "child plugins inherit parent decorations" — worth being precise about the direction this inheritance actually flows, since it is NOT symmetric between plugins at the same level',
      points: [
        'Fastify\'s own Plugins Guide states this explicitly: "encapsulation applies to the ancestors and siblings, but not the children." Decorations flow strictly DOWNWARD through the ancestor chain — a plugin\'s own decorators are visible to that plugin itself and to any plugins registered INSIDE it (its descendants) — never sideways to a sibling plugin registered at the same level under the same parent, and never back up to the parent that registered it.',
        'This means two plugins registered one after another via app.register(pluginA) and app.register(pluginB), both as DIRECT children of the same root instance, are completely isolated from each other by default — pluginA calling fastify.decorate(\'foo\', ...) inside its own scope has absolutely no effect on what pluginB\'s own routes and hooks can see, regardless of registration order between them.',
      ]
    },
    {
      heading: 'Why this trips up developers who correctly understood parent→child inheritance but assumed siblings worked the same way',
      points: [
        'The main page\'s own mistake entry ("Registering global plugins after routes") already establishes that registration ORDER matters — which can create a reasonable-sounding but WRONG mental model: "since order matters, registering pluginA before pluginB should make pluginA\'s decorators available to pluginB, the same way registering a plugin before a route makes it available to that route." This is incorrect specifically for sibling plugins — a route registered directly on the root instance (not inside any plugin) genuinely does see decorations from plugins registered earlier on that SAME root instance, because that route is a direct child of root, not a sibling of the plugin.',
        'The fix for genuinely shared, cross-plugin state (a database connection every feature plugin needs) is exactly what the main page already shows for the parent-visibility case: wrap the plugin providing that shared state with fastify-plugin (fp()), which breaks its encapsulation so the decoration becomes visible on the PARENT scope — and from there, every sibling plugin registered afterward on that same parent CAN see it, since they are now seeing a decoration on their common ancestor, not on an unrelated sibling.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two sibling plugins — pluginB cannot see pluginA\'s decorator',
      language: 'typescript',
      code: `const app = Fastify();

const pluginA = async (fastify, opts) => {
  fastify.decorate('cache', new Map());
  // "cache" is visible to pluginA itself and to anything
  // registered INSIDE pluginA — but NOT to any sibling.
};

const pluginB = async (fastify, opts) => {
  fastify.get('/status', async (request, reply) => {
    // BUG: fastify.cache is undefined here — pluginB is a SIBLING
    // of pluginA (both direct children of app), not a descendant
    // of it. Registration order between them makes no difference —
    // pluginA being registered FIRST does not make its decorators
    // visible to pluginB.
    return { cacheSize: fastify.cache.size }; // throws: cannot read
                                                // properties of undefined
  });
};

app.register(pluginA);
app.register(pluginB); // still isolated from pluginA, regardless of order`,
    },
    {
      label: 'The fix — fp() promotes the decorator to the shared parent scope',
      language: 'typescript',
      code: `import fp from 'fastify-plugin';

const app = Fastify();

// Wrapping with fp() breaks pluginA's OWN encapsulation, making
// its decorator visible on the PARENT (app) instance instead of
// staying trapped inside pluginA's own isolated scope.
const pluginA = fp(async (fastify, opts) => {
  fastify.decorate('cache', new Map());
});

const pluginB = async (fastify, opts) => {
  fastify.get('/status', async (request, reply) => {
    // Now works — pluginB sees "cache" because it's now a
    // decoration on their SHARED ANCESTOR (app), which pluginB
    // correctly inherits from as app's own child. This is
    // parent-to-child inheritance working normally — pluginA and
    // pluginB are still not directly seeing each other at all.
    return { cacheSize: fastify.cache.size };
  });
};

app.register(pluginA);
app.register(pluginB);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer registers an authPlugin (which decorates fastify with an authenticate function) and then, immediately after, registers a separate ordersPlugin whose routes call fastify.authenticate() in a preHandler hook. Both are registered as direct children of the same root Fastify instance, in that order. The developer reasons: "authPlugin is registered first, so its decorator should already exist by the time ordersPlugin is registered — this should work." Testing reveals fastify.authenticate is undefined inside ordersPlugin. Explain why registration order alone did not make this work, and describe the fix.',
    hint: 'Are authPlugin and ordersPlugin in a parent-child (ancestor-descendant) relationship with each other, or are they both children of the SAME parent — and does Fastify\'s encapsulation model treat those two relationships the same way?',
    solution: 'Registration order between authPlugin and ordersPlugin is irrelevant here because they are SIBLINGS — both direct children of the same root instance — not in a parent-child relationship with each other. Fastify\'s own documentation states encapsulation applies to "ancestors and siblings, but not the children" — meaning a decorator added inside authPlugin\'s own scope is only visible to authPlugin itself and to anything registered INSIDE authPlugin (its own descendants), never to a sibling plugin like ordersPlugin, no matter which one was registered first. The developer\'s mental model (order determines visibility) is only correct for genuinely nested relationships — a route registered directly on root AFTER a plugin genuinely does see that plugin\'s decorations, because the route is a child of root, and the plugin\'s decoration was promoted to root\'s scope if wrapped with fastify-plugin. The fix is wrapping authPlugin with fp() (fastify-plugin), which breaks ITS OWN encapsulation and makes the authenticate decorator visible on the shared parent (root) instance instead — from there, ordersPlugin (also a child of root) correctly inherits it through normal parent-to-child inheritance, not through any direct sibling-to-sibling visibility.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since Fastify plugin registration order matters (a plugin must be registered before anything that depends on it), registering pluginA before pluginB makes pluginA\'s decorators available to pluginB, the same way it makes them available to a route registered afterward.',
      reality: 'This subtopic\'s theory clarifies this only holds for genuine ancestor-descendant relationships — two plugins registered as SIBLINGS under the same parent are isolated from each other regardless of registration order, since Fastify\'s own documentation states encapsulation applies to siblings, not just ancestors.'
    },
    {
      thought: 'A decorator added inside any plugin becomes generally available to the whole application once that plugin has finished registering, similar to a global variable.',
      reality: 'This subtopic\'s exercise shows a plugin\'s decorators stay strictly scoped to that plugin and its own descendants by default — reaching a wider audience (siblings, the parent itself) requires explicitly wrapping the plugin with fastify-plugin to break its encapsulation.'
    },
    {
      thought: 'The fastify-plugin (fp) wrapper makes a plugin\'s decorators visible to ALL other plugins in the application, regardless of their position in the registration tree.',
      reality: 'This subtopic\'s theory shows fp() specifically promotes a decoration to the plugin\'s PARENT scope — it becomes visible to whatever inherits from that parent (siblings registered on the SAME parent, going forward), not to every plugin anywhere in the app unconditionally, especially not to plugins registered on a completely different branch of the tree.'
    }
  ];
}
