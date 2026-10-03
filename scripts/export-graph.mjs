import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI || 'bolt://127.0.0.1:17687';
const username = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD;

if (!password) {
  throw new Error('Set NEO4J_PASSWORD in your shell before exporting the graph.');
}

const colors = {
  Person: '#e85e45',
  Role: '#2e83a0',
  Organization: '#d6953c',
  Industry: '#75838a',
  Task: '#89a93d',
  Skill: '#2f8c70',
  Education: '#8368a8',
  Project: '#c16383',
  Location: '#5280a2',
  Certification: '#ad8035',
  Language: '#3e9295',
};

const ringRadius = {
  Person: 0,
  Role: 145,
  Organization: 275,
  Industry: 420,
  Task: 475,
  Skill: 565,
  Education: 330,
  Project: 355,
  Location: 475,
  Certification: 415,
  Language: 390,
};

const width = 1600;
const height = 1200;
const centerX = width / 2;
const centerY = height / 2;

function positionNodes(nodes) {
  const groups = new Map();
  for (const node of nodes) {
    const members = groups.get(node.type) || [];
    members.push(node);
    groups.set(node.type, members);
  }
  const positions = new Map();
  let groupIndex = 0;

  for (const [type, members] of groups) {
    members.forEach((node, index) => {
      const angle = (index / Math.max(members.length, 1)) * Math.PI * 2 + groupIndex * 0.37;
      const radius = (ringRadius[type] || 450) + Math.sqrt(index) * 3;
      const radiusX = radius * 1.1;
      const radiusY = radius * 0.78;
      const position = {
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      };
      Object.assign(node, position);
      positions.set(node.id, position);
    });
    groupIndex += 1;
  }

  return positions;
}

function renderSvg(nodes, links, positions) {
  const lines = links.map((link) => {
    const source = positions.get(link.source);
    const target = positions.get(link.target);
    if (!source || !target) return '';
    return `<line x1="${source.x.toFixed(1)}" y1="${source.y.toFixed(1)}" x2="${target.x.toFixed(1)}" y2="${target.y.toFixed(1)}"/>`;
  }).join('');

  const circles = nodes.map((node) => {
    const position = positions.get(node.id);
    const radius = node.type === 'Person' ? 8 : node.type === 'Role' ? 6 : 4;
    return `<circle cx="${position.x.toFixed(1)}" cy="${position.y.toFixed(1)}" r="${radius}" fill="${colors[node.type] || '#61777a'}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Career knowledge graph network background"><g fill="none" stroke="#57706d" stroke-opacity=".23" stroke-width="1">${lines}</g><g>${circles}</g></svg>`;
}

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
const session = driver.session({ database: process.env.NEO4J_DATABASE || 'neo4j' });

try {
  const nodeResult = await session.run(`
    MATCH (n)
    RETURN elementId(n) AS id,
           labels(n)[0] AS type,
           coalesce(n.name, n.title, n.program, n.text) AS rawLabel,
           n.category AS category,
           n.startRaw AS start,
           n.endRaw AS end,
           n.function AS detail,
           n.linkedinSummary AS summary
    ORDER BY type, rawLabel
  `);

  const nodes = nodeResult.records.map((record) => {
    const type = record.get('type');
    const rawLabel = record.get('rawLabel') || type;
    const label = type === 'Task' && rawLabel.length > 84 ? `${rawLabel.slice(0, 81)}...` : rawLabel;
    return {
      id: record.get('id'),
      type,
      label,
      category: record.get('category'),
      start: record.get('start'),
      end: record.get('end'),
      detail: type === 'Task' ? rawLabel : record.get('detail'),
      summary: record.get('summary'),
    };
  });

  const linkResult = await session.run(`
    MATCH (source)-[relationship]->(target)
    RETURN elementId(source) AS source,
           elementId(target) AS target,
           type(relationship) AS type
    ORDER BY type, source, target
  `);

  const links = linkResult.records.map((record) => ({
    source: record.get('source'),
    target: record.get('target'),
    type: record.get('type'),
  }));

  const positions = positionNodes(nodes);
  const publicDirectory = path.resolve('public');
  await mkdir(publicDirectory, { recursive: true });
  await writeFile(path.join(publicDirectory, 'career-graph.json'), JSON.stringify({ nodes, links }));
  await writeFile(path.join(publicDirectory, 'career-graph.svg'), renderSvg(nodes, links, positions));

  console.log(`Exported ${nodes.length} nodes and ${links.length} relationships.`);
} finally {
  await session.close();
  await driver.close();
}