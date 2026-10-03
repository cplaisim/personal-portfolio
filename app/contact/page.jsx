'use client';

import Link from 'next/link';
import { ThemeToggle, useTheme } from '../theme';

export default function ContactPage() {
  const { theme, toggle } = useTheme();

  return (
    <main className="contact-shell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Charles Plaisimond home">
          <span className="wordmark-mark">CP</span>
          <span>Charles Plaisimond</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/#about">About</Link>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </nav>
      </header>

      <section className="contact-main">
        <div className="contact-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> CONTACT</p>
          <h1>Let&rsquo;s talk<span className="title-period">.</span></h1>
          <p className="contact-summary">
            I&rsquo;m always glad to hear from researchers, practitioners, and teams thinking about
            how place and technology shape the way people work.
          </p>

          <ul className="contact-list">
            <li>
              <span className="contact-label">Email</span>
              <a className="contact-value" href="mailto:charles.plaisimond@gmail.com">
                charles.plaisimond@gmail.com
              </a>
            </li>
            <li>
              <span className="contact-label">LinkedIn</span>
              <a
                className="contact-value"
                href="https://www.linkedin.com/in/charlesrplaisimond/"
                target="_blank"
                rel="noreferrer"
              >
                charlesrplaisimond <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <span className="contact-label">GitHub</span>
              <a className="contact-value" href="https://github.com/cplaisim" target="_blank" rel="noreferrer">
                cplaisim <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <span className="contact-label">Based in</span>
              <span className="contact-value">Lippstadt, Germany</span>
            </li>
          </ul>
        </div>

        {/* Anchored to the lower-right corner; becomes a normal block on narrow
            screens so it never crowds the contact details. */}
        <figure className="contact-portrait">
          <img
            src="/charles-plaisimond.jpg"
            alt="Charles Plaisimond in conversation with a colleague, gesturing while explaining an idea."
            width={1400}
            height={934}
            loading="lazy"
            decoding="async"
          />
        </figure>
      </section>

      <footer className="site-footer">
        <span>Charles Plaisimond · Research and work, in relation.</span>
        <Link href="/">Back to the graph ↑</Link>
      </footer>
    </main>
  );
}
