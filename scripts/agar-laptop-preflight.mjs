#!/usr/bin/env node
/**
 * AGAR Engine laptop-first, READ-ONLY diagnostic.
 * Does not install packages, download models, change settings, or claim that
 * browser editing or CUDA inference has passed.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statfsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseVersion(raw) {
  const match = String(raw ?? '').trim().match(/(?:^|\s)v?(\d+)(?:\.\d+)?/);
  return match ? Number(match[1]) : null;
}
export function parseNvidiaSmi(raw) {
  return String(raw ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).flatMap((line) => {
    const match = line.match(/^(.*),\s*(\d+)\s*$/);
    return match ? [{ name: match[1].trim(), vramMiB: Number(match[2]) }] : [];
  });
}
export function classifyLocalAi(gpus, ramGiB) {
  if (gpus.length === 0) return 'No NVIDIA CUDA GPU detected. Skip local model installation; editor/backend can still be tested.';
  const maxVramMiB = Math.max(...gpus.map((gpu) => gpu.vramMiB));
  if (maxVramMiB < 4096 || ramGiB < 7.5) {
    return 'Memory is constrained: test frontend/backend and FFmpeg first; do NOT attempt heavy video models.';
  }
  if (maxVramMiB < 8192 || ramGiB < 16) {
    return 'Limited hardware: optional SD 1.5 still-image test only, one job at a time. Full video diffusion is NOT validated.';
  }
  return 'Hardware appears less constrained. Model suitability still needs a separate measured memory test.';
}

const THIS_FILE = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(THIS_FILE), '..');
const readCommand = (command, args, timeout = 4500) => {
  try { return execFileSync(command, args, { encoding: 'utf8', timeout, windowsHide: true, stdio: ['ignore','pipe','ignore'] }).trim(); }
  catch { return null; }
};
const giB = (bytes) => Math.round((bytes / (1024 ** 3)) * 10) / 10;

export function diagnostic(root = DEFAULT_ROOT) {
  const node = readCommand(process.execPath, ['--version']) ?? process.version;
  const git = readCommand('git', ['--version']);
  const npm = readCommand('npm', ['--version']);
  const memoryGiB = giB(os.totalmem());
  let freeDiskGiB = null;
  try { const fs = statfsSync(root); freeDiskGiB = giB(fs.bavail * fs.bsize); }
  catch { /* disk check unavailable */ }
  const gpuRaw = readCommand('nvidia-smi', ['--query-gpu=name,memory.total','--format=csv,noheader,nounits']);
  const gpus = parseNvidiaSmi(gpuRaw);
  const expected = [
    'package.json',
    'src/features/editor/components/agar-generation-panel.tsx',
    'src/features/editor/services/agar-api.ts',
    'src/features/editor/services/agar-video-integration.ts',
  ];
  const missing = expected.filter((p) => !existsSync(path.join(root, p)));
  return {
    root, platform: process.platform,
    node: { found: node, passes: parseVersion(node) >= 22 },
    npm: { found: npm, recommended: parseVersion(npm) >= 11 },
    git: { found: git, passes: !!git },
    memoryGiB, freeDiskGiB, gpus,
    files: { checked: expected.length, missing },
    advice: classifyLocalAi(gpus, memoryGiB),
    note: 'This is a read-only hardware/source preflight, not a build, browser, or video-generation test.'
  };
}

function main() {
  const report = diagnostic();
  const lines = [
    'AGAR Engine - laptop-first preflight (read only)',
    `Project: ${report.root}`,
    `Node: ${report.node.found} ${report.node.passes ? '[PASS]' : '[CHECK REQUIRED: need Node 22+]'}`,
    `npm: ${report.npm.found ?? 'not found'} ${report.npm.recommended ? '[PASS]' : '[CHECK: npm 11 recommended]'}`,
    `Git: ${report.git.found ?? 'not found'} ${report.git.passes ? '[PASS]' : '[INSTALL GIT]'}`,
    `System RAM: ${report.memoryGiB} GiB`,
    `Free disk on project drive: ${report.freeDiskGiB ?? 'unknown'} GiB`,
    ...report.gpus.map((gpu) => `GPU: ${gpu.name} (${gpu.vramMiB} MiB VRAM)`),
    ...(report.gpus.length ? [] : ['GPU: No compatible NVIDIA information from nvidia-smi']),
    `Missing project files: ${report.files.missing.length ? report.files.missing.join(', ') : 'none'}`,
    `AI guidance: ${report.advice}`,
    report.note,
  ];
  console.log(lines.join('\n'));
  console.log('\nMachine-readable report:');
  console.log(JSON.stringify(report, null, 2));
  if (!report.node.passes || !report.git.passes || report.files.missing.length) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === THIS_FILE) main();
