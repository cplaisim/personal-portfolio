'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle, useTheme } from './theme';

const GraphCanvas = dynamic(() => import('./graph-canvas'), {
  ssr: false,
  loading: () => <div className="graph-loading" aria-hidden="true" />,
});

// Harmonised against the graph's Education nodes: every row is year, institution,
// award, place, in that order, newest first. Named programmes keep their proper
// capitalisation; a field of study is lower case. US spelling throughout.
const education = [
  {
    id: 'paderborn',
    year: '2026 —',
    school: 'Universität Paderborn',
    award: 'Doctoral research, organizational behavior',
    place: 'Paderborn, Germany',
  },
  {
    id: 'babson',
    year: '2016',
    school: 'Babson College',
    award: 'MBA, F.W. Olin Graduate School of Business',
    place: 'Wellesley, MA',
  },
  {
    id: 'williams',
    year: '2007',
    school: 'Williams College',
    award: 'BA, political science',
    place: 'Williamstown, MA',
  },
];

export default function GraphExperience() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [loadError, setLoadError] = useState(false);
  const { theme, toggle } = useTheme();
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    let active = true;

    fetch('/knowledge-graph.json')
      .then((response) => {
        if (!response.ok) throw new Error('Graph snapshot unavailable');
        return response.json();
      })
      .then((data) => {
        if (active) setGraph(data);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="site-shell">
      <GraphCanvas graph={graph} theme={theme} resetSignal={resetSignal} />
      <div className="graph-wash" aria-hidden="true" />

      <div className="overlay">
        <header className="topbar">
          <a className="wordmark" href="#top" aria-label="Charles Plaisimond home">
            <span className="wordmark-mark">CP</span>
            <span>Charles Plaisimond</span>
          </a>
          <nav aria-label="Main navigation">
            <a href="#about">About</a>
            <Link href="/contact/">Contact</Link>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </nav>
        </header>

        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> PEOPLE / PLACE / ORGANIZATIONS</p>
            <h1>Charles<br />Plaisimond<span className="title-period">.</span></h1>
            <p className="hero-summary">
              Organizational behavior researcher exploring how work, place, and technology shape people.
            </p>
            <div className="hero-links">
              <Link className="text-link" href="/contact/">Get in touch <span aria-hidden="true">↗</span></Link>
              <a className="text-link text-link-muted" href="#about">Read more <span aria-hidden="true">↓</span></a>
            </div>
          </div>

          <p className="graph-hint" aria-live="polite">
            {loadError
              ? 'Graph snapshot not found — run npm run export:graph.'
              : graph.nodes.length
                ? `Drag any of the ${graph.nodes.length} nodes to rearrange the graph.`
                : 'Loading the graph…'}
            {graph.nodes.length > 0 && (
              <button type="button" className="reset-layout" onClick={() => setResetSignal((n) => n + 1)}>
                Reset layout
              </button>
            )}
          </p>
        </section>

        <section className="about-band" id="about">
          <div className="about-inner">
            <div className="about-heading">
              <p className="eyebrow">A SYSTEMS VIEW</p>
              <h2>People are shaped<br />by the places they work.</h2>
            </div>
            <div className="about-copy">
              <p>
                My research sits at the intersection of space, behavior, and technology. I study how AI-infused tools and workplace environments influence human behavior and organizational dynamics.
              </p>
              <div className="about-links">
                <a href="https://www.linkedin.com/in/charlesrplaisimond/" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
                <a href="https://github.com/cplaisim" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
              </div>
            </div>
          </div>
        </section>

        <section className="education-band" id="education">
          <p className="eyebrow">EDUCATION</p>
          <ul className="edu-list">
            {education.map((item) => (
              <li className="edu-item" key={item.id}>
                <span className="edu-year">{item.year}</span>
                <span className="edu-school">{item.school}</span>
                <span className="edu-award">{item.award}</span>
                <span className="edu-place">{item.place}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="site-footer">
          <span>Charles Plaisimond · Research and work, in relation.</span>
          <a href="#top">Back to top ↑</a>
        </footer>
      </div>
    </main>
  );
}
