import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
execFileSync(process.execPath, [path.join(root, 'scripts', 'package.mjs')], { stdio: 'inherit' });
const packageDir = path.join(root, 'build', 'tutti-agent', 'package');
const manifest = JSON.parse(await readFile(path.join(packageDir, 'tutti.agent.json'), 'utf8'));
if (manifest.schemaVersion !== 'tutti.agent.manifest.v2' || manifest.agentKey !== 'qwen' || manifest.version !== '1.0.0') throw new Error('invalid manifest identity');
const expectedInstall = ['install', '--prefix', '${installRoot}', '@qwen-code/qwen-code@0.19.11'];
const expectedLaunch = ['--acp'];
if (manifest.runtime?.kind !== 'standard-acp') throw new Error('Qwen runtime must use standard-acp');
if (manifest.runtime.install?.runner !== 'npm' || JSON.stringify(manifest.runtime.install.args) !== JSON.stringify(expectedInstall)) throw new Error('Qwen runtime package must be exactly pinned and install-root scoped');
if (manifest.runtime.launch?.executable !== '${installRoot}/node_modules/.bin/qwen' || JSON.stringify(manifest.runtime.launch.args) !== JSON.stringify(expectedLaunch)) throw new Error('Qwen managed launch contract changed');
const discovery = JSON.parse(await readFile(path.join(packageDir, manifest.profiles.discovery), 'utf8'));
const candidate = discovery.candidates?.[0];
if (discovery.candidates?.length !== 1 || JSON.stringify(candidate.binaryNames) !== JSON.stringify(['qwen'])) throw new Error('Qwen discovery binary changed');
if (JSON.stringify(candidate.version) !== JSON.stringify({ args: ['--version'], constraint: '>=0.19.11 <1.0.0' })) throw new Error('Qwen discovery version contract changed');
if (JSON.stringify(candidate.launchArgs) !== JSON.stringify(expectedLaunch) || JSON.stringify(candidate.launchArgs) !== JSON.stringify(manifest.runtime.launch.args)) throw new Error('Qwen discovery launch must match managed launch');
if (candidate.probe?.kind !== 'acp-initialize' || candidate.probe.timeoutMs !== 5000) throw new Error('Qwen discovery must use the bounded ACP initialize probe');
const capabilities = JSON.parse(await readFile(path.join(packageDir, manifest.profiles.capabilities), 'utf8'));
const expectedCapabilities = { imageInput: true, audioInput: true, embeddedContext: true, interrupt: false, resume: true, permissionModes: true, modelSelection: true, commands: true, skills: true };
if (JSON.stringify(capabilities.declared) !== JSON.stringify(expectedCapabilities)) throw new Error('Qwen capabilities must match pinned source and probe evidence');
const composer = JSON.parse(await readFile(path.join(packageDir, manifest.profiles.composer), 'utf8'));
if (composer.model?.source !== 'acp-session-models' || composer.permission?.source !== 'acp-session-modes') throw new Error('Qwen composer catalogs must remain session-owned');
const expectedModes = [{ runtimeId: 'plan', semantic: 'read-only' }, { runtimeId: 'default', semantic: 'ask-before-write' }, { runtimeId: 'auto-edit', semantic: 'accept-edits' }, { runtimeId: 'yolo', semantic: 'full-access' }];
if (JSON.stringify(composer.permissionModes) !== JSON.stringify(expectedModes)) throw new Error('Qwen permission mappings must match verified runtime IDs');
const expectedSkills = { invocation: 'textTrigger', triggerPrefix: '/', roots: [{ scope: 'workspace', path: '.qwen/skills' }, { scope: 'user', path: '.qwen/skills' }] };
if (JSON.stringify(composer.skills) !== JSON.stringify(expectedSkills)) throw new Error('Qwen Skill roots must match pinned upstream documentation');
const tools = JSON.parse(await readFile(path.join(packageDir, manifest.profiles.tools), 'utf8'));
if (tools.tools?.length !== 0) throw new Error('Qwen tools must remain generic until ACP payload semantics are probed');
await rejectExecutables(packageDir);
async function rejectExecutables(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`symlink is forbidden: ${item}`);
    if (entry.isDirectory()) { await rejectExecutables(item); continue; }
    if ((await stat(item)).mode & 0o111) throw new Error(`executable is forbidden: ${item}`);
  }
}
