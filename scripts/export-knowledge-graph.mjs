// Exports the profile knowledge graph (profile_graph_hierarchy.cypher) to
// public/knowledge-graph.json in the {nodes, links} shape react-force-graph wants.
//
// That graph keys every node on `uid` and carries presentation fields directly
// (label, kind, level, group, color), so this script stays a thin passthrough -
// no colour or layout decisions are made here, they belong in the Cypher.
//
//   NEO4J_PASSWORD=... npm run export:graph
//
// Defaults to the profile-graph instance on 17688, NOT the career graph on 17687.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI || 'bolt://127.0.0.1:17688';
const username = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD;

if (!password) {
  throw new Error('Set NEO4J_PASSWORD in your shell before exporting the graph.');
}

// Neo4j returns 64-bit ints as Integer objects; JSON needs plain numbers.
const toPlain = (value) =>
  neo4j.isInt(value) ? value.toNumber() : value;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });

try {
  const nodeResult = await session.run(`
    MATCH (n) WHERE n.uid IS NOT NULL
    RETURN n.uid        AS id,
           n.label      AS label,
           n.kind       AS kind,
           n.level      AS level,
           n.group      AS group,
           n.color      AS color,
           n.period     AS period,
           n.current    AS current,
           n.category   AS category,
           n.proficiency AS proficiency,
           n.short      AS short,
           n.country    AS country,
           n.headline   AS headline,
           n.dataNote   AS dataNote
    ORDER BY n.level, n.kind, n.label
  `);

  const nodes = nodeResult.records.map((record) => {
    const node = {};
    for (const key of record.keys) {
      const value = toPlain(record.get(key));
      if (value !== null && value !== undefined) node[key] = value;
    }
    return node;
  });

  const linkResult = await session.run(`
    MATCH (a)-[r]->(b)
    WHERE a.uid IS NOT NULL AND b.uid IS NOT NULL
    RETURN a.uid AS source, b.uid AS target, type(r) AS type
    ORDER BY type, source, target
  `);

  const links = linkResult.records.map((record) => {
    const type = record.get('type');
    return {
      source: record.get('source'),
      target: record.get('target'),
      type,
      // USED_IN wires a skill back to a role, cutting across the hierarchy.
      // The canvas draws these dashed and lets the UI hide them.
      crossLink: type === 'USED_IN',
    };
  });

  const byLevel = nodes.reduce((acc, n) => {
    acc[n.level] = (acc[n.level] || 0) + 1;
    return acc;
  }, {});

  const publicDirectory = path.resolve('public');
  await mkdir(publicDirectory, { recursive: true });
  await writeFile(
    path.join(publicDirectory, 'knowledge-graph.json'),
    `${JSON.stringify({ nodes, links }, null, 2)}\n`,
  );

  console.log(`Exported ${nodes.length} nodes and ${links.length} links from ${uri}`);
  console.log('nodes per level:', byLevel);
  console.log('cross-links (USED_IN):', links.filter((l) => l.crossLink).length);
} finally {
  await session.close();
  await driver.close();
}
