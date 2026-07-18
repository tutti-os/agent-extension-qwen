# Qwen Code 0.19.11 runtime verification

Verified on 2026-07-17 and independently re-verified on 2026-07-18 in isolated
temporary HOME, install-prefix, and project directories.
No prompt was sent, no paid model call was made, and no real credential or
session identifier is recorded here.

## Package and executable

- npm package: `@qwen-code/qwen-code@0.19.11`
- npm integrity: `sha512-Hf7p/J7dsE0JSP/vG3m8x+/7Yx0Ufc2UZLaTVHnohQoikZ3QWiXT4hMYjTrAO7fPTvGpqrkWqOp7Vq2fEfMtTA==`
- package binary: `qwen` -> `cli-entry.js`
- package engine: Node.js `>=22.0.0`
- observed `qwen --version`: `0.19.11`

The source package identity is independently fixed at Qwen Code commit
[`401170d`](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/packages/cli/package.json#L1-L14).

## ACP initialize

The repository probe sent protocol version 1 with filesystem and terminal
client capabilities disabled. `qwen --acp` returned:

- `protocolVersion`: `1`
- `agentInfo`: `name=qwen-code`, `title=Qwen Code`, `version=0.19.11`
- `loadSession`: true
- prompt capabilities: image, audio, embedded context
- session capabilities: list and resume
- MCP transports: SSE and HTTP
- auth method without configuration: OpenAI API key, with terminal hint
  `--auth-type=openai`

These values also match the fixed implementation's
[`initialize` response](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/packages/cli/src/acp-integration/acpAgent.ts#L3307-L3332),
including the three prompt capabilities, session list/resume, and the distinct
MCP transport flags.

The fixed implementation is newline-delimited ACP over stdio; logs are routed
away from protocol stdout. See
[`acpAgent.ts`](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/packages/cli/src/acp-integration/acpAgent.ts#L2486-L2536).

## ACP session/new

Three credential-free cases were checked:

1. No selected auth/provider: error code `-32000`,
   `Authentication required: Use Qwen Code CLI to authenticate first.`
2. OpenAI selected but no API key: error code `-32000`, reporting the missing
   OpenAI API key and directing the user to settings or `OPENAI_API_KEY`.
3. OpenAI selected in isolated settings with a deliberately invalid placeholder
   key: `session/new` succeeded. No prompt was sent, so the placeholder was not
   used for a model request.

The successful response contained a non-empty session ID (omitted), dynamic
models, modes, and config options. Mode state reported current `auto` and these
available runtime IDs:

- `plan`
- `default`
- `auto-edit`
- `auto`
- `yolo`

The independent run also captured the runtime-provided descriptions used for
the four Tutti mappings:

| Runtime ID | Runtime description | Tutti semantic |
| --- | --- | --- |
| `plan` | Analyze only; do not modify files or execute commands | `read-only` |
| `default` | Require approval for file edits or shell commands | `ask-before-write` |
| `auto-edit` | Automatically approve file edits | `accept-edits` |
| `yolo` | Automatically approve all tools | `full-access` |

The IDs are fixed in the official
[`ApprovalMode` enum](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/packages/core/src/config/approval-mode.ts#L7-L15),
and the official
[approval-mode table](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/docs/users/features/approval-mode.md#L7-L17)
defines the same read-only, manual-approval, edit-auto-approval, and all-tool
auto-approval behavior. Classifier-driven `auto` remains deliberately unmapped.

Config options contained only `mode` and `model`; there was no reasoning
option. Model values reflected the isolated provider settings and were
internally dynamic (including different current and available provider routes),
which is why the extension does not persist a model list.

After waiting three seconds, an ACP `available_commands_update` contained 41
session commands:

`status`, `tasks`, `auth`, `btw`, `bug`, `clear`, `compress`, `compress-fast`,
`config`, `context`, `diff`, `docs`, `doctor`, `directory`, `effort`, `export`,
`extensions`, `hooks`, `import-config`, `init`, `language`, `learn`, `dream`,
`forget`, `goal`, `model`, `remember`, `skills`, `stats`, `summary`, `update`,
`insight`, `batch`, `dataviz`, `extension-creator`, `loop`, `new-app`,
`qc-helper`, `review`, `simplify`, `stuck`.

The same update's `_meta.availableSkills` advertised bundled Skills `batch`, `dataviz`,
`extension-creator`, `loop`, `new-app`, `qc-helper`, `review`, `simplify`, and
`stuck`. These catalogs are evidence of runtime delivery, not a static list in
the extension profile.

## Headless `/auth`

After the successful credential-placeholder `session/new`, the probe sent the
literal `/auth` slash command through `session/prompt`. This is handled locally
by Qwen Code and does not invoke the configured model. The response had
`stopReason=end_turn`; its `agent_message_chunk` said that authentication
configuration is available only in interactive mode and directed headless
users to interactive `/auth` or `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and
`OPENAI_MODEL`. No prompt beyond `/auth` and no paid model request was sent.

Reproduce the check with an isolated, deliberately non-secret placeholder key:

```sh
OPENAI_API_KEY=not-a-real-key \
  python3 scripts/probe_acp_runtime.py \
  --cwd /path/to/empty-project \
  --probe-auth-command \
  -- /path/to/qwen --acp
```

The isolated HOME used for verification selected `openai` through
`~/.qwen/settings.json` with only
`{"security":{"auth":{"selectedType":"openai"}}}`. Raw probe output is not
checked in because it includes an ephemeral session ID, local paths, and full
bundled Skill metadata; the facts above are the minimal redacted transcript.

## Resulting declaration decisions

- Keep `qwen --acp`; do not use `qwen serve`.
- Source models, permission modes, and commands from ACP session state.
- Map four permission IDs with exact Tutti semantics; leave classifier-driven
  `auto` unmapped.
- Declare image/audio/embedded context, resume, model/mode, commands, and
  Skills; do not declare reasoning or interrupt.
- Discover Skills from `.qwen/skills` only.
- Keep the tool profile empty: stable core IDs are known from source, but no
  prompt/tool payload was captured to prove diff or input extraction. Core,
  dynamic MCP, and computer-use IDs use the generic renderer.

The two signed Skill roots follow the fixed official documentation for
[personal `~/.qwen/skills`](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/docs/users/features/skills.md#L43-L46)
and [project `.qwen/skills`](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/docs/users/features/skills.md#L55-L69).
