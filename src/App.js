import React from 'react';
import './App.css';

const projects = [
  {
    title: "Materalle",
    description: "RAG chatbot used in the context of a daycare to assist in training, compliance and development.",
    tech: "Python, React, AWS, Docker, PostgreSQL",
    link: "https://www.materalle.com"
  },

  {
    title: "Materreal",
    link: "https://www.materreal.com",
    description: "Consulting services assisting providers in the deployment of AI to assist in training, compliance and development.",
    tech: "Django, Python, React, AWS",
    
  },

  {
    title: "Happy Caterpillars", 
    description: "A licensed home-based group family daycare.", 
    tech: "square space, google workspace",
    link: "https://www.happycaterpillars.com"
  }
];

function App() {
  return (
    <div className="container">
      <header className="header">
        <h1>Dr. Charles Plaisimond </h1>
        <p className="title"> Organizational Behavior Phd Candidate| Research Scientist</p>
        <div className="contact">
          <a href="mailto:charles.plaisimond@gmail.com">Email</a> | 
          <a href="https://www.linkedin.com/in/charlesrplaisimond/">LinkedIn</a> |
          <a href="https://github.com/cplaisim">GitHub</a>
        </div>
      </header>

      <section className="about">
        <h2>About</h2>
        <p>
          My research lies at the intersection of space, behavior and technology, focusing on how AI infused technologies influence human behavior and organizational dynamics.
        </p>
      </section>

      <section className="education">
        <h2>Education</h2>
        <div className="degree">
          <h3>PhD in Organizational Behavior</h3>
          <p> TBD| 2031</p>
          <p>Dissertation: "Your Dissertation Title"</p>
          <p>Babson College | 2016</p>
          <p>HEC Paris Exchange | 2015 </p>
          <p>Dartmouth Tuck Business Bridge Program | 2007</p>
          <p>Williams College | 2007</p>
        </div>
      </section>

      <section className="projects">
        <h2>Research & Projects</h2>
        {projects.map((project, index) => (
          <div key={index} className="project">
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <span className="tech">{project.tech}</span>
          </div>
        ))}
      </section>

      <section className="publications">
        <h2>Publications</h2>
        <ul>
          <li>"Publication Title" - Journal Name (2023)</li>
          <li>"Conference Paper Title" - Conference Name (2024)</li>
        </ul>
      </section>
    </div>
  );
}

export default App;