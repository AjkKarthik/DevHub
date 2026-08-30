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
  templateUrl: './registry-register-was-not-idempotent.html',
  styleUrl: './registry-register-was-not-idempotent.scss'
})
export class RegistryRegisterWasNotIdempotentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A registration method that only ever appends',
      points: [
        'The Challenge\'s reference solution for <code>InMemoryRegistry.register()</code> originally did: <code>this.store.set(instance.name, [...existing, instance])</code> — unconditionally appending the new instance to whatever was already stored, with no check for whether an instance with that same <code>id</code> was already registered.',
        'The problem: a real service instance re-registering with the SAME id — after a network blip, a Consul agent restart, or any reconnection that happens without a clean deregistration first — would silently create a SECOND entry with the identical id, sitting alongside the original.',
        'This directly undermines <code>setHealth(id, healthy)</code>, which uses <code>instances.find(i => i.id === id)</code> — it updates only the FIRST matching entry. The duplicate, stale entry is left untouched, meaning <code>getHealthy(name)</code> can return BOTH the updated and the stale duplicate for what is really one physical instance — an inflated, inaccurate count of healthy instances.',
      ]
    },
    {
      heading: 'Why this is a self-contained catch, and how the page\'s own fix reads',
      points: [
        'No external research was needed here — just tracing what happens when <code>register()</code> is called twice with the same <code>id</code>, and checking whether the OTHER methods in the same class (<code>setHealth</code>, <code>getHealthy</code>) still behave correctly afterward. They don\'t.',
        'The fix: filter out any existing entry with the same id BEFORE appending the new one — an upsert, not a blind append. This is exactly the same underlying discipline as this hub\'s own "consumer idempotency" theme covered elsewhere (Service Communication\'s Outbox Pattern subtopic) — a component that can legitimately receive the "same" input twice needs to handle that case explicitly, not assume it never happens.',
        'This page\'s own "Not implementing graceful deregistration" mistake block covers the DEREGISTRATION half of this same theme (what happens if a service disappears without cleaning up) — the register() bug is the REGISTRATION-side mirror image the page never covered: what happens if a service REAPPEARS without having cleanly disappeared first.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Append-only vs. upsert-by-id',
      language: 'typescript',
      code: `interface ServiceInstance { id: string; name: string; host: string; port: number; healthy: boolean; }

class InMemoryRegistry {
  private store = new Map<string, ServiceInstance[]>();

  // BEFORE -- unconditional append, no de-dup
  registerBroken(instance: ServiceInstance): void {
    const existing = this.store.get(instance.name) ?? [];
    this.store.set(instance.name, [...existing, instance]);
  }

  // AFTER -- upsert by id
  register(instance: ServiceInstance): void {
    const existing = this.store.get(instance.name) ?? [];
    const withoutDuplicate = existing.filter(i => i.id !== instance.id);
    this.store.set(instance.name, [...withoutDuplicate, instance]);
  }

  setHealth(id: string, healthy: boolean): void {
    for (const instances of this.store.values()) {
      const inst = instances.find(i => i.id === id); // only finds the FIRST match
      if (inst) { inst.healthy = healthy; return; }
    }
  }

  getHealthy(name: string): ServiceInstance[] {
    return (this.store.get(name) ?? []).filter(i => i.healthy);
  }
}

// Demonstrating the bug with the BROKEN version:
const reg = new InMemoryRegistry();
reg.registerBroken({ id: 'cat-1', name: 'catalog', host: '10.0.0.1', port: 8081, healthy: true });
reg.registerBroken({ id: 'cat-1', name: 'catalog', host: '10.0.0.5', port: 8081, healthy: true }); // reconnect, same id
reg.setHealth('cat-1', false); // updates only the FIRST 'cat-1' entry
console.log(reg.getHealthy('catalog').length); // 1 -- the stale duplicate is still "healthy"!`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Consul agent briefly loses connectivity to the Consul server and, on reconnecting, re-sends its service registration (same id, same name) as part of its normal reconciliation behavior. If the registry storing this used the ORIGINAL append-only register() from this page\'s Challenge, what would getHealthy() return for that service after the reconnect?',
    hint: 'Does append-only register() check whether an instance with the same id is already present before adding the new one?',
    solution: 'It would return TWO entries for what is really ONE physical service instance -- the original registration plus the reconnect\'s re-registration, both carrying the same id but now sitting as separate array entries. Any code counting healthy instances (for load balancing, or for a health dashboard) would see an inflated count, and a later setHealth(id, false) call meant to mark that instance down would only reach the FIRST of the two duplicate entries, leaving the second one incorrectly reporting healthy. This is exactly the failure mode the fixed, upsert-based register() prevents.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A service registering with the exact same id it already used is a scenario that would never actually happen in practice.',
      reality: 'Per this subtopic\'s theory, re-registration with the same id is a NORMAL, common occurrence — reconnection after a network blip, an agent restart, or any recovery flow that re-sends registration data without a preceding clean deregistration.'
    },
    {
      thought: 'This page\'s deregistration-focused mistake block ("Not implementing graceful deregistration") already covers the full lifecycle risk around stale registry entries.',
      reality: 'Per this subtopic\'s theory, that mistake covers what happens when a service DISAPPEARS without cleaning up — the register() bug is the mirror-image gap on the other side: what happens when a service REAPPEARS without having cleanly disappeared first.'
    },
    {
      thought: 'Since setHealth() and getHealthy() each work correctly in isolation, the overall InMemoryRegistry class must be correct.',
      reality: 'Per this subtopic\'s theory, each method\'s own logic was correct on its own — the bug only appears when tracing what happens to setHealth()\'s and getHealthy()\'s OUTPUT after register() has silently created a duplicate entry register() itself introduced.'
    }
  ];
}
