import React, { useEffect, useRef, useState } from "react";

const github = "https://github.com/tarunkishore2303";
const stages = [
  {
    title: "Ready when you are.",
    detail: "Trace a request. Then take the broker offline and try again.",
    x: 67,
    y: 97,
  },
  {
    title: "01 / Validate the request",
    detail: "The API checks the workflow before accepting any work.",
    x: 150,
    y: 97,
  },
  {
    title: "02 / Commit state + intent",
    detail:
      "Execution state and the outbox event share one database transaction.",
    x: 389,
    y: 97,
  },
  {
    title: "03 / Deliver the event",
    detail: "The relay publishes committed intent to the broker.",
    x: 389,
    y: 226,
  },
  {
    title: "04 / Dispatch the work",
    detail: "The scheduler releases a task whose dependencies are satisfied.",
    x: 150,
    y: 226,
  },
  {
    title: "05 / Record the result",
    detail: "The worker commits the attempt result and its next event intent.",
    x: 150,
    y: 349,
  },
  {
    title: "Work complete. Evidence retained.",
    detail:
      "At-least-once delivery, with explicit duplicate handling. No exactly-once promise.",
    x: 389,
    y: 349,
  },
];

function Arrow({ diagonal = false, className = "" }) {
  return (
    <svg
      className={`arrow ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RequestLab() {
  const [stage, setStage] = useState(0);
  const [offline, setOffline] = useState(false);
  const [running, setRunning] = useState(false);
  const timers = useRef([]);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);
  const stalled = offline && stage === 3;
  function trace() {
    clear();
    setRunning(true);
    setStage(1);
    const last = offline ? 3 : 6;
    for (let step = 2; step <= last; step++) {
      timers.current.push(
        setTimeout(
          () => {
            setStage(step);
            if (step === last) setRunning(false);
          },
          (step - 1) * 650,
        ),
      );
    }
  }
  function toggleBroker() {
    clear();
    if (stalled) {
      setOffline(false);
      setRunning(true);
      for (let step = 4; step <= 6; step++) {
        timers.current.push(
          setTimeout(
            () => {
              setStage(step);
              if (step === 6) setRunning(false);
            },
            (step - 3) * 650,
          ),
        );
      }
      return;
    }
    setRunning(false);
    setOffline((value) => !value);
    setStage(0);
  }
  const current = stages[stage];
  return (
    <figure
      className={`request-lab ${stalled ? "stalled" : ""}`}
      id="request-lab"
    >
      <div className="plate-heading">
        <span className="mono">FIG. 01 / UNDER THE SURFACE</span>
        <span className="model-label">
          <i /> Interactive model
        </span>
      </div>
      <svg
        className="request-diagram"
        viewBox="0 0 540 414"
        role="img"
        aria-labelledby="diagram-title diagram-description"
      >
        <title id="diagram-title">Anatomy of a durable workflow request</title>
        <desc id="diagram-description">
          API to PostgreSQL and outbox, through a relay and Kafka to a scheduler
          and worker. Inspired by Conductor. An explanatory model, not a live
          backend.
        </desc>
        <defs>
          <pattern
            id="dots"
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.7" fill="currentColor" opacity=".18" />
          </pattern>
        </defs>
        <rect width="540" height="414" fill="url(#dots)" />
        <g className="diagram-traces" fill="none" strokeWidth="1.2">
          <path d="M40 97H95m110 0h128M389 128v61M333 226H205M150 260v54M205 349h128" />
          <path
            d="M205 91h66q10 0 10-10V48q0-10 10-10h155q10 0 10 10v187q0 10-10 10h-30"
            className="secondary-trace"
          />
          <path
            d="M95 355H65q-10 0-10-10v-98q0-10 10-10h30"
            className="secondary-trace"
          />
          <path d="m268 93 4 4-4 4m117 54 4 4 4-4m-126 67-4 4 4 4m-121 56 4 4 4-4m114 61 4 4-4 4" />
        </g>
        <text x="40" y="78" className="diagram-micro">
          IN
        </text>
        <text x="244" y="80" className="diagram-micro">
          TRANSACTION
        </text>
        <text x="408" y="164" className="diagram-micro">
          OUTBOX
        </text>
        <text x="232" y="209" className="diagram-micro">
          AT LEAST ONCE
        </text>
        <text x="65" y="294" className="diagram-micro">
          EXECUTE
        </text>
        <text x="239" y="331" className="diagram-micro">
          PERSIST
        </text>
        <g className={`diagram-node ${stage === 1 ? "active" : ""}`}>
          <rect x="95" y="64" width="110" height="66" rx="3" />
          <text x="107" y="83" className="diagram-number">
            01
          </text>
          <text x="150" y="108" textAnchor="middle">
            API
          </text>
        </g>
        <g className={`diagram-node ${stage === 2 ? "active" : ""}`}>
          <path d="M333 77q0-13 56-13t56 13v39q0 14-56 14t-56-14Z" />
          <path d="M333 77q0 13 56 13t56-13" fill="none" />
          <text x="389" y="111" textAnchor="middle">
            PostgreSQL
          </text>
        </g>
        <g
          className={`diagram-node ${stage === 3 ? "active" : ""} ${offline ? "offline" : ""}`}
        >
          <rect x="333" y="193" width="112" height="66" rx="3" />
          <text x="345" y="212" className="diagram-number">
            03
          </text>
          <text x="389" y="237" textAnchor="middle">
            Kafka
          </text>
          {offline && (
            <path d="m423 201 10 10m0-10-10 10" stroke="currentColor" />
          )}
        </g>
        <g className={`diagram-node ${stage === 4 ? "active" : ""}`}>
          <rect x="95" y="193" width="110" height="66" rx="3" />
          <text x="107" y="212" className="diagram-number">
            04
          </text>
          <text x="150" y="237" textAnchor="middle">
            Scheduler
          </text>
        </g>
        <g className={`diagram-node ${stage === 5 ? "active" : ""}`}>
          <rect x="95" y="316" width="110" height="66" rx="3" />
          <text x="107" y="335" className="diagram-number">
            05
          </text>
          <text x="150" y="360" textAnchor="middle">
            Worker
          </text>
        </g>
        <g
          className={`diagram-node result-node ${stage === 6 ? "active" : ""}`}
        >
          <rect x="333" y="316" width="112" height="66" rx="3" />
          <text x="345" y="335" className="diagram-number">
            06
          </text>
          <text x="389" y="360" textAnchor="middle">
            Result
          </text>
        </g>
        <circle
          className="request-packet"
          cx={current.x}
          cy={current.y}
          r="5"
        />
        <g className="diagram-crosses" stroke="currentColor">
          <path d="M16 16h10m-5-5v10m493-5h10m-5-5v10M16 399h10m-5-5v10m493-5h10m-5-5v10" />
        </g>
      </svg>
      <div className="lab-controls">
        <button className="trace-button" onClick={trace} disabled={running}>
          {running
            ? "Tracing request…"
            : stage
              ? "Trace again"
              : "Trace a request"}
          <Arrow />
        </button>
        <button
          className="broker-control"
          onClick={toggleBroker}
          role="switch"
          aria-checked={offline}
          aria-label="Broker offline"
        >
          <span className={`switch-track ${offline ? "on" : ""}`} />
          <span>Broker offline</span>
        </button>
      </div>
      <figcaption className="lab-caption" aria-live="polite" aria-atomic="true">
        <strong>
          {stalled ? "Broker unavailable. Intent survives." : current.title}
        </strong>
        <span>
          {stalled
            ? "The committed outbox row stays in PostgreSQL for a later retry. Restore the broker to deliver this same request."
            : current.detail}
        </span>
      </figcaption>
      <div className="plate-foot mono">
        <span>SIMPLIFIED CONDUCTOR FLOW</span>
        <span>EXPLANATORY · NO LIVE TRAFFIC</span>
      </div>
    </figure>
  );
}

function SectionLabel({ number, children }) {
  return (
    <div className="section-label mono">
      <span className="section-number">{number}</span>
      {children}
    </div>
  );
}

const experience = [
  {
    date: "APR 2026 — PRESENT",
    role: "Software Development Engineer II",
    company: "Rocket India · Mr. Cooper Group",
    kicker: "Platform ownership & modernization",
    points: [
      "Led JDK 25 and Spring Boot 4 modernization across four critical services, with credential hardening across approximately ten production services.",
      "Rightsized AKS workloads across production and UAT, removing 71 over-provisioned pods for approximately $31K in annual savings.",
      "Reviewed 739 pull requests across approximately 69 repositories to enforce architectural standards.",
    ],
  },
  {
    date: "JAN 2024 — MAR 2026",
    role: "Software Engineer",
    company: "Rocket India · Mr. Cooper Group",
    kicker: "Performance at scale",
    points: [
      "Scaled the core servicing API through 4.6× traffic growth to 9M requests per day, while bringing p99 latency to 15ms.",
      "Eliminated an N+1 query to cut database load by approximately 90% and double PATCH throughput.",
      "Removed an O(n²) hot path in heavy loan histories, reducing p99 latency by 24%. Received the Q2 2024 Challenger Award.",
    ],
  },
  {
    date: "JUL 2023 — DEC 2023",
    role: "Software Engineer Trainee",
    company: "Mr. Cooper",
    kicker: "Reactive foundations",
    points: [
      "Built a Spring WebFlux orchestrator for concurrent backend workflows: 3× throughput and 30% lower resource utilization.",
      "Built Nightwatch.js end-to-end automation with 85% test coverage, reducing manual regression effort by 70%.",
      "Delivered a customer-facing originations dashboard with Next.js and TypeScript.",
    ],
  },
];

function ConductorArt() {
  return (
    <div className="conductor-art" aria-hidden="true">
      <span className="mono art-eyebrow">A WORKFLOW, WITH A MEMORY.</span>
      <svg viewBox="0 0 520 280" fill="none">
        <g stroke="currentColor" opacity=".45">
          <path d="M90 140h70l55-66h95l60 66h60M160 140l55 66h95l60-66M260 74v132" />
          <circle cx="90" cy="140" r="24" />
          <circle cx="215" cy="74" r="24" />
          <circle cx="310" cy="74" r="24" />
          <circle cx="215" cy="206" r="24" />
          <circle cx="310" cy="206" r="24" />
          <circle cx="430" cy="140" r="24" />
        </g>
        <g stroke="#f1d4a8" strokeWidth="2">
          <path d="M90 140h70l55-66h95l60 66h60" />
          <circle cx="90" cy="140" r="24" />
          <circle cx="215" cy="74" r="24" />
          <circle cx="310" cy="74" r="24" />
        </g>
        <g fill="#f1d4a8">
          <circle cx="90" cy="140" r="4" />
          <circle cx="215" cy="74" r="4" />
          <circle cx="310" cy="74" r="4" />
        </g>
        <g fill="#e88b63">
          <circle cx="215" cy="206" r="5" />
          <circle cx="310" cy="206" r="5" />
        </g>
        <text x="260" y="147" textAnchor="middle" fill="currentColor">
          DAG
        </text>
        <text
          x="215"
          y="255"
          textAnchor="middle"
          fill="currentColor"
          className="diagram-micro"
        >
          RETRY ≠ FORGET
        </text>
      </svg>
      <div className="art-bottom mono">
        <span>STATE → INTENT → DELIVERY</span>
        <span>01—06</span>
      </div>
    </div>
  );
}

function ForgeArt() {
  return (
    <div className="forge-art" aria-hidden="true">
      <span className="mono art-eyebrow">
        A SMALLER CONTRACT. A CLEARER RESULT.
      </span>
      <div className="forge-papers">
        <div className="forge-paper back-paper">
          <span className="mono">02 / PROPOSAL</span>
          <div className="code-lines">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="forge-paper front-paper">
          <span className="mono">03 / VERIFICATION</span>
          <div className="verification-mark">✓</div>
          <span className="mono">REVIEW → TEST → APPLY</span>
        </div>
      </div>
      <div className="art-bottom mono">
        <span>LOCAL DRAFTING / INDEPENDENT CHECKS</span>
        <span>PYTHON + OLLAMA</span>
      </div>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header wrap">
        <a className="identity" href="#" aria-label="Tarun Kishore, home">
          <span className="monogram">
            t<span>k</span>
            <i />
          </span>
          <span>
            Tarun Kishore
            <span className="identity-role mono">
              SOFTWARE DEVELOPMENT ENGINEER II
            </span>
          </span>
        </a>
        <button
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Close" : "Menu"} <span>{menuOpen ? "−" : "+"}</span>
        </button>
        <nav
          id="navigation"
          className={menuOpen ? "open" : ""}
          aria-label="Main navigation"
        >
          <a href="#experience" onClick={() => setMenuOpen(false)}>
            Experience <sup>01</sup>
          </a>
          <a href="#work" onClick={() => setMenuOpen(false)}>
            Selected work <sup>02</sup>
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            About <sup>03</sup>
          </a>
          <a
            className="nav-contact"
            href="#contact"
            onClick={() => setMenuOpen(false)}
          >
            Let’s talk <Arrow diagonal />
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="hero wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-eyebrow mono">
              <span className="tiny-cross">+</span> BACKEND ENGINEERING /
              DISTRIBUTED SYSTEMS
            </div>
            <h1 id="hero-title">
              The work
              <br />
              behind the
              <br />
              <em>response</em>
              <span className="headline-period" aria-hidden="true" />
            </h1>
            <p className="hero-intro">
              I’m Tarun, an SDE II at Rocket India.
              <br />I build the services, workflows, and cloud infrastructure
              that keep things moving.
            </p>
            <div className="hero-links">
              <a className="primary-link" href="#work">
                Explore the work <Arrow />
              </a>
              <a
                className="text-link"
                href="/Tarun_Kishore_Resume.pdf"
                download
              >
                Résumé <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="hero-location mono">
              <span className="location-dot" /> MADURAI, INDIA{" "}
              <span className="location-divider">/</span> BUILDING SINCE 2023
            </div>
          </div>
          <RequestLab />
        </section>
        <div className="stack-strip wrap">
          <span className="mono strip-label">MY WORKING LANGUAGE</span>
          <div>
            <span>Java</span>
            <i>+</i>
            <span>Spring Boot</span>
            <i>+</i>
            <span>PostgreSQL</span>
            <i>+</i>
            <span>Kafka</span>
            <i>+</i>
            <span>Azure</span>
          </div>
          <span className="mono strip-end">STATE. SCALE. RELIABILITY.</span>
        </div>

        <section
          className="experience-section wrap section-space"
          id="experience"
          aria-labelledby="experience-title"
        >
          <div className="section-top">
            <SectionLabel number="01">IN PRODUCTION</SectionLabel>
            <span className="mono marginal-note">
              ROCKET INDIA / MR. COOPER GROUP
            </span>
          </div>
          <div className="section-heading">
            <h2 id="experience-title">
              Small details.
              <br />
              <em>Real consequences.</em>
            </h2>
            <p>
              A slow query. An oversized deployment. A service that needs to
              handle more. This is where I spend my time.
            </p>
          </div>
          <div className="impact-strip">
            <div>
              <span className="impact-value">
                9<span>M</span>
              </span>
              <p>requests / day</p>
              <span className="mono">CORE SERVICING API</span>
            </div>
            <div>
              <span className="impact-value">
                15<span>ms</span>
              </span>
              <p>p99 latency</p>
              <span className="mono">AFTER 4.6× TRAFFIC GROWTH</span>
            </div>
            <div>
              <span className="impact-value">
                ~$31<span>K</span>
              </span>
              <p>annual infrastructure savings</p>
              <span className="mono">AKS WORKLOAD RIGHTSIZING</span>
            </div>
          </div>
          <p className="metric-note mono">
            SELECTED OUTCOMES FROM MY WORK AT ROCKET INDIA · AS REPORTED IN MY
            RÉSUMÉ
          </p>
          <div className="career-list">
            {experience.map((job, index) => (
              <article className="career-row" key={job.role}>
                <div className="career-date mono">
                  <span
                    className={`timeline-dot ${index === 0 ? "current" : ""}`}
                  />
                  {job.date}
                  {index === 0 && (
                    <span className="promotion-tag">PROMOTED TO SDE II</span>
                  )}
                </div>
                <div className="career-main">
                  <span className="career-kicker mono">{job.kicker}</span>
                  <h3>{job.role}</h3>
                  <p className="career-company">
                    {job.company} <span>· Chennai</span>
                  </p>
                  <ul>
                    {job.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="work-section section-space"
          id="work"
          aria-labelledby="work-title"
        >
          <div className="wrap">
            <div className="section-top">
              <SectionLabel number="02">SELECTED SYSTEMS</SectionLabel>
              <span className="mono marginal-note">
                BUILT TO UNDERSTAND THE HARD PARTS
              </span>
            </div>
            <div className="section-heading">
              <h2 id="work-title">
                Off the clock.
                <br />
                <em>Under the hood.</em>
              </h2>
              <p>
                Personal projects for questions that deserve more than a
                whiteboard answer.
              </p>
            </div>
            <article className="project project-conductor">
              <ConductorArt />
              <div className="project-content">
                <span className="mono project-index">
                  01 / DISTRIBUTED WORKFLOWS
                </span>
                <h3>
                  Conductor
                  <span className="project-version mono">
                    EVOLVED FROM PROJECT LOOM
                  </span>
                </h3>
                <p>
                  A workflow engine for when a worker crashes, an event is
                  delivered twice, or the broker goes away after a database
                  commit.
                </p>
                <div className="project-decision">
                  <span className="mono">ARCHITECTURE DECISION</span>
                  <p>
                    Persist execution state and event intent together. Deliver
                    later through a transactional outbox, with explicit
                    duplicate handling.
                  </p>
                </div>
                <div className="tags">
                  <span>Java</span>
                  <span>Spring Boot</span>
                  <span>Kafka</span>
                  <span>PostgreSQL</span>
                  <span>Redis</span>
                </div>
                <div className="project-links">
                  <a
                    href={`${github}/conductor`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore Conductor <Arrow diagonal />
                  </a>
                  <a
                    href={`${github}/project-loom`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Original Loom <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>
            <article className="project project-forge">
              <ForgeArt />
              <div className="project-content">
                <span className="mono project-index">
                  02 / DEVELOPER TOOLING
                </span>
                <h3>ForgeRelay</h3>
                <p>
                  A local coding workflow that gives small Python tasks to
                  Ollama, then turns the result into a proposal you can inspect
                  and verify.
                </p>
                <div className="project-decision">
                  <span className="mono">ARCHITECTURE DECISION</span>
                  <p>
                    Keep drafting separate from applying. Freeze the source, run
                    independent tests, and check for drift before a change
                    lands.
                  </p>
                </div>
                <div className="tags">
                  <span>Python</span>
                  <span>Ollama</span>
                  <span>Independent tests</span>
                  <span>Source snapshots</span>
                </div>
                <div className="project-links">
                  <a
                    href={`${github}/ForgeRelay`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore ForgeRelay <Arrow diagonal />
                  </a>
                </div>
              </div>
            </article>
            <div className="work-end mono">
              <span>SMALL SCOPE. VISIBLE TRADE-OFFS. SOURCE INCLUDED.</span>
              <a href={github} target="_blank" rel="noreferrer">
                ALL REPOSITORIES <Arrow diagonal />
              </a>
            </div>
          </div>
        </section>

        <section
          className="about-section wrap section-space"
          id="about"
          aria-labelledby="about-title"
        >
          <SectionLabel number="03">THE ENGINEER BEHIND IT</SectionLabel>
          <div className="about-grid">
            <div>
              <h2 id="about-title">
                Curious about
                <br />
                <em>what happens next.</em>
              </h2>
              <p className="about-lead">
                What happens after the API returns? When the queue fills up?
                When the happy path stops being happy?
              </p>
              <p>
                I’m a backend-focused software engineer with three years of
                experience building cloud-native systems. My work spans Java
                services, reactive orchestration, performance tuning, and
                Microsoft Azure.
              </p>
              <p>
                I care about understanding a system end to end: how it behaves,
                where it breaks, and what evidence it leaves behind. I also
                build with React and Next.js when the system needs a
                human-facing surface.
              </p>
              <a
                className="inline-link"
                href="/Tarun_Kishore_Resume.pdf"
                download
              >
                Read the full résumé <Arrow diagonal />
              </a>
            </div>
            <div className="toolbox">
              <div className="toolbox-heading mono">
                <span>TOOLS OF THE TRADE</span>
                <span>APPLIED IN PRACTICE.</span>
              </div>
              <dl>
                <div>
                  <dt>Services & communication</dt>
                  <dd>
                    Java · Spring Boot · WebFlux
                    <br />
                    REST · gRPC · Apache Kafka
                  </dd>
                </div>
                <div>
                  <dt>State & search</dt>
                  <dd>
                    PostgreSQL · MySQL · MongoDB
                    <br />
                    Redis · Elasticsearch
                  </dd>
                </div>
                <div>
                  <dt>Infrastructure & delivery</dt>
                  <dd>
                    Microsoft Azure · Docker · Kubernetes
                    <br />
                    Azure Pipelines · Infrastructure as Code
                  </dd>
                </div>
                <div>
                  <dt>Confidence in the change</dt>
                  <dd>
                    JUnit · Mockito · Testcontainers
                    <br />
                    Gradle · Maven · Git
                  </dd>
                </div>
              </dl>
              <div className="education">
                <span className="mono">FOUNDATIONS</span>
                <p>
                  B.Tech, Information Technology
                  <br />
                  <strong>Thiagarajar College of Engineering</strong>
                  <br />
                  <span>2023 · CGPA 8.8 / 10</span>
                </p>
                <span className="certifications mono">
                  MICROSOFT AZ-900 + AI-900
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="contact-section"
          id="contact"
          aria-labelledby="contact-title"
        >
          <div className="wrap">
            <div className="contact-top mono">
              <span>
                <i /> CONNECTIONS START HERE
              </span>
              <span>04 / NEXT REQUEST</span>
            </div>
            <div className="contact-main">
              <h2 id="contact-title">
                Have something
                <br />
                <em>worth building?</em>
              </h2>
              <a
                className="contact-arrow"
                href="mailto:tarunksu30@gmail.com"
                aria-label="Email Tarun Kishore"
              >
                <Arrow diagonal />
              </a>
            </div>
            <a className="email-link" href="mailto:tarunksu30@gmail.com">
              tarunksu30@gmail.com <Arrow diagonal />
            </a>
            <div className="contact-bottom">
              <p>
                Systems, teams, or a particularly interesting problem.
                <br />
                I’d like to hear about it.
              </p>
              <a href={github} target="_blank" rel="noreferrer">
                GitHub <Arrow diagonal />
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer wrap mono">
        <span>© {new Date().getFullYear()} TARUN KISHORE</span>
        <span>STATE. SCALE. RELIABILITY.</span>
        <a href="#">BACK TO THE SURFACE ↑</a>
      </footer>
    </>
  );
}

export default App;
