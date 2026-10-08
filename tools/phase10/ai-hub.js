module.exports = (topicSlug, topicLabel, subtopicsKey) => ({
  root: 'src/app/components/fundamentals/ai', routeImportBase: 'fundamentals/ai', hubRoutePath: 'ai',
  prefix: 'ai', icon: '🤖', selPrefix: 'ai', tech: 'javascript', since: 'AI/ML',
  topicSlug, topicLabel, topicRoute: '/ai/' + topicSlug, subtopicsKey: subtopicsKey || topicSlug,
  labelsMap: 'AI_LABELS', sidebarBase: 'ai', defaultConst: 'AI_DEFAULT',
  searchPrefix: 'ai-', searchSection: 'AI/ML', navFile: 'src/app/components/shared/ai-nav/ai-nav.ts',
  scss: `$accent: #7c3aed;
$tint:   #f5f3ff;

.ai-page { max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
.ai-icon { background: $tint; color: $accent; font-size: 1.8rem; }
.ai-section { margin: 2rem 0; }
.ai-section h2 { font-size: 1.2rem; font-weight: 700; color: $accent; margin-bottom: 1rem; }

:host-context(body.dark) {
  .ai-page { color: #e2e8f0; }
  .ai-icon { background: #1e1b4b; color: #a78bfa; }
  .ai-section h2 { color: #a78bfa; }
}
`,
});
