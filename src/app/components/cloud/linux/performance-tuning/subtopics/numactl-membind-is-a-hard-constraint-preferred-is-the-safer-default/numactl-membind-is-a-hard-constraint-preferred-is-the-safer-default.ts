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
  templateUrl: './numactl-membind-is-a-hard-constraint-preferred-is-the-safer-default.html',
  styleUrl: './numactl-membind-is-a-hard-constraint-preferred-is-the-safer-default.scss'
})
export class NumactlMembindIsAHardConstraintPreferredIsTheSaferDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents --membind as if it were simply "keep the process on one node," with no mention of what happens under pressure',
      points: [
        'The main page\'s own theory states: "numactl --membind=0 --cpunodebind=0 keeps a process on one NUMA node" — accurate as a description of the intended, happy-path behavior, but it never explains what happens if that ONE node runs low on memory, or that <code>numactl</code> has a completely different flag built specifically for that scenario.',
      ]
    },
    {
      heading: '--membind is a HARD constraint: allocation failure there does not fall back to other nodes',
      points: [
        '<code>--membind=N</code> restricts memory allocation to ONLY the specified node(s) — if that node runs low on available memory, the kernel does NOT automatically pull from a different, less-loaded node to satisfy the request, even if the system as a whole has plenty of free memory elsewhere.',
        'When a <code>--membind</code>-constrained process\'s bound node genuinely runs out of memory, the practical outcome is the process either fails to allocate (if the calling code checks the return value) or — in the more common, more dangerous case — the kernel\'s own OOM killer is invoked to free up memory ON THAT SPECIFIC NODE, which frequently means killing the very process that was pinned there in the first place, or an unrelated process that happened to also be running on that node, EVEN THOUGH other NUMA nodes on the same machine may have abundant free memory sitting completely unused.',
      ]
    },
    {
      heading: 'The safer alternative: --preferred, a soft hint rather than a hard wall',
      points: [
        '<code>numactl --preferred=N</code> expresses the SAME intent (prefer this node for locality/latency reasons) but as a soft policy — if node N cannot satisfy an allocation, the kernel transparently falls back to allocating from a different node instead of invoking the OOM killer or failing the allocation outright.',
        'This means <code>--preferred</code> trades a small amount of potential cross-node memory-access latency (only in the specific case where the preferred node was actually under pressure) for a categorically safer failure mode — the process keeps running instead of risking termination, which for most production workloads is the correct tradeoff to make by default.',
        'The main page\'s own example (<code>--membind=0 --cpunodebind=0</code>) remains the right choice specifically when the workload GENUINELY cannot tolerate any cross-node memory access at all and the operator has already confirmed the bound node has comfortable memory headroom for the workload\'s full lifetime — a narrower, more deliberate case than "pin a process to a NUMA node" implies on its own.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing an OOM-kill from a hard-bound node',
      language: 'bash',
      code: `# Following the main page's own example -- a hard bind to node 0:
numactl --membind=0 --cpunodebind=0 mydb

# Check available memory PER NODE (not just system-wide):
numactl --hardware
# node 0 cpus: 0 1 2 3
# node 0 size: 32000 MB
# node 0 free: 1200 MB       <-- node 0 is nearly exhausted...
# node 1 cpus: 4 5 6 7
# node 1 size: 32000 MB
# node 1 free: 28000 MB      <-- ...while node 1 has 28GB free

# mydb's own memory usage grows past what node 0 has left --
# --membind means node 1's 28GB of free memory is NEVER touched:
dmesg | tail -20
# Out of memory: Killed process 4821 (mydb) total-vm:...
# -- mydb is killed by the OOM killer, on a machine that, taken
#    as a whole, was nowhere near actually out of memory`,
    },
    {
      label: 'The fix: --preferred falls back instead of failing',
      language: 'bash',
      code: `# Same intent (favor node 0 for locality), but as a SOFT hint:
numactl --preferred=0 --cpunodebind=0 mydb

# Under the exact same memory pressure scenario as before:
numactl --hardware
# node 0 free: 1200 MB
# node 1 free: 28000 MB

# mydb's memory usage grows past node 0's remaining capacity --
# but this time, the kernel transparently falls back to node 1
# instead of invoking the OOM killer:
ps -o pid,comm,pmem -p $(pgrep mydb)
#   PID COMMAND         %MEM
#  4821 mydb            45.2      <-- still running, just now
#                                      partially using node 1's
#                                      memory instead of being
#                                      killed outright

# The tradeoff made explicit: some of mydb's memory accesses are
# now cross-node (slightly higher latency) for the portion that
# spilled over -- a real but usually far more acceptable cost
# than the process being terminated entirely.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own example, a team pins a memory-intensive service to NUMA node 0 with `numactl --membind=0 --cpunodebind=0 myservice` for latency reasons. Under a traffic spike, the service is unexpectedly killed by the OOM killer — even though `free -h` at the system level showed plenty of memory available at the time. Why did this happen despite the system-wide free memory, and what single flag change would have kept the service running (at a small potential latency cost) instead?',
    hint: 'Check whether the memory that free -h reports as "available system-wide" was actually reachable by this specific process, given how --membind restricts allocation.',
    solution: '`--membind=0` is a HARD constraint — it restricts myservice\'s memory allocation to ONLY NUMA node 0, and the kernel does not automatically fall back to other nodes if node 0 runs low, even though `free -h` (a system-wide view) showed plenty of memory available overall on OTHER nodes. When node 0 specifically became exhausted during the traffic spike, the kernel\'s OOM killer was invoked to free memory on that node, and myservice (the process actually using that memory) was the casualty — despite the system as a whole being nowhere near genuinely out of memory. The fix is switching from `--membind=0` to `--preferred=0` (keeping `--cpunodebind=0` unchanged) — `--preferred` expresses the same node-0 locality preference as a soft hint rather than a hard wall, so when node 0 runs low, the kernel transparently falls back to allocating from another node instead of invoking the OOM killer, keeping the service running at the cost of slightly higher latency for the portion of memory that spilled over to the other node.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'numactl --membind=N simply expresses a preference for NUMA node N, similar to a hint the kernel will honor when convenient and fall back from when needed.',
      reality: 'Per this subtopic\'s theory, --membind is a HARD constraint — memory allocation is restricted to only the specified node(s), with no automatic fallback to other nodes even if they have abundant free memory, unlike --preferred which is a genuine soft hint.'
    },
    {
      thought: 'If a NUMA-bound process is killed by the OOM killer, the system as a whole must have genuinely run out of memory.',
      reality: 'Per this subtopic\'s theory, a process bound with --membind can be OOM-killed purely because its OWN bound node ran low, even while other NUMA nodes on the same machine have plentiful free memory sitting completely unused — system-wide free memory figures (like free -h) can be misleading for a hard-bound process.'
    },
    {
      thought: '--membind and --preferred achieve the same practical outcome, just with slightly different syntax.',
      reality: 'Per this subtopic\'s theory, they have meaningfully different failure modes under memory pressure — --membind risks OOM-killing the process (or failing the allocation) when its bound node is exhausted, while --preferred gracefully falls back to another node instead, a categorically safer default for most production workloads.'
    }
  ];
}
