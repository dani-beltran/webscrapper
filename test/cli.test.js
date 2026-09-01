import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(
  readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8')
);
const cliPath = resolve(repositoryRoot, packageJson.bin.webscrapper);

function runCli(...args) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      NO_COLOR: '1'
    },
    maxBuffer: 2 * 1024 * 1024,
    timeout: 10_000
  });

  assert.ifError(result.error);

  return {
    ...result,
    output: `${result.stdout}${result.stderr}`
  };
}

function assertExit(result, expectedStatus, context) {
  assert.equal(
    result.status,
    expectedStatus,
    `${context}\n\nCLI output:\n${result.output}`
  );
}

test('root help, command help, and version expose the Commander CLI', () => {
  for (const args of [[], ['--help']]) {
    const result = runCli(...args);
    assertExit(result, 0, `Expected ${args.join(' ') || 'no arguments'} to show help`);
    assert.match(result.output, /Usage:\s+webscrapper\b/i);
    assert.match(result.output, /\bscrape\b/);
    assert.match(result.output, /\blist-presets\b/);
    assert.match(result.output, /\bshow-preset\b/);
  }

  const versionResult = runCli('--version');
  assertExit(versionResult, 0, 'Expected --version to succeed');
  assert.equal(versionResult.stdout.trim(), packageJson.version);

  const helpResult = runCli('scrape', '--help');
  assertExit(helpResult, 0, 'Expected scrape --help to succeed');
  assert.match(helpResult.output, /Usage:\s+webscrapper scrape\b/i);

  for (const option of [
    '--structured',
    '--browser',
    '--timeout',
    '--headless',
    '--no-headless',
    '--no-follow-permanent-redirect',
    '--no-follow-temporary-redirect',
    '--output',
    '--file',
    '--preset',
    '--group-by',
    '--plugin-file',
    '--format',
    '--batch-size',
    '--delay'
  ]) {
    assert.ok(
      helpResult.output.includes(option),
      `Expected scrape help to include ${option}\n\nCLI output:\n${helpResult.output}`
    );
  }
});

test('preset commands dispatch without starting a browser', () => {
  const listResult = runCli('list-presets');
  assertExit(listResult, 0, 'Expected list-presets to succeed');
  for (const preset of ['news', 'ecommerce', 'blog', 'documentation']) {
    assert.match(listResult.output, new RegExp(`\\b${preset}\\b`));
  }
  assert.match(listResult.output, /Total presets:\s*4/i);

  const showResult = runCli('show-preset', 'news');
  assertExit(showResult, 0, 'Expected show-preset news to succeed');
  assert.match(showResult.output, /Configuration for preset "news"/i);
  assert.match(showResult.output, /"excludeSelectors"/);

  const unknownResult = runCli('show-preset', 'does-not-exist');
  assertExit(unknownResult, 1, 'Expected an unknown preset to fail');
  assert.match(unknownResult.output, /Preset "does-not-exist" not found/i);

  const missingResult = runCli('show-preset');
  assertExit(missingResult, 1, 'Expected a missing preset argument to fail');
  assert.match(missingResult.output, /missing required argument|specify a preset name/i);
});

test('scrape parsing and validation fail before any browser launch', () => {
  const missingPlugin = resolve(repositoryRoot, 'test', '__missing_plugin__.mjs');
  const missingUrlFile = resolve(repositoryRoot, 'test', '__missing_urls__.txt');
  const cases = [
    {
      name: 'explicit scrape without a URL',
      args: ['scrape'],
      pattern: /at least one URL|required/i
    },
    {
      name: 'legacy scrape with an invalid URL',
      args: ['not-a-url'],
      pattern: /URL must start|at least one URL|invalid URL/i
    },
    {
      name: 'unknown preset',
      args: ['scrape', 'https://example.com', '--preset', 'does-not-exist'],
      pattern: /unknown preset|preset .* not found/i
    },
    {
      name: 'missing plugin through the legacy command form',
      args: ['https://example.com', '--plugin-file', missingPlugin],
      pattern: /could not load plugin file|cannot find module|ENOENT/i
    },
    {
      name: 'unsupported bulk format',
      args: [
        'scrape',
        'https://example.com',
        'https://example.org',
        '--format',
        'xml'
      ],
      pattern: /unsupported format|allowed choices|invalid.*value/i
    },
    {
      name: 'missing URL file with repeated groups',
      args: [
        'scrape',
        '--file',
        missingUrlFile,
        '--group-by',
        'article',
        '--group-by',
        'main'
      ],
      pattern: /failed to read file|ENOENT|no such file/i
    },
    {
      name: 'unknown option',
      args: ['scrape', '--definitely-unknown'],
      pattern: /unknown option/i
    },
    {
      name: 'missing option value',
      args: ['scrape', 'https://example.com', '--timeout'],
      pattern: /option .*--timeout.* argument|expected argument/i
    },
    {
      name: 'non-positive timeout',
      args: ['scrape', 'https://example.com', '--timeout', '0'],
      pattern: /positive integer/i
    },
    {
      name: 'non-integer batch size',
      args: ['scrape', 'https://example.com', 'https://example.org', '--batch-size', '1.5'],
      pattern: /positive integer/i
    },
    {
      name: 'negative delay',
      args: ['scrape', 'https://example.com', 'https://example.org', '--delay', '-1'],
      pattern: /non-negative integer/i
    }
  ];

  for (const testCase of cases) {
    const result = runCli(...testCase.args);
    assertExit(result, 1, `Expected ${testCase.name} to fail`);
    assert.match(
      result.output,
      testCase.pattern,
      `Unexpected output for ${testCase.name}:\n${result.output}`
    );
  }
});
