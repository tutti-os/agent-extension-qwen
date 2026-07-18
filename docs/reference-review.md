# Reference review

This record is intended to be copied into the eventual pull request
description. Official Qwen source and real runtime probes take precedence over
community registries.

## Adopted

- [Official Qwen Code commit `401170d`](https://github.com/QwenLM/qwen-code/tree/401170d4888914fb50c1640a1256239931c9b009): package identity, `qwen --acp`, stdio
  transport, auth errors, dynamic model/mode/config state, commands, Skills,
  and stable core tool IDs. Exact declaration evidence comes from the
  [`initialize` response](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/packages/cli/src/acp-integration/acpAgent.ts#L3307-L3332),
  [`ApprovalMode` IDs](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/packages/core/src/config/approval-mode.ts#L7-L15),
  [permission semantics](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/docs/users/features/approval-mode.md#L7-L17),
  and [Skill roots](https://github.com/QwenLM/qwen-code/blob/401170d4888914fb50c1640a1256239931c9b009/docs/users/features/skills.md#L43-L69).
- The packaged icon comes from the official
  [`QwenLM/qwen-code` desktop brand asset at commit `053f822`](https://github.com/QwenLM/qwen-code/blob/053f82275b645aeccdf4f1fb651ca40249d319b2/packages/desktop/apps/electron/resources/brands/qwen-code/icon.svg).
  The record-sleeve hero remains original Tutti-maintained artwork.
- The official [authentication guide](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/auth/)
  and [settings guide](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/)
  establish that provider selection belongs to interactive `/auth` or
  `security.auth.selectedType`, while settings or provider-specific environment
  variables supply headless credentials. The removed standalone `qwen auth`
  command was not documented as a setup path.
- [Tutti Agent Extension Skill commit `4a053ce`](https://github.com/tutti-os/tutti-agent-extension-skill/tree/4a053ce577bbf126ed614132bb176853855d7707): declarative package boundary,
  scaffold, package validator, release tools, signing/index ordering, and AWS
  bootstrap contract.
- [Gemini extension commit `8f8f2d9`](https://github.com/tutti-os/agent-extension-gemini/tree/8f8f2d9e794bc5a04f309cabe93aef4682ea2652): standard-ACP manifest/profile shapes and
  canonical tool presentation patterns, without copying Gemini runtime IDs.
- [CodeBuddy extension commit `697155d`](https://github.com/tutti-os/agent-extension-codebuddy/tree/697155d716ce1174b202b1e1f999c290b5023c75): current self-contained repository and
  release-tooling layout.

## Community references used only for discovery

- [wechat-acp](https://github.com/formulahendry/wechat-acp/blob/8889461a92178788174b0dd53dbf0593162cbd0e/src/config.ts)
  suggested `qwen --acp --experimental-skills`. Only `--acp` was retained after
  the pinned runtime probe; the extra experimental flag was rejected because
  0.19.11 advertises Skills without it.
- The [clawBro support matrix](https://github.com/FISHers6/clawBro/blob/798d08153d033c32e8cfdf49026aa77f03d111a1/docs/backend-support-matrix.md)
  and [acpx registry](https://github.com/openclaw/acpx/blob/a518ea909eb91296b0d05c76345f1c8403ba830b/src/agent-registry.ts)
  were launch-command discovery hints for `qwen --acp`; the official source
  and real probe, not those registries, established the accepted contract.
- The fixed [chat2acp configuration](https://github.com/yaonyan/chat2acp/blob/829ec5a425405295b371a3b9f78df57f8569dabd/src/agents.config.ts)
  contains no Qwen entry, so no Qwen behavior was adopted from it.
- [clawBro's session driver](https://github.com/FISHers6/clawBro/blob/798d08153d033c32e8cfdf49026aa77f03d111a1/crates/clawbro-runtime/src/acp/session_driver.rs)
  was used only as a generic initialize/session lifecycle compatibility
  checklist, not as a protocol definition or Qwen fact source.

## Rejected or corrected

- Any `qwen serve` HTTP/SSE launch was rejected for this standard-ACP package.
  The official [daemon documentation](https://qwenlm.github.io/qwen-code-docs/en/users/qwen-serve/)
  describes it as an experimental local HTTP/SSE bridge; the fixed source shows
  that it owns an internal ACP child. It is not a declarative stdio replacement,
  so none of its HTTP control routes were adopted as standard ACP capabilities.
- Static provider/model catalogs were rejected because Qwen builds model IDs
  from current provider settings and may emit opaque route IDs.
- Static command/Skill catalogs were rejected because ACP updates them per
  session.
- `.agents/skills` roots were rejected; pinned Qwen documentation advertises
  `.qwen/skills`.
- A reasoning selector was rejected because 0.19.11 reports only `mode` and
  `model` config options. `/effort` appearing as a command does not establish a
  reasoning config option.
- Qwen permission mode `auto` was not forced into a Tutti tier; its classifier
  behavior has no exact semantic equivalent.
- Standalone `qwen auth` setup advice was rejected because upstream removed
  that command. Provider selection requires interactive `/auth` or
  `security.auth.selectedType`; settings or provider-specific environment
  variables then provide credentials.
- No tool IDs were mapped. Stable core IDs exist in source, but this
  credential-free probe deliberately did not send a prompt and therefore did
  not prove content/diff extraction. Core, dynamic MCP, and
  `computer_use__*` tools remain with the generic ACP renderer.
