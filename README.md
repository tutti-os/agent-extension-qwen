# Qwen Code Agent Extension for Tutti

This repository connects the official Qwen Code CLI to Tutti through the
standard Agent Client Protocol (ACP). It is not a Qwen Code fork and does not
redistribute the Qwen Code runtime. The signed extension package contains only
declarative JSON, localized copy, passive images, and package documentation.

The extension identity is `qwen`; Tutti derives the fixed Agent Target
`extension:qwen` and open execution metadata `acp:qwen` from the verified
extension. The open provider string is never launch authority by itself.

## Runtime contract

- Package: `@qwen-code/qwen-code@0.19.11` (exactly pinned)
- Executable: `qwen`
- Version constraint: `>=0.19.11 <1.0.0`
- ACP launch: `qwen --acp`
- Transport: newline-delimited ACP JSON over stdin/stdout

Tutti first discovers a compatible user-local `qwen`. If none is available,
the declarative install recipe can install the exact npm package below
`${installRoot}` after explicit host confirmation. The managed executable is
also below `${installRoot}`. Neither path modifies a workspace `package.json`,
lockfile, `node_modules`, or global npm state.

## Authentication and provider setup

Qwen Code supports multiple providers, but provider and model configuration
belong to Qwen Code, not this extension. Configure them before starting a
headless ACP session by either:

1. running the interactive Qwen Code TUI and using `/auth`; or
2. configuring Qwen Code user settings and the provider-specific environment
   variables documented upstream.

The standalone `qwen auth` command has been removed upstream. Although `/auth`
appears in the ACP command catalog, headless ACP cannot open the interactive
provider picker. With no selected provider, `session/new` returns
`Authentication required: Use Qwen Code CLI to authenticate first.` With a
provider selected but no credential, it returns a missing-key authentication
error. Do not place credentials in this repository or in the manifest.

See the official [authentication guide](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/auth/)
and [settings guide](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/).

## ACP versus `qwen serve`

This extension directly launches `qwen --acp` over stdio. The upstream
`qwen serve` command is a Stage 1 experimental local HTTP/SSE bridge that
starts its own `qwen --acp` child. It is intentionally not used here: the
manifest contains no port, HTTP token, daemon lifecycle, or HTTP adapter, and
none is required in Tutti for this standard-ACP integration.

The `mcpCapabilities.sse/http` values reported by ACP describe MCP server
transport support; they do not advertise the experimental `qwen serve` HTTP
control surface.

## Session-owned composer state

Models, modes, and commands are projected from the live ACP session:

- models use `acp-session-models`; no provider/model catalog is hardcoded;
- permission modes map the verified Qwen runtime IDs `plan`, `default`,
  `auto-edit`, and `yolo` to Tutti semantic tiers;
- Qwen's classifier-driven `auto` mode remains runtime-owned because Tutti has
  no equivalent semantic tier;
- commands come from asynchronous `available_commands_update` notifications;
- reasoning is not declared because Qwen 0.19.11 advertises only `mode` and
  `model` config options;
- Skills are discovered only from signed workspace/user `.qwen/skills` roots.

The tool profile is intentionally empty. The pinned source documents stable
core IDs, but no paid prompt was sent to capture their ACP content payloads;
all core, dynamic MCP, and `computer_use__*` tools therefore remain with
Tutti's generic ACP renderer instead of guessing diff or input extraction.

## Local validation

Use Node.js 24 and pnpm 10.11.0:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm package:tutti-agent
python3 scripts/validate_agent_extension.py build/tutti-agent/package
```

`pnpm check` rebuilds a clean package, validates the exact pinned runtime
declaration and discovery contract, rejects executable/symlink/unsafe/undeclared
content, and runs deterministic release/signature tests.
`pnpm package:tutti-agent` writes only `extension/` into
`build/tutti-agent/package`. The separate probe below verifies the real runtime.

Probe an already configured local runtime without sending a prompt:

```sh
qwen --version
python3 scripts/probe_acp_runtime.py --cwd /path/to/project -- qwen --acp
```

By default the probe performs only ACP `initialize` and `session/new`. Add
`--probe-auth-command` to verify the local `/auth` headless response without a
model request. Review and redact the raw output before sharing it: it contains
a session ID and may contain local paths or complete Skill metadata. The
repository's summarized, credential-free results are in
[docs/runtime-verification.md](docs/runtime-verification.md).

## Release ownership

This repository owns its release implementation under `scripts/release/`.
`.github/workflows/release.yml` installs frozen dependencies, runs repository
checks, builds a deterministic ZIP, signs `release.json` with Ed25519, uploads
immutable version objects with `If-None-Match: *`, and conditionally updates
`versions.json` and `latest.json` from observed ETags. Only those mutable CDN
paths are invalidated. The workflow then reads `versions.json`, `latest.json`,
`release.json`, and the ZIP back from the public CloudFront URL and verifies
the published record, digest, size, manifest identity, and Ed25519 signature.

The workflow expects these repository variables:

- `TUTTI_AGENT_RELEASES_AWS_REGION`
- `TUTTI_AGENT_RELEASES_AWS_ROLE_ARN`
- `TUTTI_AGENT_RELEASES_S3_BUCKET`
- `TUTTI_AGENT_RELEASES_CLOUDFRONT_DISTRIBUTION_ID` (optional)

Store the Ed25519 private key only in the
`TUTTI_AGENT_EXTENSION_SIGNING_PRIVATE_KEY` repository secret. AWS access uses
GitHub OIDC. The bootstrap template at
`infra/aws/agent-extension-release-infrastructure.yaml` creates a private,
versioned S3 bucket, CloudFront OAC/distribution, and a main-branch-scoped OIDC
role. Releases use signing key ID `tutti-qwen-release-v1` and CDN base
`https://d1x7gb6wqsqmnm.cloudfront.net/tutti-agent-releases`.

This repository does not contain a production private key or AWS credential,
and this implementation does not publish version `1.0.0` or enable a Tutti
trusted source.

## Known limitations

- Qwen Code ACP is an upstream evolving surface; compatibility is pinned and
  probed against 0.19.11. The `qwen serve` boundary is based on upstream source
  and its official experimental-daemon documentation, not a daemon probe here.
- Authentication/provider selection must be completed outside headless ACP.
- Model catalogs depend on provider settings and can contain opaque route IDs.
- Command and Skill catalogs arrive asynchronously and vary by session.
- No paid prompt was sent during verification, so dynamic/unknown tool payloads
  continue to use the generic renderer.
- Interrupt is not declared because it was not advertised by the probed
  initialize/session state.

## Artwork and trademarks

`extension/assets/icon.svg` places the official Qwen Code desktop brand icon in
the colored shared identity used by the Provider Rail, conversation headers,
Message Center, and mentions. `mask-icon.svg` is the transparent conversation-row
mask glyph. `hero-image.jpg` is original Tutti-maintained
record-sleeve artwork inspired by Qwen's visual palette without altering the
official mark. Both assets are local and passive. “Qwen Code” identifies the
compatible upstream runtime; all related trademarks belong to their respective
owners.

The fixed-source and community-reference review is recorded in
[docs/reference-review.md](docs/reference-review.md).
