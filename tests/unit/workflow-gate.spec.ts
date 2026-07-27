/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflowUrl = new URL('../../.github/workflows/ci.yml', import.meta.url);
const legacyPagesWorkflowUrl = new URL('../../.github/workflows/pages.yml', import.meta.url);
const workflow = readFileSync(workflowUrl, 'utf8');
const lines = workflow.split(/\r?\n/);

function jobBlock(name: string): string {
  const start = lines.findIndex(line => line === `  ${name}:`);
  expect(start, `job ${name} exists`).toBeGreaterThan(-1);

  const next = lines.findIndex((line, index) => index > start && /^ {2}[\w-]+:$/.test(line));
  return lines.slice(start, next === -1 ? undefined : next).join('\n');
}

function requiredJob(name: string): string | undefined {
  return /^ {4}needs: ([\w-]+)$/m.exec(jobBlock(name))?.[1];
}

describe('CI-to-Pages deployment gate', () => {
  it('uses one exact-SHA job graph with deployment-only write permissions', () => {
    const pages = jobBlock('pages');
    const deploy = jobBlock('deploy');

    expect(existsSync(legacyPagesWorkflowUrl)).toBe(false);
    expect(requiredJob('pages')).toBe('verify');
    expect(requiredJob('deploy')).toBe('pages');
    expect(pages).toContain("if: github.event_name == 'push' && github.ref == 'refs/heads/main'");
    expect(pages).not.toContain('pages: write');
    expect(deploy).toContain("github.event_name == 'push'");
    expect(deploy).toContain("github.ref == 'refs/heads/main'");
    expect(deploy).toContain("needs.pages.result == 'success'");
    expect(deploy).toContain('pages: write');
    expect(deploy).toContain('id-token: write');
  });

  it('skips artifact construction and deployment after a controlled verification failure', () => {
    const outcomes = new Map<string, 'failure' | 'skipped' | 'success'>([['verify', 'failure']]);

    for (const job of ['pages', 'deploy']) {
      const dependency = requiredJob(job);
      expect(dependency).toBeDefined();
      outcomes.set(job, outcomes.get(dependency ?? '') === 'success' ? 'success' : 'skipped');
    }

    expect(outcomes.get('pages')).toBe('skipped');
    expect(outcomes.get('deploy')).toBe('skipped');
  });
});
