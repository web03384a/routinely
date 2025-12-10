#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const OSV_BATCH_ENDPOINT = 'https://api.osv.dev/v1/querybatch';
const OSV_VULN_ENDPOINT = 'https://api.osv.dev/v1/vulns';

async function loadLockFile() {
  const lockPath = path.join(process.cwd(), 'package-lock.json');
  try {
    const raw = await fs.readFile(lockPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Unable to read package-lock.json. Make sure the project is installed.', error);
    process.exit(1);
  }
}

function collectFromDeps(deps, map) {
  for (const [name, info] of Object.entries(deps)) {
    if (!info || !info.version) continue;
    map.set(`${name}@${info.version}`, { name, version: info.version });
    if (info.dependencies) collectFromDeps(info.dependencies, map);
  }
}

function extractPackages(lock) {
  const packages = new Map();

  if (lock.packages) {
    for (const [pkgPath, info] of Object.entries(lock.packages)) {
      if (!info?.version) continue;

      // package name might be missing in npm lockfile v3; derive from path
      const derivedName = info.name || pkgPath.split('node_modules/').filter(Boolean).pop();
      if (!derivedName) continue;

      packages.set(`${derivedName}@${info.version}`, { name: derivedName, version: info.version });
    }
  } else if (lock.dependencies) {
    collectFromDeps(lock.dependencies, packages);
  }

  if (lock.name && lock.version) {
    packages.delete(`${lock.name}@${lock.version}`);
  }

  return Array.from(packages.values());
}

async function queryBatch(queries) {
  const response = await fetch(OSV_BATCH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queries }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OSV batch query failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function fetchVulnDetail(id) {
  const response = await fetch(`${OSV_VULN_ENDPOINT}/${id}`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch OSV details for ${id} (${response.status}): ${text}`);
  }

  return response.json();
}

function formatSeverity(detail) {
  if (!detail?.severity?.length) return 'N/A';
  const best = detail.severity
    .map(({ type, score }) => ({ type, score: Number(score) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => b.score - a.score)[0];
  return best ? `${best.type} ${best.score}` : 'N/A';
}

async function main() {
  const lockFile = await loadLockFile();
  const packages = extractPackages(lockFile);

  if (!packages.length) {
    console.log('No packages found in package-lock.json to scan.');
    process.exit(0);
  }

  const queries = packages.map(({ name, version }) => ({
    package: { name, ecosystem: 'npm' },
    version,
  }));

  console.log(`Scanning ${queries.length} npm packages with the OSV batch API...`);

  const batchResult = await queryBatch(queries);
  const results = batchResult.results || [];

  const packagesWithVulns = [];
  const affectedByVuln = new Map();
  const vulnIds = new Set();

  results.forEach((result, index) => {
    const vulns = result?.vulns || [];
    if (!vulns.length) return;

    const pkg = queries[index].package;
    const version = queries[index].version;
    packagesWithVulns.push({ ...pkg, version, vulns });

    vulns.forEach(({ id }) => {
      vulnIds.add(id);
      if (!affectedByVuln.has(id)) affectedByVuln.set(id, new Set());
      affectedByVuln.get(id).add(`${pkg.name}@${version}`);
    });
  });

  if (!packagesWithVulns.length) {
    console.log('✔ No vulnerabilities reported for the scanned packages.');
    return;
  }

  const vulnDetails = new Map();
  for (const id of vulnIds) {
    try {
      vulnDetails.set(id, await fetchVulnDetail(id));
    } catch (error) {
      console.error(error.message);
    }
  }

  console.log(`Found vulnerabilities in ${packagesWithVulns.length} of ${queries.length} packages.`);
  packagesWithVulns.forEach(({ name, version, vulns }) => {
    const highest = vulns
      .map(({ id }) => formatSeverity(vulnDetails.get(id)))
      .find((value) => value !== 'N/A') || 'N/A';
    const ids = vulns.map(({ id }) => id).join(', ');
    console.log(`- ${name}@${version}: ${vulns.length} vulnerability(ies), highest severity ${highest} [${ids}]`);
  });

  console.log('\nDetails:');
  vulnDetails.forEach((detail, id) => {
    const severity = formatSeverity(detail);
    const summary = detail.summary || 'No summary provided.';
    const affected = affectedByVuln.get(id) ? Array.from(affectedByVuln.get(id)).join(', ') : 'unknown';
    console.log(`- ${id} (${severity}) -> affects ${affected}`);
    console.log(`  ${summary}`);
  });
}

main().catch((error) => {
  console.error('OSV scan failed:', error);
  process.exit(1);
});
