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
  templateUrl: './usr-local-vs-opt-shared-tree-vs-one-subdirectory-per-app.html',
  styleUrl: './usr-local-vs-opt-shared-tree-vs-one-subdirectory-per-app.scss'
})
export class UsrLocalVsOptSharedTreeVsOneSubdirectoryPerAppSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions both directories, but never side by side',
      points: [
        'The main page\'s own quick reference lists /opt separately: "Optional/third-party software installed outside the package manager." Its Common Mistakes section covers /usr/local separately too: "/usr/local is for manually compiled software, not packages... Package manager files go under /usr. Mixing them causes conflicts."',
        'Both descriptions are accurate, but neither one explains what actually makes these two directories different from each other, when both are described as homes for software that lives outside the normal package-manager-installed /usr tree. A reader could reasonably come away thinking they\'re just two interchangeable conventions for "extra software," rather than two structurally different approaches.',
      ]
    },
    {
      heading: 'Confirmed via the FHS itself: a shared tree vs. one self-contained subdirectory per application',
      points: [
        'Per the Filesystem Hierarchy Standard, /usr/local is meant to mirror /usr\'s own internal structure: "the hierarchy under /usr/local should mimic the hierarchy under /usr" — meaning locally-compiled software\'s binaries go into a SHARED /usr/local/bin, its libraries into a SHARED /usr/local/lib, right alongside every other piece of software also installed under /usr/local. It\'s organized by FILE TYPE, not by application.',
        'Per the same standard, /opt takes the opposite approach: "the /opt directory grants each piece of software its own subdirectory, and it organizes its files underneath how it pleases" — a self-contained structure. Application "example" gets /opt/example/, with its OWN bin/, lib/, etc/ underneath that one directory, never mixed into a shared tree with any other application\'s files. It\'s organized by APPLICATION, not by file type.',
        'The FHS states the intended purpose of each directly: /usr/local is "for use by the system administrator when installing software locally" (typically compiled from source), while /opt is "reserved for the installation of add-on application software packages" — pre-built, self-contained, often vendor-distributed software, not source builds an administrator compiles themselves.',
      ]
    },
    {
      heading: 'Why the structural difference matters practically',
      points: [
        'Because /opt gives each application its own isolated subdirectory, uninstalling something cleanly installed there is, in principle, as simple as deleting that one directory — "you could uninstall software in /opt just by removing that software\'s directory," per the same FHS-based analysis. Nothing else on the system references files scattered across a shared tree that need to be individually tracked down.',
        '/usr/local offers no equivalent guarantee — because its files are merged into shared bin/lib/etc/ directories alongside every other locally-installed piece of software, removing one program cleanly requires knowing exactly which files under /usr/local/bin, /usr/local/lib, and elsewhere belong to it specifically, which is exactly the kind of bookkeeping tools like make uninstall or checkinstall exist to solve for source-compiled software.',
        'This is also why self-contained vendor software (a commercial application, a large third-party tool shipped as a single tarball) conventionally lands in /opt rather than /usr/local — the vendor\'s own internal directory layout (their own bin/, lib/, config/ files, however they\'re organized inside) can be dropped in as one unit without needing to be manually merged into /usr/local\'s shared structure at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same "extra software" need, two different structural results',
      language: 'bash',
      code: `# /usr/local: software compiled from source, merged into a SHARED
# tree matching /usr's own layout -- per FHS, "the hierarchy under
# /usr/local should mimic the hierarchy under /usr":

./configure --prefix=/usr/local
make && sudo make install

# Result -- files land ALONGSIDE every other /usr/local install:
ls /usr/local/bin/     # mytool  another-tool  yet-another-binary
ls /usr/local/lib/     # libmytool.so  libanother.so  ...
# No single directory represents "just mytool" -- its files are
# scattered across the shared bin/lib/share/ tree by FILE TYPE.

# /opt: each application gets its OWN self-contained subdirectory,
# per FHS, organizing "its files underneath how it pleases":

# A vendor's self-contained distribution, unpacked as-is:
sudo tar -xzf vendor-app-3.2.tar.gz -C /opt/
ls /opt/vendor-app/
# bin/  lib/  etc/  README.md   <- vendor's OWN internal layout,
#                                   entirely self-contained

# Uninstalling: in principle, a single command --
sudo rm -rf /opt/vendor-app
# -- nothing else on the system had files scattered elsewhere for
#    this application to begin with.`,
    },
    {
      label: 'Why removing a /usr/local install is genuinely harder',
      language: 'bash',
      code: `# Removing the SAME piece of software from /usr/local isn't a
# single "delete this folder" operation, because its files were
# merged into shared directories alongside everything else:

# Naive attempt -- WRONG, this deletes ALL locally-installed
# software's binaries and libraries, not just one app's:
# sudo rm -rf /usr/local/bin /usr/local/lib   <-- DO NOT DO THIS

# The actual correct approaches all exist specifically to solve
# this shared-tree bookkeeping problem:

# Option 1 -- if the source tree used for 'make install' still
# exists, many Makefiles support the inverse operation:
cd /path/to/original/source/tree
sudo make uninstall
# (only works if the Makefile author defined an uninstall target --
#  not guaranteed, and the ORIGINAL source tree must still exist)

# Option 2 -- checkinstall wraps 'make install' to produce a real
# package (.deb/.rpm) FIRST, so the package manager can track and
# cleanly remove every file it touched:
sudo checkinstall
# sudo apt remove mytool     # now a normal, trackable removal

# Neither workaround is needed for /opt -- its self-contained
# per-application structure sidesteps this problem by design.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A system administrator compiles a monitoring agent from source and installs it with ./configure --prefix=/usr/local && make install. Six months later, they need to remove it entirely, but the original source tree has since been deleted, and there\'s no package manager record of it (since it was never packaged). Why is this removal genuinely harder than if the same software had instead been installed as a self-contained tarball under /opt, and what would make it easier in the future?',
    hint: 'Check what /usr/local\'s own FHS-defined structure does with a locally-compiled application\'s files — are they kept together in one place, or merged into shared directories alongside other software?',
    solution: 'The difficulty is structural, not accidental — per the FHS, /usr/local is explicitly meant to mirror /usr\'s own layout, meaning the monitoring agent\'s binaries were merged into the SHARED /usr/local/bin, its libraries into the SHARED /usr/local/lib, alongside whatever else has ever been installed there. With the original source tree gone (so make uninstall isn\'t available) and no package manager record (so apt/dnf remove isn\'t available either), there is no reliable, tracked list of exactly which files under those shared directories belong to this specific agent versus anything else installed the same way — removing it cleanly now requires manually identifying every file it touched, which is genuinely tedious and risks accidentally deleting files belonging to a different program installed the same way. Had it instead been installed under /opt as a self-contained subdirectory (/opt/monitoring-agent/ with its own bin/lib inside), removal would be as simple as deleting that one directory, per the FHS\'s own self-contained design for /opt. Going forward, either wrapping future source-compiled installs with a tool like checkinstall (to produce a real, trackable package) or preferring /opt for anything installed as a pre-built, self-contained unit would avoid this exact problem recurring.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '/usr/local and /opt are two interchangeable conventions for "extra software not managed by the package manager" — which one you use is mostly a matter of preference.',
      reality: 'Per this subtopic\'s theory, the FHS defines a real structural difference between them — /usr/local mirrors /usr\'s own shared bin/lib/etc layout, merging every locally-installed program\'s files together, while /opt gives each application its own self-contained subdirectory that never mixes with any other program\'s files.'
    },
    {
      thought: 'Removing software installed under /usr/local is just as simple as deleting one directory, the same way removing something from /opt is.',
      reality: 'Per this subtopic\'s theory, because /usr/local merges every installed program\'s files into shared directories, there is no single folder representing just one application — clean removal typically requires make uninstall, a packaging tool like checkinstall, or careful manual bookkeeping, none of which /opt\'s self-contained structure requires.'
    },
    {
      thought: '/opt is specifically for software compiled from source by a system administrator, the same use case the main page describes for /usr/local.',
      reality: 'Per this subtopic\'s theory, the FHS defines /opt for pre-built "add-on application software packages" — typically vendor-distributed, self-contained software — while /usr/local is explicitly defined for the system administrator\'s own locally-compiled software, a distinct use case from what /opt is meant for.'
    }
  ];
}
