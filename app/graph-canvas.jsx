'use client';

import ForceGraph2D from 'react-force-graph-2d';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// The exported node `color` is baked for a light page (Person is #1F2937, which
// vanishes on black), so colour is decided here per theme instead. Keyed on
// `group`, which the Cypher sets to Person / Location / Talent / industry name.
const palette = {
  dark: {
    Person: '#F8FAFC',
    Location: '#94A3B8',
    Talent: '#FB923C',
    Academia: '#60A5FA',
    Consulting: '#34D399',
    Finance: '#FBBF24',
    'Real Estate': '#F472B6',
    fallback: '#CBD5E1',
  },
  light: {
    Person: '#0F172A',
    Location: '#475569',
    Talent: '#C2410C',
    Academia: '#1D4ED8',
    Consulting: '#047857',
    Finance: '#B45309',
    'Real Estate': '#BE185D',
    fallback: '#64748B',
  },
};

const ink = {
  dark: { label: '#F1F5F9', halo: 'rgba(2, 6, 23, 0.85)', link: '255, 255, 255', ring: '248, 250, 252' },
  light: { label: '#0F172A', halo: 'rgba(255, 255, 255, 0.9)', link: '15, 23, 42', ring: '15, 23, 42' },
};

// Radius by hierarchy depth, so the eye reads Person > place > org > role > skill.
const radiusByKind = {
  Person: 13,
  State: 9,
  Talent: 9,
  Industry: 6.5,
  Organization: 6,
  Role: 5,
  Skill: 3.6,
  Language: 3.6,
  Certification: 3.6,
};

// Concentric seeding by level. The force sim refines these, but starting on
// rings makes it settle into the hierarchy instead of a hairball.
const ringRadius = [0, 150, 430, 290, 390];

// Below this width the hero covers the whole screen, so the graph is framed
// across the full viewport. Above it, the graph is framed in the right half so
// it sits beside the hero copy instead of behind it.
const WIDE_BREAKPOINT = 900;

function endpointId(endpoint) {
  return typeof endpoint === 'object' && endpoint !== null ? endpoint.id : endpoint;
}

export default function GraphCanvas({ graph, theme = 'dark', showCrossLinks = true, resetSignal = 0, onNodeTap }) {
  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [activeId, setActiveId] = useState(null);
  // Floor for the zoom, recomputed from the laid-out graph. Starts permissive
  // so the first frames are never clamped against a stale value.
  const [minZoom, setMinZoom] = useState(0.02);

  const colors = palette[theme] ?? palette.dark;
  const tone = ink[theme] ?? ink.dark;

  // Memoised so the simulation is not rebuilt when the theme flips - force-graph
  // mutates these objects with x/y/vx/vy and a new array would restart layout.
  const data = useMemo(() => {
    if (!graph.nodes.length) return { nodes: [], links: [] };

    const perLevel = new Map();
    for (const node of graph.nodes) {
      perLevel.set(node.level, (perLevel.get(node.level) || 0) + 1);
    }
    const seen = new Map();

    const nodes = graph.nodes.map((node) => {
      const level = node.level ?? 2;
      const index = seen.get(level) || 0;
      seen.set(level, index + 1);

      const count = perLevel.get(level) || 1;
      const angle = (index / count) * Math.PI * 2 + level * 0.6;
      const r = ringRadius[level] ?? 420;

      const seeded = {
        ...node,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      };
      // Anchor the subject so the whole thing orbits one fixed centre.
      if (level === 0) {
        seeded.fx = 0;
        seeded.fy = 0;
      }
      return seeded;
    });

    return { nodes, links: graph.links.map((link) => ({ ...link })) };
  }, [graph]);

  const visibleLinks = useMemo(
    () => (showCrossLinks ? data.links : data.links.filter((link) => !link.crossLink)),
    [data.links, showCrossLinks],
  );

  const renderData = useMemo(
    () => ({ nodes: data.nodes, links: visibleLinks }),
    [data.nodes, visibleLinks],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Spread the rings out: deeper links sit longer, and charge pushes leaves apart.
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg || !data.nodes.length) return;
    fg.d3Force('charge')?.strength(-170).distanceMax(620);
    fg.d3Force('link')
      ?.distance((link) => {
        if (link.crossLink) return 170;
        const depth = Math.max(endpointOf(link, 'target')?.level ?? 2, 1);
        return 46 + depth * 16;
      })
      .strength((link) => (link.crossLink ? 0.08 : 0.5));
    fg.d3Force('center')?.strength(0.04);
  }, [data.nodes.length]);

  // Gutter the graph keeps from the viewport edge: proportional to the smaller
  // side, clamped so it neither swallows a phone nor looks lost on a monitor.
  const edgeMargin = useMemo(
    () => Math.max(20, Math.min(88, Math.min(size.width, size.height) * 0.07)),
    [size.width, size.height],
  );

  // Zooming out is capped at "the whole graph, plus that margin". Derived from
  // the live node bounds rather than a fixed number, so it stays correct after
  // a resize or after nodes have been dragged outward.
  // Where the laid-out graph should sit: the zoom that fits it, and the graph
  // point to centre on. On wide screens the graph is fitted into the right half
  // and its centre is shifted so it lands in that half's middle.
  const graphFrame = useCallback(() => {
    if (size.width < 2 || size.height < 2) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of data.nodes) {
      if (typeof node.x !== 'number' || typeof node.y !== 'number') continue;
      const r = radiusByKind[node.kind] ?? 4;
      minX = Math.min(minX, node.x - r);
      maxX = Math.max(maxX, node.x + r);
      minY = Math.min(minY, node.y - r);
      maxY = Math.max(maxY, node.y + r);
    }
    if (!Number.isFinite(minX)) return null;

    const wide = size.width >= WIDE_BREAKPOINT;
    const areaWidth = wide ? size.width * 0.5 : size.width;
    const fit = Math.min(
      (areaWidth - edgeMargin * 2) / Math.max(maxX - minX, 1),
      (size.height - edgeMargin * 2) / Math.max(maxY - minY, 1),
    );
    if (!Number.isFinite(fit) || fit <= 0) return null;

    // Centring on a point moves the graph; shift that point so the bounds'
    // centre lands a quarter of the viewport right of the middle.
    const offset = wide ? (size.width * 0.25) / fit : 0;
    return {
      fit,
      cx: (minX + maxX) / 2 - offset,
      cy: (minY + maxY) / 2,
    };
  }, [data.nodes, edgeMargin, size.width, size.height]);

  const recomputeMinZoom = useCallback(() => {
    const fg = graphRef.current;
    const frame = graphFrame();
    if (!fg || !frame) return;

    setMinZoom(frame.fit);
    // Already zoomed out past the new floor: ease back to it.
    if (fg.zoom() < frame.fit) fg.zoom(frame.fit, 260);
  }, [graphFrame]);

  const frameGraph = useCallback(
    (ms) => {
      const fg = graphRef.current;
      const frame = graphFrame();
      if (!fg || !frame) return;
      fg.zoom(frame.fit, ms);
      fg.centerAt(frame.cx, frame.cy, ms);
    },
    [graphFrame],
  );

  // Re-derive the floor whenever the viewport changes size.
  useEffect(() => {
    const id = setTimeout(recomputeMinZoom, 120);
    return () => clearTimeout(id);
  }, [recomputeMinZoom]);

  // Dropped nodes stay pinned, so the visitor needs a way back to the tidy
  // layout. Unpin everything but the anchor and let the simulation re-settle.
  useEffect(() => {
    if (!resetSignal) return;
    const fg = graphRef.current;
    if (!fg) return;
    for (const node of data.nodes) {
      if (node.level === 0) continue;
      node.fx = undefined;
      node.fy = undefined;
    }
    setActiveId(null);
    fg.d3ReheatSimulation?.();
  }, [resetSignal, data.nodes]);

  const neighbours = useMemo(() => {
    if (!activeId) return null;
    const ids = new Set([activeId]);
    for (const link of visibleLinks) {
      const a = endpointId(link.source);
      const b = endpointId(link.target);
      if (a === activeId) ids.add(b);
      if (b === activeId) ids.add(a);
    }
    return ids;
  }, [activeId, visibleLinks]);

  const drawNode = useCallback(
    (node, ctx, globalScale) => {
      const radius = radiusByKind[node.kind] ?? 4;
      const dimmed = neighbours ? !neighbours.has(node.id) : false;
      const isActive = node.id === activeId;

      ctx.save();
      ctx.globalAlpha = dimmed ? 0.18 : 1;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = colors[node.group] ?? colors.fallback;
      ctx.fill();

      // A node the visitor has parked stays pinned; mark it so that reads.
      if (node.fx != null && node.level !== 0) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 3 / globalScale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${tone.ring}, 0.5)`;
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();
      }

      if (isActive) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5 / globalScale, 0, Math.PI * 2);
        ctx.strokeStyle = colors[node.group] ?? colors.fallback;
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      }

      // Anchors are always named; everything else earns a label by being
      // touched, adjacent to what is touched, or zoomed into.
      const alwaysLabel = (node.level ?? 2) <= 1;
      const show = alwaysLabel || isActive || (neighbours && neighbours.has(node.id)) || globalScale > 1.7;

      if (show && !dimmed) {
        const fontSize = Math.max(11 / globalScale, 2.4);
        ctx.font = `600 ${fontSize}px Aptos, "Segoe UI", system-ui, sans-serif`;
        ctx.textBaseline = 'middle';
        const text = node.label ?? '';
        const x = node.x + radius + 4 / globalScale;

        // Halo keeps text readable wherever it lands, on either background.
        ctx.lineWidth = 3 / globalScale;
        ctx.strokeStyle = tone.halo;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, node.y);
        ctx.fillStyle = tone.label;
        ctx.fillText(text, x, node.y);
      }

      ctx.restore();
    },
    [activeId, colors, neighbours, tone],
  );

  // Fingers are imprecise: the hit area is deliberately larger than the dot.
  const paintPointerArea = useCallback((node, color, ctx) => {
    const radius = (radiusByKind[node.kind] ?? 4) + 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const linkStyle = useCallback(
    (link) => {
      if (!neighbours) return `rgba(${tone.link}, ${link.crossLink ? 0.1 : 0.2})`;
      const lit = neighbours.has(endpointId(link.source)) && neighbours.has(endpointId(link.target));
      return `rgba(${tone.link}, ${lit ? 0.5 : 0.05})`;
    },
    [neighbours, tone],
  );

  return (
    <div
      className="graph-canvas"
      ref={containerRef}
      role="img"
      aria-label={`Knowledge graph of Charles Plaisimond's career: ${graph.nodes.length} nodes. Drag the nodes to rearrange them.`}
    >
      {renderData.nodes.length > 0 && (
        <ForceGraph2D
          ref={graphRef}
          graphData={renderData}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeId="id"
          nodeLabel={(node) => `${node.label}${node.period ? ` · ${node.period}` : ''}`}
          nodeCanvasObjectMode={() => 'replace'}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={paintPointerArea}
          linkColor={linkStyle}
          linkWidth={(link) => (link.crossLink ? 0.5 : 0.9)}
          linkLineDash={(link) => (link.crossLink ? [2, 3] : null)}
          enableNodeDrag
          enableZoomInteraction
          enablePanInteraction
          enablePointerInteraction
          onNodeHover={(node) => setActiveId(node?.id ?? null)}
          onNodeClick={(node) => {
            setActiveId(node.id);
            onNodeTap?.(node);
          }}
          onNodeDragEnd={(node) => {
            // Leave it where it was dropped, so rearranging the graph sticks.
            node.fx = node.x;
            node.fy = node.y;
            // Dragging a node outward grows the graph's bounds, which lowers
            // how far out you may zoom.
            recomputeMinZoom();
          }}
          onBackgroundClick={() => setActiveId(null)}
          minZoom={minZoom}
          warmupTicks={60}
          cooldownTicks={140}
          d3AlphaDecay={0.028}
          d3VelocityDecay={0.32}
          onEngineStop={() => {
            frameGraph(600);
            // Let the fit animation land before reading the zoom back.
            setTimeout(recomputeMinZoom, 650);
          }}
        />
      )}
    </div>
  );
}

// Link endpoints are ids before the sim runs and objects after it binds them.
function endpointOf(link, end) {
  const value = link[end];
  return typeof value === 'object' ? value : null;
}
