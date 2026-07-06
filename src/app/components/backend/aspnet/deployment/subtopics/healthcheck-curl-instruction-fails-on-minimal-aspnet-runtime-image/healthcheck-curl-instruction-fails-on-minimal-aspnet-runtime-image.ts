import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-healthcheck-curl-gotcha-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './healthcheck-curl-instruction-fails-on-minimal-aspnet-runtime-image.html',
  styleUrl: './healthcheck-curl-instruction-fails-on-minimal-aspnet-runtime-image.scss',
})
export class HealthcheckCurlInstructionFailsOnMinimalAspnetRuntimeImageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Multi-Stage Dockerfile writes HEALTHCHECK CMD curl -f http://localhost:8080/health/live || exit 1 against the mcr.microsoft.com/dotnet/aspnet runtime image — but that image does NOT include curl by default, since it is a minimal runtime image, not a full OS distribution with common CLI tools pre-installed',
      points: [
        'The <code>dotnet/aspnet</code> runtime image is deliberately minimal — it contains the ASP.NET Core runtime and its native dependencies, but NOT general-purpose utilities like <code>curl</code>, <code>wget</code>, or a text editor, precisely to keep the image small and reduce attack surface (fewer installed binaries means fewer potential vulnerabilities to patch). Writing a <code>HEALTHCHECK</code> instruction that shells out to <code>curl</code> assumes a tool that this specific base image was never designed to include.',
        'The failure mode is not a build-time error — the Dockerfile builds successfully, since <code>HEALTHCHECK</code> instructions are not executed during <code>docker build</code>, only at container RUNTIME. The problem only surfaces once the container is actually running: Docker executes the <code>CMD</code> on its configured interval, gets a "curl: command not found" (or equivalent shell error) EVERY time, and reports the container as <code>unhealthy</code> — even though the ASP.NET Core application itself is running perfectly fine and would happily respond to a real HTTP request on that same endpoint.',
      ],
    },
    {
      heading: 'The main page\'s own Non-Root User practice compounds the diagnosis difficulty — since the container runs as appuser rather than root, even attempting to manually apt-get install curl inside a running container for debugging requires switching back to root first, and the "obvious" fix of adding curl to the Dockerfile reintroduces the exact image-size and attack-surface trade-off multi-stage builds exist to avoid',
      points: [
        'Installing curl via <code>RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*</code> in the runtime stage DOES fix the HEALTHCHECK, but adds several megabytes and an additional package (with its own dependency chain and potential CVEs) to an image whose entire point — per the main page\'s own theory on multi-stage builds — was minimizing exactly that surface. This is a real, common trade-off many teams accept without realizing a curl-free alternative exists.',
        'The .NET runtime ITSELF is already present in the container and can make an HTTP call without any extra package — a tiny console app (or, more simply, a one-line inline C# script via <code>dotnet-script</code>, or simplest of all, a small compiled health-check executable copied into the image alongside the main app) hits the health endpoint using the SAME runtime already bundled in the image, adding zero additional OS packages.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the failure — the exact Dockerfile from the main page',
      language: 'csharp',
      code: `# Exactly the main page's own runtime stage:
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser
COPY --from=build /app/publish .

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD curl -f http://localhost:8080/health/live || exit 1

EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENTRYPOINT ["dotnet", "MyApi.dll"]

# docker build -t myapi:latest .     — SUCCEEDS. HEALTHCHECK is not
#                                       evaluated during build at all.

# docker run -d -p 8080:8080 myapi:latest
# docker ps
#   STATUS: Up 35 seconds (unhealthy)   <-- the app is actually fine!

# docker inspect --format='{{json .State.Health}}' <container_id>
#   "Log": [{ "ExitCode": 127,
#     "Output": "OCI runtime exec failed: exec failed:
#                 exec: \\"curl\\": executable file not found in $PATH" }]
# Exit code 127 = "command not found" — curl was never in this image.`,
    },
    {
      label: 'The fix — a tiny .NET-based health check needing zero extra OS packages',
      language: 'csharp',
      code: `// A minimal, separately-published console app — reuses the runtime
// ALREADY in the image, adds no apt packages, no curl, nothing beyond
// what's already there:

// HealthCheckClient/HealthCheckClient.csproj — a second, tiny project
// published alongside the main API into the SAME image:
// <Project Sdk="Microsoft.NET.Sdk">
//   <PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net9.0</TargetFramework></PropertyGroup>
// </Project>

// HealthCheckClient/Program.cs
using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
try
{
    var response = await client.GetAsync("http://localhost:8080/health/live");
    Environment.Exit(response.IsSuccessStatusCode ? 0 : 1);
}
catch
{
    Environment.Exit(1);
}

// Dockerfile — publish BOTH projects into the runtime image:
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["MyApi.csproj", "MyApi/"]
COPY ["HealthCheckClient.csproj", "HealthCheckClient/"]
RUN dotnet restore "MyApi/MyApi.csproj" && dotnet restore "HealthCheckClient/HealthCheckClient.csproj"
COPY . .
RUN dotnet publish "MyApi/MyApi.csproj" -c Release -o /app/publish --no-restore
RUN dotnet publish "HealthCheckClient/HealthCheckClient.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser
COPY --from=build /app/publish .

# No curl needed — "dotnet" is already the ENTRYPOINT binary and is
# guaranteed present in this exact image:
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD ["dotnet", "HealthCheckClient.dll"]

EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENTRYPOINT ["dotnet", "MyApi.dll"]

# docker ps now shows: STATUS: Up 35 seconds (healthy)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes an alternative fix: switch the runtime base image from mcr.microsoft.com/dotnet/aspnet:9.0 to mcr.microsoft.com/dotnet/aspnet:9.0-bookworm-slim (a Debian-based variant that, unlike the default, DOES include a minimal set of common utilities) rather than adding a second .NET project. Evaluate this alternative against the main page\'s own stated multi-stage-build rationale of minimizing image size and attack surface.',
    hint: 'The main page\'s own theory specifically praises multi-stage builds for producing images with "no SDK, no source code, no build artefacts." Does switching to an image variant with MORE included utilities align with or work against that stated goal — and does it actually guarantee curl specifically is present, or just "some utilities"?',
    solution: `Switching to a "slim" or fuller Debian-based variant works AGAINST
the exact rationale the main page gives for multi-stage builds in the
first place — the whole point of using the minimal dotnet/aspnet image
was reducing installed packages and therefore attack surface and patch
burden. Choosing a variant specifically because it includes MORE
utilities is trading away that benefit to solve a problem (missing
curl) that has a curl-free solution available. It's solving the wrong
layer of the problem: the base-image choice should be driven by what
the APPLICATION needs to run, not retrofitted to accommodate a
HEALTHCHECK instruction's tooling assumption.

There's also a more concrete risk: "includes more common utilities"
does not automatically mean curl SPECIFICALLY is guaranteed present,
or will remain present across image updates — Microsoft's base image
variants change their exact package sets between .NET versions and
Debian releases without necessarily documenting every included binary
as a stable contract. A team that switches base images specifically
because curl happened to be present in that variant has taken on an
implicit, undocumented dependency that could silently break on the
next base image update, whereas the .NET-based health check client
depends only on the .NET runtime itself being present — which IS a
documented, stable guarantee of every dotnet/aspnet variant, since
running .NET apps is the base image's entire purpose.

The general principle: when a Dockerfile instruction (like HEALTHCHECK)
needs a capability the chosen base image doesn't provide, the more
robust fix is usually to provide that capability using tools ALREADY
guaranteed by the image's own purpose (here, the .NET runtime itself)
rather than changing the base image to accommodate an incidental
tooling assumption — the latter tends to compound over time as more
"just in case" utilities get added to justify a fuller base image,
eroding the minimal-image benefit the main page's own theory is
built around.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a Dockerfile with a HEALTHCHECK CMD curl instruction will fail to build if curl is not present in the base image, surfacing the problem immediately during docker build.',
      reality: 'HEALTHCHECK instructions are never executed during docker build — only at container RUNTIME, on the configured interval — so a curl-less base image produces a successfully building Dockerfile that only reveals the "command not found" failure once the container is actually running and Docker attempts its first health check.',
    },
    {
      thought: 'the mcr.microsoft.com/dotnet/aspnet runtime image, being a full runtime environment capable of running ASP.NET Core apps, includes common CLI utilities like curl or wget out of the box.',
      reality: 'the dotnet/aspnet image is deliberately minimal, containing only the ASP.NET Core runtime and its native dependencies — general-purpose utilities are intentionally excluded to keep the image small and reduce attack surface, which is the exact same rationale the main page gives for using multi-stage builds in the first place.',
    },
    {
      thought: 'the only way to fix a HEALTHCHECK instruction that needs curl in a minimal image is to install curl via apt-get, or switch to a fuller base image variant that happens to include it.',
      reality: 'a small, separately-published .NET console app can perform the same HTTP health check using the runtime ALREADY bundled in the image, adding zero additional OS packages and depending only on the .NET runtime\'s presence — a guarantee the base image\'s own purpose already provides, unlike an incidental utility that may or may not persist across image updates.',
    },
  ];
}
