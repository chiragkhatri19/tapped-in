#!/usr/bin/env node
/**
 * Print AI context for a feature ID (from docs/feature-registry.yaml).
 * Usage: node scripts/feature-context.mjs tracker
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const id = process.argv[2];

if (!id) {
  console.error('Usage: node scripts/feature-context.mjs <feature-id>');
  console.error('Example: node scripts/feature-context.mjs tracker');
  process.exit(1);
}

const registryPath = join(root, 'docs', 'feature-registry.yaml');
if (!existsSync(registryPath)) {
  console.error('Missing docs/feature-registry.yaml');
  process.exit(1);
}

const yaml = readFileSync(registryPath, 'utf8');
const blockRe = new RegExp(
  `^  ${id}:\\n([\\s\\S]*?)(?=^  [a-z_]+:|^features:|\\Z)`,
  'm'
);
const match = yaml.match(blockRe);
if (!match) {
  console.error(`Unknown feature id: ${id}`);
  console.error('Ids are listed under features: in docs/feature-registry.yaml');
  process.exit(1);
}

console.log('# Tapped In feature context\n');
console.log(`FEATURE_ID=${id}\n`);
console.log('## Registry\n');
console.log(`  ${id}:`);
console.log(match[1].trimEnd());
console.log('\n## Read next\n');
console.log('- INTEGRATION_STATUS.md');
console.log('- docs/TYPESCRIPT_STACK_MIGRATION.md (if storage/state work)');
const featureDoc = join(root, 'docs', 'features', `${id.replace(/_/g, '-')}.md`);
const altDoc = join(root, 'docs', 'features', `${id}.md`);
if (existsSync(featureDoc)) console.log(`- ${featureDoc.replace(root + '\\', '').replace(root + '/', '')}`);
else if (existsSync(altDoc)) console.log(`- docs/features/${id}.md`);
console.log('\n## Do not\n');
console.log('- Full-repo analyze when this slice is enough');
