// Presentation regression fixture only. The production engine remains unseeded.
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';

const root = process.cwd();
const scratch = await mkdtemp(path.join(tmpdir(), 'terminus-fixture-'));
const emitted = new Set();
async function compile(relative) {
  if (emitted.has(relative)) return;
  emitted.add(relative);
  const source = await readFile(path.join(root, 'src', relative + '.ts'), 'utf8');
  let output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText;
  const imports = [...output.matchAll(/from ["'](\.[^"']+)["']/g)];
  for (const [, specifier] of imports) {
    await compile(path.posix.normalize(path.posix.join(path.posix.dirname(relative), specifier)));
    output = output.replaceAll(`"${specifier}"`, `"${specifier}.mjs"`).replaceAll(`'${specifier}'`, `'${specifier}.mjs'`);
  }
  const destination = path.join(scratch, relative + '.mjs');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, output);
}
function seededRandom(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
try {
  await compile('engine/monteCarlo');
  const { runSimulation } = await import(pathToFileURL(path.join(scratch, 'engine/monteCarlo.mjs')));
  const { DEFAULT_INPUTS } = await import(pathToFileURL(path.join(scratch, 'lib/constants.mjs')));
  const fixturePath = path.join(root, 'docs/redesign/fixtures/milestone-1a.json');
  const capture = process.argv.includes('--capture');
  const baseline = capture ? null : JSON.parse(await readFile(fixturePath, 'utf8'));
  if (baseline) assert.deepEqual({ ...DEFAULT_INPUTS, simulationStartYear: 2026 }, baseline.cases[0].inputs);
  const cases = baseline?.cases ?? [
    { name: 'default household', inputs: { ...DEFAULT_INPUTS, simulationStartYear: 2026 } },
    { name: 'single household / later retirement', inputs: { ...DEFAULT_INPUTS, simulationStartYear: 2026, hasSpouse: false, retirementAge: 58, numSimulations: 500 } },
  ];
  const snapshots = cases.map(({ name, inputs }, index) => {
    const originalRandom = Math.random;
    let results;
    try { Math.random = seededRandom(21014 + index); results = runSimulation(inputs); }
    finally { Math.random = originalRandom; }
    return { name, inputs, seed: 21014 + index,
      resultHash: createHash('sha256').update(JSON.stringify(results)).digest('hex'),
      summary: { successRate: results.successRate, ruinProbability: results.ruinProbability,
        medianTerminalWealth: results.medianTerminalWealth,
        percentileSamples: results.percentilePaths.filter((_, i) => i % 10 === 0),
        finalBand: results.stackedBands.at(-1) },
    };
  });
  if (capture) {
    await mkdir(path.dirname(fixturePath), { recursive: true });
    await writeFile(fixturePath, JSON.stringify({ sourceBaseline: '2aad932', rng: 'test-only mulberry32; no production RNG changes', cases: snapshots }, null, 2) + '\n');
    console.log('Captured pre-implementation inputs and full-result hashes.');
  } else {
    assert.deepEqual(snapshots, baseline.cases);
    console.log('PASS: both captured input payloads and full seeded financial results are unchanged.');
  }
  await compile('lib/theme');
  await compile('lib/navigation');
  const { parseTheme, resolveTheme } = await import(pathToFileURL(path.join(scratch, 'lib/theme.mjs')));
  const { parseRoute, routeHash, analyses, guideSections } = await import(pathToFileURL(path.join(scratch, 'lib/navigation.mjs')));
  for (const oldTheme of ['dark', 'graphite', 'midnight', 'sepia', 'unknown', null]) assert.equal(parseTheme(oldTheme), 'graphite');
  for (const lightTheme of ['light', 'porcelain']) assert.equal(parseTheme(lightTheme), 'porcelain');
  assert.equal(parseTheme('system'), 'system');
  assert.equal(resolveTheme('system', true), 'porcelain');
  assert.equal(resolveTheme('system', false), 'graphite');
  assert.equal(resolveTheme('graphite', true), 'graphite');
  for (const destination of ['overview', 'plan', 'report', 'guide']) assert.equal(parseRoute(`#${destination}`).destination, destination);
  for (const { id } of analyses) {
    assert.equal(routeHash(parseRoute(`#explore/${id}`)), `#explore/${id}`);
    assert.equal(routeHash(parseRoute(`#${id}`)), `#explore/${id}`);
  }
  assert.equal(routeHash(parseRoute('#summary')), '#report');
  assert.equal(routeHash(parseRoute('#info')), '#guide');
  for (const section of guideSections) assert.equal(routeHash(parseRoute(`#guide/${section}`)), `#guide/${section}`);
  assert.equal(routeHash(parseRoute('#explore/invalid')), '#explore/rich');
  assert.equal(routeHash(parseRoute('#untrusted/invalid')), '#overview');
  console.log('PASS: legacy theme migration, System resolution, route round trips and invalid-route fallbacks.');
} finally {
  assert.equal(path.dirname(path.resolve(scratch)), path.resolve(tmpdir()));
  assert.ok(path.basename(scratch).startsWith('terminus-fixture-'));
  await rm(scratch, { recursive: true, force: true });
}
