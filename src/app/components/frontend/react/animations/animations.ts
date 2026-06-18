import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-react-animations',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './animations.html',
  styleUrl: './animations.scss',
})
export class ReactAnimations {
  quickRef: QuickRefItem[] = [
    { name: 'motion.div',            type: 'syntax',   desc: 'Animatable version of a div. Accepts animate, initial, exit, variants, whileHover, whileTap props.' },
    { name: 'animate',               type: 'keyword',  desc: 'Target state to animate to. Can be an object, a variant name string, or an array of keyframes.' },
    { name: 'initial',               type: 'keyword',  desc: 'Starting state before mount animation. false disables the initial animation (useful for SSR/SSG).' },
    { name: 'exit',                  type: 'keyword',  desc: 'State to animate to when the component is removed from the DOM. Requires <AnimatePresence> wrapper.' },
    { name: 'variants',              type: 'keyword',  desc: 'Named animation states. Parent propagates variant name to children — enables staggered orchestration.' },
    { name: '<AnimatePresence>',     type: 'syntax',   desc: 'Enables exit animations. Wrap conditional renders or list items. mode="wait" sequences enter/exit.' },
    { name: 'useAnimation()',        type: 'hook',     desc: 'Imperative animation controls. call controls.start(target) and controls.stop() programmatically.' },
    { name: 'useMotionValue()',      type: 'hook',     desc: 'A value that drives animations without triggering React re-renders. Used for gesture/scroll tracking.' },
    { name: 'useSpring()',           type: 'hook',     desc: 'Wraps a motion value with spring physics. Smooth, springy interpolation between values.' },
    { name: 'layout',                type: 'keyword',  desc: 'Animates layout changes (size, position shifts) automatically when the component re-renders.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Framer Motion fundamentals — declarative animation',
      points: [
        '<strong>motion components</strong>: replace any HTML element with its motion.* counterpart (motion.div, motion.button, motion.svg). These accept animation props alongside regular HTML props.',
        '<strong>animate</strong> is the current target state. When it changes, Framer Motion automatically interpolates from the current state to the new one. You do not write the interpolation — you just declare where you want to end up.',
        '<strong>initial</strong> is the starting state. Set it to false to skip the mount animation (important for SSR pages where content should appear immediately). Omit it to start from the animate state with no animation.',
        '<strong>transition</strong> controls how the animation runs: <code>{ type: "spring", stiffness: 300, damping: 20 }</code> or <code>{ type: "tween", duration: 0.3, ease: "easeOut" }</code>. Defaults to spring for transform properties.',
      ],
    },
    {
      heading: 'Variants — orchestrated animations',
      points: [
        '<strong>variants</strong> are named animation states defined as an object. Pass variant names as strings to animate/initial/exit: <code>animate="visible"</code>. This decouples the animation definition from the component structure.',
        '<strong>Parent-to-child propagation</strong>: when a parent has variants and you change the parent\'s animate prop, Framer Motion automatically propagates the same variant name to all children that also have variants defined. You do not need to manually set animate on every child.',
        '<strong>staggerChildren</strong>: add to a parent\'s transition: <code>transition: { staggerChildren: 0.1 }</code>. Each child in the parent will start its animation 100ms after the previous one — creates list cascade effects without any manual delay calculations.',
        '<strong>delayChildren</strong>: add a fixed delay before the first child starts, in addition to staggerChildren. Useful for waiting for a container reveal animation to finish before the children begin.',
      ],
    },
    {
      heading: 'AnimatePresence — exit animations',
      points: [
        '<strong>AnimatePresence</strong> enables exit animations for components removed from the DOM. Wrap any conditional render or list: <code>&lt;AnimatePresence&gt;{isVisible && &lt;motion.div exit={{ opacity: 0 }}&gt;}&lt;/AnimatePresence&gt;</code>.',
        '<strong>mode="wait"</strong>: the outgoing component finishes its exit animation before the incoming component mounts. Default is "sync" (both animate simultaneously). Use "wait" for page transitions where you want clean sequential in/out.',
        '<strong>key prop</strong> is essential in AnimatePresence lists. Each item needs a unique stable key — when the key changes, AnimatePresence treats it as a removed + newly added component and plays both exit and entry animations.',
        '<strong>Custom exit</strong>: AnimatePresence also enables animated route transitions when used with React Router. Wrap <code>&lt;Outlet&gt;</code> in AnimatePresence and use the route location as the key on the motion wrapper.',
      ],
    },
    {
      heading: 'Gesture animations',
      points: [
        '<strong>whileHover</strong> and <strong>whileTap</strong> are shorthand gesture props: <code>whileHover={{ scale: 1.05 }}</code> animates when the pointer hovers, <code>whileTap={{ scale: 0.95 }}</code> when pressed. Framer Motion handles the enter/leave transitions automatically.',
        '<strong>whileDrag</strong>: enables drag behaviour. Combine with <code>drag="x"</code> (axis-constrained) or <code>drag={true}</code> (free). <code>dragConstraints={{ left: -100, right: 100 }}</code> limits the drag range.',
        '<strong>whileInView</strong>: animates when the element scrolls into view. Replaces IntersectionObserver boilerplate: <code>&lt;motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}&gt;</code>.',
        '<strong>viewport={{ once: true }}</strong>: the whileInView animation fires only on the first scroll-into-view. Without it, the animation reverses when the element scrolls out and repeats on every re-entry.',
      ],
    },
    {
      heading: 'Layout animations and useMotionValue',
      points: [
        '<strong>layout</strong> prop: add it to a motion component and Framer Motion will animate any layout change caused by a re-render — position shifts, size changes, reordering in a list. It uses FLIP (First, Last, Invert, Play) internally.',
        '<strong>layoutId</strong>: shared layout animations across components. Two motion elements with the same layoutId will animate between each other when one mounts and the other unmounts — perfect for selected-item "hero" transitions.',
        '<strong>useMotionValue()</strong>: creates a value that changes without causing React re-renders. Connect it to a motion element via <code>style={{ x: motionValue }}</code>. Use it for tracking scroll position, cursor, or gesture output.',
        '<strong>useSpring()</strong>: wraps a MotionValue with spring physics. Changes snap to the target with spring interpolation. <code>const springX = useSpring(rawX, { stiffness: 400, damping: 30 })</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic animate + variants',
      language: 'typescript',
      code: `import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// ──── 1. Simple animate prop ──────────────────────────────────
function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ──── 2. Variants for orchestration ──────────────────────────
const listVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

function StaggeredList({ items }: { items: string[] }) {
  return (
    <motion.ul variants={listVariants} initial="hidden" animate="visible">
      {items.map(item => (
        <motion.li key={item} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
  // Parent sets initial/animate — children inherit the variant name automatically
}

// ──── 3. AnimatePresence for exit animations ──────────────────
function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            exit={{    scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
          >
            <p>Modal content</p>
            <button onClick={onClose}>Close</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}`,
    },
    {
      label: 'Gestures + whileInView',
      language: 'typescript',
      code: `import { motion } from 'framer-motion';

// ──── whileHover + whileTap ──────────────────────────────────
function AnimatedButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, backgroundColor: '#0284c7' }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      style={{ backgroundColor: '#0ea5e9', color: '#fff', padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer' }}
    >
      {children}
    </motion.button>
  );
}

// ──── Draggable card ──────────────────────────────────────────
function DraggableCard() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -150, right: 150, top: -50, bottom: 50 }}
      dragElastic={0.2}    // how much the element can go past the constraint before snapping back
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      style={{ width: 120, height: 80, background: '#f0f9ff', borderRadius: 12,
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               cursor: 'grab', userSelect: 'none' }}
    >
      Drag me
    </motion.div>
  );
}

// ──── Scroll-triggered reveal (replaces IntersectionObserver) ─
function RevealSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}   // trigger 100px before entering viewport
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <h2>{title}</h2>
      {children}
    </motion.section>
  );
}

// ──── Animated accordion ──────────────────────────────────────
function Accordion({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <motion.button
        onClick={() => setOpen(!open)}
        animate={{ rotate: open ? 180 : 0 }}     // rotate chevron inline
        style={{ fontSize: 14 }}
      >
        {title} ▾
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{    height: 0,      opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ padding: '8px 0' }}>{content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}`,
    },
    {
      label: 'Layout animations + layoutId',
      language: 'typescript',
      code: `import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useState } from 'react';

// ──── layout prop: animate reordering automatically ──────────
const ITEMS = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

function SortableList() {
  const [items, setItems] = useState(ITEMS);

  function moveToTop(item: string) {
    setItems(prev => [item, ...prev.filter(i => i !== item)]);
  }

  return (
    <LayoutGroup>
      <ul style={{ padding: 0, listStyle: 'none' }}>
        {items.map(item => (
          <motion.li
            key={item}
            layout             // ← Framer Motion FLIP-animates position changes
            onClick={() => moveToTop(item)}
            style={{ padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, marginBottom: 6, cursor: 'pointer' }}
            whileHover={{ backgroundColor: '#e0f2fe' }}
          >
            {item}
          </motion.li>
        ))}
      </ul>
    </LayoutGroup>
  );
}

// ──── layoutId: shared element transitions ───────────────────
const CARDS = [
  { id: 'card-1', title: 'Design',      emoji: '🎨' },
  { id: 'card-2', title: 'Development', emoji: '💻' },
  { id: 'card-3', title: 'Deployment',  emoji: '🚀' },
];

function ExpandableCards() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <div style={{ display: 'flex', gap: 12 }}>
        {CARDS.map(card => (
          <motion.div
            key={card.id}
            layoutId={card.id}         // ← matches the expanded card below
            onClick={() => setSelected(card.id)}
            style={{ width: 80, height: 80, background: '#0ea5e9', borderRadius: 12,
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     cursor: 'pointer', fontSize: 28 }}
          >
            {card.emoji}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 10 }}
            />
            {/* Expanded card — same layoutId morphs from thumbnail */}
            <motion.div
              layoutId={selected}
              style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
                       width: 300, height: 200, background: '#0ea5e9', borderRadius: 20,
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       zIndex: 11, fontSize: 48 }}
            >
              {CARDS.find(c => c.id === selected)?.emoji}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}`,
    },
    {
      label: 'useMotionValue + useSpring',
      language: 'typescript',
      code: `import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

// ──── Parallax tilt card ─────────────────────────────────────
function TiltCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX  = useMotionValue(0);
  const mouseY  = useMotionValue(0);

  // Apply spring physics to mouse position
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]),  { stiffness: 400, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]),  { stiffness: 400, damping: 30 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width  - 0.5);
    mouseY.set((e.clientY - top)  / height - 0.5);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX, rotateY,
        transformPerspective: 800,
        width: 200, height: 140, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
        borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, cursor: 'default', transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  );
}

// ──── Scroll progress bar ─────────────────────────────────────
import { useScroll, useTransform as useT } from 'framer-motion';

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();   // 0 to 1 as user scrolls the page
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{
        scaleX,                       // transform: scaleX(0) to scaleX(1)
        transformOrigin: '0%',        // grows from left
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 4, background: '#0ea5e9', zIndex: 100,
      }}
    />
  );
}

// ──── Keyframe animation (array syntax) ──────────────────────
function PulseIcon() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],     // keyframes as array — loops through values
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{ width: 24, height: 24, borderRadius: '50%', background: '#0ea5e9' }}
    />
  );
}`,
    },
    {
      label: 'Page transitions',
      language: 'typescript',
      code: `import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';

// ──── Page transition variants ────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in:      { opacity: 1, x: 0    },
  out:     { opacity: 0, x: 20   },
};
const pageTransition = { type: 'tween', ease: 'easeInOut', duration: 0.3 };

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

// ──── Router integration ──────────────────────────────────────
function App() {
  const location = useLocation();

  return (
    // mode="wait" ensures the exiting page finishes before the new one enters
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <AnimatedPage><HomePage /></AnimatedPage>
        } />
        <Route path="/about" element={
          <AnimatedPage><AboutPage /></AnimatedPage>
        } />
        <Route path="/contact" element={
          <AnimatedPage><ContactPage /></AnimatedPage>
        } />
      </Routes>
    </AnimatePresence>
  );
}

// ──── Tab switcher with AnimatePresence mode="wait" ───────────
const tabs = ['Overview', 'Details', 'Reviews'];

function TabContent({ activeTab }: { activeTab: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}   // key change triggers exit/enter cycle
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0  }}
        exit={{   opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <p>Content for: {activeTab}</p>
      </motion.div>
    </AnimatePresence>
  );
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting AnimatePresence for exit animations',
      wrong: `// exit prop has no effect without AnimatePresence — component is removed instantly
function Toast({ message, show }: { message: string; show: boolean }) {
  return show ? (
    <motion.div exit={{ opacity: 0, y: -20 }}>
      {message}
    </motion.div>
  ) : null;
}`,
      right: `function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y: -20 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}`,
      explanation: 'The exit prop only works when the motion component is a direct or indirect child of <AnimatePresence>. Without it, React removes the element from the DOM immediately and exit animations never play.',
    },
    {
      title: 'Missing key on AnimatePresence children for list animations',
      wrong: `// Same key on all items — AnimatePresence cannot detect which item was removed
<AnimatePresence>
  {items.map(item => (
    <motion.li exit={{ opacity: 0 }}>{item.name}</motion.li>  // no key!
  ))}
</AnimatePresence>`,
      right: `<AnimatePresence>
  {items.map(item => (
    <motion.li
      key={item.id}          // unique stable key — required for AnimatePresence
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{    opacity: 0, height: 0 }}
    >
      {item.name}
    </motion.li>
  ))}
</AnimatePresence>`,
      explanation: 'AnimatePresence tracks which children are removed by their key. Without keys, it cannot detect removals and exit animations never play. Always provide unique stable keys on animated list items inside AnimatePresence.',
    },
    {
      title: 'Animating non-transform/opacity properties (causes layout thrashing)',
      wrong: `// Animating width, height, margin, padding = layout recalculation every frame
<motion.div animate={{ width: isOpen ? 300 : 0, padding: isOpen ? 16 : 0 }}>
  Content
</motion.div>`,
      right: `// Prefer transform + opacity — GPU-composited, no layout cost
<motion.div
  animate={{ scaleX: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
  style={{ transformOrigin: 'left', width: 300, padding: 16 }}
>
  Content
</motion.div>
// Or use the layout prop for genuinely size-changing content
<motion.div layout style={{ overflow: 'hidden' }}>
  {isOpen && <Content />}
</motion.div>`,
      explanation: 'Animating CSS layout properties (width, height, top, left, margin, padding) triggers layout recalculation and paint on every frame — this can cause jank at 60fps. Animate transform (scale, x, y, rotate) and opacity instead — they run on the GPU compositor thread with zero layout cost.',
    },
    {
      title: 'Not using initial={false} for SSR/SSG pages',
      wrong: `// Server renders with initial={{ opacity: 0 }} — flash of invisible content on hydration
function Hero() {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      Above the fold content
    </motion.section>
  );
}`,
      right: `// initial={false} disables the entry animation — content renders at full opacity immediately
// Then subsequent state-driven animations still work
function Hero() {
  return (
    <motion.section initial={false} animate={{ opacity: 1 }}>
      Above the fold content
    </motion.section>
  );
}`,
      explanation: 'In SSR/SSG apps, the server renders the initial state. If initial={{ opacity: 0 }}, the server sends invisible content and there is a flash before JavaScript runs and animates it in. Setting initial={false} tells Framer Motion to skip the entry animation and start at the animate state.',
    },
    {
      title: 'Creating motion values inside render (bypasses Framer Motion optimisations)',
      wrong: `// Bad — new MotionValue created on every render, animations restart
function Ticker({ value }: { value: number }) {
  const x = useMotionValue(value);   // reinitialised each render
  return <motion.div style={{ x }}>{value}</motion.div>;
}`,
      right: `// Good — useMotionValue is called once; update via set() when value changes
function Ticker({ value }: { value: number }) {
  const x = useMotionValue(0);
  useEffect(() => { x.set(value); }, [value, x]);
  return <motion.div style={{ x }}>{value}</motion.div>;
}`,
      explanation: 'useMotionValue() should be called unconditionally at the top of a component — the same as all other hooks. Creating it inside a conditional or passing different initial values on re-renders creates a new MotionValue each time, restarting animations and losing continuity.',
    },
    {
      title: 'Using AnimatePresence mode="wait" when you want parallel animations',
      wrong: `// mode="wait" makes each page fully exit before the next enters — adds unnecessary latency
<AnimatePresence mode="wait">
  <motion.div key={currentTab} exit={{ opacity: 0 }}>...</motion.div>
</AnimatePresence>`,
      right: `// Default "sync" mode runs exit and enter simultaneously — snappier UX for most cases
<AnimatePresence>
  <motion.div
    key={currentTab}
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    {content[currentTab]}
  </motion.div>
</AnimatePresence>
// Use mode="wait" only when simultaneous animations look visually broken (full page transitions)`,
      explanation: 'mode="wait" makes every transition sequential — old out, then new in. This doubles the transition time (exit + enter). The default "sync" mode is almost always the right choice for in-place content swaps. Only use "wait" for full-page route transitions where simultaneous content looks confusing.',
    },
  ];

  challenge: Challenge = {
    title: 'Build an Animated Notification Stack',
    language: 'typescript',
    description: `Build an animated notification/toast system using Framer Motion:

1. A button that adds a new notification (with a random message from a list)
2. Notifications appear at the top-right with a slide-in animation (from x: 50, opacity: 0)
3. Each notification auto-dismisses after 3 seconds
4. Manual dismiss button (×) on each notification
5. Exit animation: slide out to the right (x: 100, opacity: 0)
6. Stagger: new notifications slide in below existing ones with layout animation`,
    hints: [
      'State: const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([])',
      'Use AnimatePresence with a unique key={n.id} on each motion.div',
      'Add layout prop to each notification for smooth reordering when one is dismissed',
      'Auto-dismiss: useEffect inside each Notification component that calls dismiss after 3000ms',
    ],
    starterCode: `import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const MESSAGES = [
  'File uploaded successfully',
  'Changes saved',
  'New message received',
  'Build completed',
  'Deployment succeeded',
];

interface Notification { id: number; message: string; }

function NotificationItem({ notification, onDismiss }: {
  notification: Notification;
  onDismiss: (id: number) => void;
}) {
  // TODO: auto-dismiss after 3 seconds
  return (
    <motion.div
      // TODO: add initial, animate, exit, layout props
      style={{ background: '#0ea5e9', color: '#fff', padding: '12px 16px', borderRadius: 8,
               display: 'flex', alignItems: 'center', gap: 8, minWidth: 240 }}
    >
      <span style={{ flex: 1 }}>{notification.message}</span>
      <button onClick={() => onDismiss(notification.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
    </motion.div>
  );
}

export default function NotificationStack() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  let nextId = 0;

  function addNotification() {
    const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    // TODO: add new notification
  }

  function dismiss(id: number) {
    // TODO: remove notification by id
  }

  return (
    <div style={{ padding: 24 }}>
      <button onClick={addNotification}>Add Notification</button>
      {/* TODO: notification stack with AnimatePresence */}
    </div>
  );
}`,
    solution: `import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

const MESSAGES = [
  'File uploaded successfully', 'Changes saved', 'New message received',
  'Build completed', 'Deployment succeeded',
];

interface Notification { id: number; message: string; }

function NotificationItem({ notification, onDismiss }: {
  notification: Notification;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 3000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0,  scale: 1   }}
      exit={{    opacity: 0, x: 100             }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ background: '#0ea5e9', color: '#fff', padding: '12px 16px', borderRadius: 8,
               display: 'flex', alignItems: 'center', gap: 8, minWidth: 240, marginBottom: 8 }}
    >
      <span style={{ flex: 1 }}>{notification.message}</span>
      <button onClick={() => onDismiss(notification.id)}
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
    </motion.div>
  );
}

export default function NotificationStack() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) =>
    setNotifications(prev => prev.filter(n => n.id !== id)), []);

  function addNotification() {
    const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    setNotifications(prev => [...prev, { id: nextId.current++, message }]);
  }

  return (
    <div style={{ padding: 24 }}>
      <button onClick={addNotification}
        style={{ padding: '8px 16px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Add Notification
      </button>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <AnimatePresence>
          {notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does the animate prop do on a motion component?',
      options: ['It starts a CSS animation class on the element', 'It declares the target state — Framer Motion automatically interpolates from the current state to this target whenever the prop value changes', 'It triggers a JavaScript requestAnimationFrame loop', 'It adds a CSS transition property to the element'],
      answer: 1,
      explanation: 'animate is a declarative target — when its value changes, Framer Motion smoothly interpolates from the current values to the new ones. You do not write the interpolation; you just describe where you want to end up. The library handles timing, easing, and spring physics.',
    },
    {
      q: 'Why is AnimatePresence required for exit animations?',
      options: ['It provides a cleanup function for animation timers', 'React removes elements from the DOM immediately on unmount. AnimatePresence intercepts this removal, plays the exit animation first, then removes the element after the animation completes', 'It registers a global event listener for component unmounts', 'It defers the React rendering cycle until animations finish'],
      answer: 1,
      explanation: 'React\'s default behaviour is to remove elements from the DOM synchronously when they are conditionally rendered out. AnimatePresence wraps children and delays the actual DOM removal until after the exit animation finishes — Framer Motion cannot play animations on elements that are already gone.',
    },
    {
      q: 'What does mode="wait" do in AnimatePresence?',
      options: ['It pauses all animations until the user interacts with the page', 'The exiting component completes its exit animation before the entering component mounts — prevents simultaneous in/out', 'It queues animations in the order they were triggered', 'It waits for all sibling elements to finish animating before starting'],
      answer: 1,
      explanation: 'mode="wait" is a sequential mode — old component exits fully, then new component enters. The default "sync" runs both simultaneously. Use "wait" for full-page route transitions where overlapping in/out content looks disorienting. "sync" is better for most in-place content swaps.',
    },
    {
      q: 'What are variants in Framer Motion?',
      options: ['CSS class variants generated by Tailwind', 'Named animation states defined as an object — when a parent changes its variant name, all children with matching variants inherit the change automatically', 'Multiple animation options the user can choose from', 'A/B test variants for different animation styles'],
      answer: 1,
      explanation: 'Variants are objects mapping state names to animation targets: { hidden: { opacity: 0 }, visible: { opacity: 1 } }. Their power is propagation — when a parent\'s animate prop changes to "visible", all children with a "visible" variant automatically animate to their own "visible" state. staggerChildren in the parent\'s transition controls timing.',
    },
    {
      q: 'Why should you animate transform and opacity instead of layout properties like width?',
      options: ['Framer Motion only supports transform and opacity', 'Transform and opacity are GPU-composited — they do not cause layout recalculation or paint, so they run at 60fps without jank. Width/height animations force layout recalculation every frame', 'Width and height cannot be animated with Framer Motion', 'Transform animations are automatically hardware-accelerated by the OS'],
      answer: 1,
      explanation: 'CSS properties that affect layout (width, height, top, margin, padding) trigger layout recalculation and paint on every animation frame — expensive operations that can cause jank. transform and opacity run on the GPU compositor thread without touching layout, making them consistently smooth at 60fps.',
    },
    {
      q: 'What does the layout prop do on a motion component?',
      options: ['It makes the component use CSS Grid layout', 'It automatically animates any layout changes caused by a re-render — position shifts, size changes, and reordering — using the FLIP technique', 'It prevents the element from affecting surrounding layout', 'It adds position: relative to the element'],
      answer: 1,
      explanation: 'The layout prop enables FLIP animation (First-Last-Invert-Play). When a layout prop element re-renders and its position or size changes, Framer Motion measures the before and after positions, then plays a smooth animation between them. This handles reordering, list item removal, and container resizing automatically.',
    },
    {
      q: 'What is the difference between useMotionValue() and useState() for tracking a value?',
      options: ['useMotionValue is for numbers only; useState works with any type', 'useMotionValue changes do not trigger React re-renders — animations driven by motion values run outside React\'s render cycle, which is critical for performance in gesture/scroll tracking', 'useState is faster for animations because React batches updates', 'useMotionValue persists values across component unmounts'],
      answer: 1,
      explanation: 'useState triggers a re-render on every change — for gesture/scroll tracking at 60fps, this would cause React to re-render every frame. useMotionValue updates independently of React state — the value changes and style updates happen directly in the DOM without going through React\'s reconciliation cycle.',
    },
    {
      q: 'When should you use layoutId?',
      options: ['When you want to animate all components with the same CSS class', 'For shared element transitions — two motion components with the same layoutId will animate morphing between each other when one mounts and the other unmounts', 'To link a motion value between two components', 'For syncing animations between sibling components'],
      answer: 1,
      explanation: 'layoutId creates a shared element transition between two motion elements in different parts of the component tree. When one unmounts and another with the same layoutId mounts, Framer Motion animates the visual "morph" between their positions and sizes. Classic use cases: list item → expanded detail, thumbnail → hero image.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use Framer Motion or CSS animations?',
      a: 'Use CSS animations for simple, non-interactive animations (loading spinners, skeleton screens, hover effects). CSS is zero-bundle-cost. Use Framer Motion when you need gesture interaction, exit animations, shared layout transitions, spring physics, or orchestrated variants with stagger — these are either impossible or very verbose in CSS.',
    },
    {
      q: 'How do I prevent animations from playing on the initial page load?',
      a: 'Add initial={false} to your AnimatePresence: <AnimatePresence initial={false}>. This tells Framer Motion not to play mount animations for the initial render. Subsequent mount/unmount animations still work. Alternatively, set initial={false} on individual motion components to suppress their entry animation specifically.',
    },
    {
      q: 'Does Framer Motion work with React Server Components?',
      a: 'No — Framer Motion requires "use client". Motion components use browser APIs (requestAnimationFrame, ResizeObserver, pointer events) that are not available on the server. Mark any file using motion.* or AnimatePresence as a Client Component. Typically wrap the animated parts at the leaf level and keep the data-fetching parent as a Server Component.',
    },
    {
      q: 'What is the difference between transition type "spring" and "tween"?',
      a: '"spring" simulates physical spring physics — it can overshoot the target and oscillate before settling (controlled by stiffness and damping). It feels organic and is the default for transform properties. "tween" is a fixed-duration interpolation with an easing curve (easeOut, easeInOut, etc.) — predictable timing, no overshoot. Use springs for interactive gestures, tweens for UI fades and sequenced reveal animations.',
    },
    {
      q: 'How do I animate an element entering based on scroll position?',
      a: 'Use the whileInView prop: <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>. This replaces IntersectionObserver boilerplate entirely. viewport.once: true ensures the animation only plays once. viewport.margin lets you trigger earlier (margin: "-100px" fires 100px before the element enters the viewport).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Declarative motion.* components with animate/exit/variants — AnimatePresence for exit, layout for FLIP, layoutId for shared transitions.',
    mustKnow: [
      'motion.div animate={target}: Framer Motion interpolates from current → target on every change',
      'AnimatePresence: required for exit prop to work — wraps conditional renders and lists',
      'variants + staggerChildren: parent propagates variant name to children, stagger controls timing',
      'Animate transform/opacity only — layout properties (width, height) trigger expensive recalculations',
      'layout prop: FLIP-animates position/size changes automatically on re-render',
      'layoutId: shared element transition — morphs between two components with the same ID',
      'useMotionValue: drives animations without React re-renders; useSpring: adds spring physics to a MotionValue',
    ],
    interviewFocus: [
      'Why is AnimatePresence necessary for exit animations — what does React do on unmount by default?',
      'What is the FLIP technique and how does the layout prop use it?',
      'Why should you animate transform/opacity rather than layout properties?',
      'What is the difference between variants propagation and manually setting animate on each child?',
    ],
  };
}
