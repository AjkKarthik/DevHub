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
  templateUrl: './ip-forward-alone-is-not-enough-for-ufw-router-mode.html',
  styleUrl: './ip-forward-alone-is-not-enough-for-ufw-router-mode.scss'
})
export class IpForwardAloneIsNotEnoughForUfwRouterModeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents the sysctl one-liner as if it were the whole story',
      points: [
        'The main page\'s own Connection Tracking and NAT theory states only: "echo 1 > /proc/sys/net/ipv4/ip_forward required to enable packet forwarding (router mode)" — presented as the single, self-contained step needed for router/NAT functionality, right alongside a MASQUERADE example. It never mentions that this write is temporary, or that it interacts with whichever firewall frontend (UFW, in particular) is actually managing the system\'s rules.',
      ]
    },
    {
      heading: 'Gap #1: the raw proc-file write does not survive a reboot',
      points: [
        '<code>echo 1 > /proc/sys/net/ipv4/ip_forward</code> writes directly into the running kernel\'s in-memory setting — it takes effect immediately, but is never persisted to disk. On the next reboot, the kernel starts back up with forwarding disabled by default, and router/NAT functionality silently stops working with no error, no log entry, nothing to indicate why.',
        'Persisting it normally means adding <code>net.ipv4.ip_forward=1</code> to <code>/etc/sysctl.conf</code> or a file under <code>/etc/sysctl.d/</code>. But if the system uses UFW specifically, UFW ships its OWN dedicated location for exactly this setting — <code>/etc/ufw/sysctl.conf</code> — where the line <code>net/ipv4/ip_forward=1</code> already exists commented out, ready to be uncommented, then applied with <code>sudo ufw reload</code> rather than a generic sysctl reload.',
      ]
    },
    {
      heading: 'Gap #2: even with ip_forward=1 persisted correctly, UFW\'s own FORWARD chain can still block everything',
      points: [
        'This is the gap that causes the most confusing symptom in practice: an administrator follows a NAT tutorial exactly — enables ip_forward, adds the MASQUERADE rule from the main page\'s own example — and forwarding STILL doesn\'t work, with no obvious error anywhere.',
        'The missing piece is almost always UFW\'s own default FORWARD policy, configured separately in <code>/etc/default/ufw</code> as <code>DEFAULT_FORWARD_POLICY="DROP"</code> out of the box. Even though the KERNEL is now willing to forward packets (ip_forward=1) and NAT is correctly configured (MASQUERADE), UFW\'s own firewall rules still actively drop forwarded traffic at the FORWARD chain unless that default is changed to <code>DEFAULT_FORWARD_POLICY="ACCEPT"</code> (or specific forward rules are added) — followed by <code>sudo ufw reload</code> to apply it.',
        'The practical lesson: router/NAT setup on a UFW-managed system genuinely requires THREE separate, independent pieces to all be correct at once — the kernel\'s own forwarding capability (ip_forward), the NAT translation rule (MASQUERADE), and the firewall frontend\'s own policy for the FORWARD chain specifically — and the main page\'s single-line mention only covers the first of the three.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Persisting ip_forward correctly on a UFW-managed system',
      language: 'bash',
      code: `# The main page's own command -- works immediately, but only
# until the next reboot:
echo 1 > /proc/sys/net/ipv4/ip_forward

# Confirm it's live right now:
cat /proc/sys/net/ipv4/ip_forward
# 1

# ...but check whether it survived a REBOOT before trusting it:
# (on a fresh boot, without persisting it, this comes back as 0)

# The generic persistence path (works on any distro):
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# The UFW-specific path -- UFW ships its OWN dedicated file for
# exactly this setting, already present but commented out:
sudo nano /etc/ufw/sysctl.conf
# Find and uncomment:
#   net/ipv4/ip_forward=1
sudo ufw reload         # <-- applies via UFW's own reload, not sysctl -p`,
    },
    {
      label: 'Why forwarding can still fail even after ip_forward=1 -- UFW\'s own FORWARD policy',
      language: 'bash',
      code: `# Full setup following a typical NAT/router tutorial, including
# the main page's own MASQUERADE example:
sudo sysctl -w net.ipv4.ip_forward=1        # kernel: willing to forward
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE   # NAT configured

# ...and yet, on a UFW-managed system, forwarded traffic is STILL
# silently dropped. Check UFW's OWN default forward policy:
grep DEFAULT_FORWARD_POLICY /etc/default/ufw
# DEFAULT_FORWARD_POLICY="DROP"      <-- this is the actual culprit

# Fix: change UFW's own forward policy to ACCEPT
sudo sed -i 's/DEFAULT_FORWARD_POLICY="DROP"/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw
sudo ufw reload

# NOW all three pieces are actually in place together:
#   1. kernel:  ip_forward=1           (persisted via /etc/ufw/sysctl.conf)
#   2. NAT:     MASQUERADE rule        (translates outbound source IPs)
#   3. UFW:     DEFAULT_FORWARD_POLICY="ACCEPT"  (lets UFW's own
#               FORWARD chain actually pass the traffic through)
# Missing ANY one of the three reproduces the exact same symptom:
# "I followed the tutorial exactly and forwarding still doesn't work."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following a tutorial (including the main page\'s own example), an administrator sets up a Linux box as a NAT router: `sysctl -w net.ipv4.ip_forward=1` and the `iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE` rule from the main page. Internal client machines still cannot reach the internet through it. `cat /proc/sys/net/ipv4/ip_forward` confirms the value is 1. The system uses UFW. What is the most likely remaining cause, and what single value would you check first?',
    hint: 'The kernel is confirmed willing to forward (ip_forward=1) and NAT translation is configured (MASQUERADE) — think about what OTHER layer, specific to the firewall frontend actually managing this system\'s rules, could still be blocking forwarded packets independently of both of those.',
    solution: 'Since ip_forward is confirmed 1 (the kernel is willing to forward) and MASQUERADE is correctly configured (NAT translation is set up), the most likely remaining cause is UFW\'s own separate FORWARD chain policy, which defaults to DROP out of the box regardless of the kernel-level setting. The value to check first is `DEFAULT_FORWARD_POLICY` in `/etc/default/ufw` — if it still reads `"DROP"`, UFW\'s own firewall rules are actively dropping the forwarded traffic at the FORWARD chain even though the kernel and NAT layers are both correctly configured to allow it. The fix is changing it to `DEFAULT_FORWARD_POLICY="ACCEPT"` (or adding specific forward-allow rules) and running `sudo ufw reload` to apply it — router/NAT functionality on a UFW-managed system needs all three pieces (kernel ip_forward, NAT MASQUERADE, and UFW\'s own forward policy) correct simultaneously, and this is the piece most tutorials, including the main page\'s own brief mention, leave out.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '`echo 1 > /proc/sys/net/ipv4/ip_forward` is a complete, permanent way to enable router mode.',
      reality: 'Per this subtopic\'s theory, this writes only to the running kernel\'s in-memory state — it is lost on the next reboot unless separately persisted, either generically via /etc/sysctl.conf or, on a UFW system, via UFW\'s own dedicated /etc/ufw/sysctl.conf.'
    },
    {
      thought: 'Once ip_forward=1 and a MASQUERADE rule are both in place, packet forwarding will work on any Linux system.',
      reality: 'Per this subtopic\'s theory, a UFW-managed system has its own SEPARATE default policy for the FORWARD chain (DEFAULT_FORWARD_POLICY, DROP by default) — even with the kernel and NAT layers both correctly configured, UFW\'s own rules can still silently block all forwarded traffic until that policy is explicitly changed and ufw reload is run.'
    },
    {
      thought: 'If forwarded traffic isn\'t working, the problem must be in the kernel setting or the NAT rule itself.',
      reality: 'Per this subtopic\'s theory, when both of those are confirmed correct and forwarding still fails, the actual cause on a UFW system is very often a third, independent layer — UFW\'s own FORWARD chain policy — that isn\'t affected by fixing either of the other two.'
    }
  ];
}
