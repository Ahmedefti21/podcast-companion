"use client";

import { useId, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Copy,
  FileText,
  Layers3,
  List,
  LoaderCircle,
  Plus,
  Quote,
  RotateCcw,
  Scissors,
  Sparkles,
  X,
} from "lucide-react";
import { Dialog } from "./dialog";
import { EpisodeInput } from "./episode-input";
import { Practice, type Answer } from "./practice";
import { sampleWorkspace, sampleRevision } from "@/lib/sample";
import { type Claim, type RevisionMode, type Workspace, overviewSchema } from "@/lib/schema";
import { chapterSourceIds, validateOverview } from "@/lib/evidence";
import { sourceLabel, countWords } from "@/lib/transcript";
import { exportMarkdown } from "@/lib/export";

type View = "overview" | "chapters" | "practice" | "transcript";
const NAV = [
  { id: "overview" as const, title: "Overview", icon: Layers3 },
  { id: "chapters" as const, title: "Chapters", icon: List },
  { id: "practice" as const, title: "Practice", icon: BookOpen },
  { id: "transcript" as const, title: "Transcript", icon: FileText },
];

function Mark() {
  return (
    <svg width="31" height="31" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M6 20V12a5 5 0 0 1 10 0v8a5 5 0 0 0 10 0v-8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M6 25v-1M26 8V7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
function Cover() {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 160 160" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e9d7fa" />
          <stop offset=".55" stopColor="#f6d6d7" />
          <stop offset="1" stopColor="#ffb77d" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="28" fill={`url(#${gradientId})`} />
      <circle cx="80" cy="79" r="55" stroke="#684294" strokeOpacity=".5" />
      <circle cx="80" cy="79" r="43" stroke="#684294" strokeOpacity=".5" />
      <circle cx="80" cy="79" r="31" stroke="#684294" strokeOpacity=".5" />
      <path
        d="M42 97V67a19 19 0 0 1 38 0v26a19 19 0 0 0 38 0V63"
        stroke="#513565"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <circle cx="118" cy="49" r="6.5" fill="#513565" />
      <circle cx="42" cy="112" r="6.5" fill="#513565" />
    </svg>
  );
}

export function WorkspaceApp() {
  const [workspace, setWorkspace] = useState<Workspace>(sampleWorkspace);
  const [view, setView] = useState<View>("overview");
  const [inputOpen, setInputOpen] = useState(false);
  const [evidence, setEvidence] = useState<{ ids: string[]; title: string } | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [revision, setRevision] = useState<RevisionMode | null>(null);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [previousOpen, setPreviousOpen] = useState(false);
  const { episode, transcript } = workspace;
  const checked = Object.values(answers).filter((a) => a.checked).length;

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function load(next: Workspace) {
    setWorkspace(next);
    setView("overview");
    setAnswers({});
    setSearch("");
    setError("");
    setRevisionMessage("");
    setEvidence(null);
    setToast("");
  }
  function notify(message: string) {
    setToast(message);
  }
  function showEvidence(ids: string[], title = "Behind the insight") {
    setEvidence({ ids, title });
  }
  async function revise(mode: RevisionMode) {
    if (revision) return;
    setRevision(mode);
    setError("");
    setRevisionMessage("");
    try {
      let overview;
      if (workspace.isSample) overview = sampleRevision(mode);
      else {
        const response = await fetch("/api/revise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: workspace.rawText,
            filename: workspace.filename,
            overview: episode.overview,
            mode,
          }),
          signal: AbortSignal.timeout(125000),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || "The revision could not finish. Your previous version is kept.",
          );
        overview = overviewSchema.parse(data.overview);
        validateOverview(overview, transcript);
      }
      setWorkspace((current) => ({
        ...current,
        previousOverview: current.episode.overview,
        episode: { ...current.episode, overview },
      }));
      setRevisionMessage(
        `${workspace.isSample ? "Sample edit" : "Overview revised"}: ${mode === "shorter" ? "a shorter read" : "simpler language"}. Chapters and practice are unchanged.`,
      );
    } catch (err) {
      setError(
        err instanceof Error && err.name !== "TimeoutError"
          ? err.message
          : "The revision timed out. Your previous version is kept.",
      );
    } finally {
      setRevision(null);
    }
  }
  function undo() {
    if (!workspace.previousOverview) return;
    setWorkspace((current) => ({
      ...current,
      episode: { ...current.episode, overview: current.previousOverview! },
      previousOverview: undefined,
    }));
    setRevisionMessage("Previous overview restored.");
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(exportMarkdown(workspace));
      notify("Study guide copied to clipboard.");
    } catch {
      notify("Clipboard access is unavailable. Use Download instead.");
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([exportMarkdown(workspace)], { type: "text/markdown;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${
      episode.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 70) || "episode"
    }-study-guide.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Study guide downloaded.");
  }
  const citation = (claim: Claim) => (
    <button className="source-link" onClick={() => showEvidence(claim.sourceIds)}>
      <Quote size={12} aria-hidden="true" />
      {sourceLabel(claim.sourceIds, transcript)}
      <ArrowUpRight size={12} aria-hidden="true" />
    </button>
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to episode
      </a>
      <aside className="sidebar">
        <button
          className="wordmark"
          onClick={() => navigate("overview")}
          aria-label="Recast overview"
        >
          <Mark />
          <span>
            recast<span className="wordmark-dot">.</span>
          </span>
        </button>
        <div className="sidebar-workspace-label">Your workspace</div>
        <nav aria-label="Episode navigation">
          {NAV.map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              aria-current={view === id ? "page" : undefined}
              aria-label={title}
              title={title}
              onClick={() => navigate(id)}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{title}</span>
              {id === "practice" && <span className="nav-count">{episode.quiz.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-episode">
          <div className="tiny-cover">
            <Cover />
          </div>
          <span>
            <small>On your desk</small>
            <strong>{episode.title}</strong>
          </span>
        </div>
        <div className="sidebar-footer">
          <div className="little-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p>
            Keep the ideas.
            <br />
            Come back to the source.
          </p>
          <span className="sidebar-footnote">A companion for curious minds.</span>
        </div>
      </aside>
      <div className="workspace-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>{NAV.find((n) => n.id === view)?.title}</strong>
          </div>
          <div className="top-actions">
            <span className="session-label">
              <span /> In this tab
            </span>
            <button
              className="button primary new-episode"
              disabled={Boolean(revision)}
              onClick={() => setInputOpen(true)}
            >
              <Plus size={17} aria-hidden="true" /> New episode
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <div className="episode-heading">
            <div className="episode-title-block">
              <div className="episode-meta">
                <span className="episode-type">
                  {workspace.isSample ? "The sample session" : "Your episode"}
                </span>
                <span className="meta-dot" />
                {transcript.wordCount.toLocaleString()} words
                <span className="meta-dot" />
                {episode.chapters.length} chapters
              </div>
              <h1>{episode.title}</h1>
              <p className="episode-subtitle">Give good ideas a second listen.</p>
              <div className="theme-row">
                {episode.themes.map((theme) => (
                  <span key={theme}>{theme}</span>
                ))}
              </div>
            </div>
            <div className="episode-cover">
              <Cover />
              <span>{workspace.isSample ? "Small Hours" : "Your companion"}</span>
            </div>
          </div>
          <div className="episode-toolbar">
            <p>
              <CheckCheck size={16} aria-hidden="true" />
              {workspace.isSample
                ? "Original sample · editorial preview"
                : "AI-generated · inspect the source"}
            </p>
            <div>
              <button className="toolbar-button" onClick={copy}>
                <Copy size={15} aria-hidden="true" /> Copy
              </button>
              <button className="toolbar-button" onClick={download}>
                <ArrowDownToLine size={15} aria-hidden="true" /> Download
              </button>
            </div>
          </div>
          {workspace.isSample && (
            <div className="sample-note">
              <span>
                This is a sample you can explore. Start a new episode to generate your own.
              </span>
              <button onClick={() => setInputOpen(true)} disabled={Boolean(revision)}>
                Try your transcript <ArrowUpRight size={14} aria-hidden="true" />
              </button>
            </div>
          )}
          {workspace.warnings.map((warning) => (
            <p className="warning-message" key={warning}>
              {warning}
            </p>
          ))}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <div className="view-content" key={view}>
            {view === "overview" && (
              <>
                <section className="chapter-ribbon" aria-label="Episode chapters">
                  {episode.chapters.map((chapter, i) => (
                    <button
                      key={chapter.id}
                      onClick={() =>
                        showEvidence(chapterSourceIds(chapter, transcript), chapter.title)
                      }
                    >
                      <span className="chapter-position">{String(i + 1).padStart(2, "0")}</span>
                      <span className="chapter-ribbon-title">
                        {chapter.title}
                        <small>{sourceLabel([chapter.startId], transcript)}</small>
                      </span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </button>
                  ))}
                </section>
                <div className="overview-grid">
                  <section className="overview-panel">
                    <div className="panel-heading">
                      <span className="section-icon">
                        <Layers3 size={19} aria-hidden="true" />
                      </span>
                      <h2>The episode, distilled.</h2>
                      <span className="reading-time">
                        {Math.max(
                          1,
                          Math.ceil(
                            countWords(episode.overview.summary.map((c) => c.text).join(" ")) / 220,
                          ),
                        )}{" "}
                        min read
                      </span>
                    </div>
                    <div className="summary-text">
                      {episode.overview.summary.map((claim, i) => (
                        <div key={i}>
                          <p>{claim.text}</p>
                          {citation(claim)}
                        </div>
                      ))}
                    </div>
                    <div className="revision-box">
                      <div>
                        <Sparkles size={16} aria-hidden="true" />
                        <span>Make it click for you</span>
                      </div>
                      <div className="revision-actions">
                        <button
                          className="button secondary"
                          disabled={Boolean(revision)}
                          onClick={() => revise("shorter")}
                        >
                          {revision === "shorter" ? (
                            <LoaderCircle className="spin" size={15} aria-hidden="true" />
                          ) : (
                            <Scissors size={15} aria-hidden="true" />
                          )}{" "}
                          Make shorter
                        </button>
                        <button
                          className="button secondary"
                          disabled={Boolean(revision)}
                          onClick={() => revise("simpler")}
                        >
                          {revision === "simpler" ? (
                            <LoaderCircle className="spin" size={15} aria-hidden="true" />
                          ) : (
                            <Sparkles size={15} aria-hidden="true" />
                          )}{" "}
                          Explain simply
                        </button>
                      </div>
                      {workspace.isSample && (
                        <small>
                          Sample edits are prewritten examples. Your own episodes use AI.
                        </small>
                      )}
                    </div>
                    {revisionMessage && (
                      <div className="revision-result" role="status">
                        <Check size={16} aria-hidden="true" />
                        <span>{revisionMessage}</span>
                        {workspace.previousOverview && (
                          <div>
                            <button className="text-button" onClick={() => setPreviousOpen(true)}>
                              Compare
                            </button>
                            <button
                              className="text-button"
                              disabled={Boolean(revision)}
                              onClick={undo}
                            >
                              <RotateCcw size={14} aria-hidden="true" />
                              Undo
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                  <section className="takeaways-panel">
                    <div className="panel-heading">
                      <h2>Worth keeping</h2>
                      <span className="small-count">{episode.overview.takeaways.length}</span>
                    </div>
                    <p className="panel-description">A few ideas to take with you.</p>
                    <div className="takeaway-list">
                      {episode.overview.takeaways.map((claim, i) => (
                        <div className="takeaway" key={i}>
                          <span className="takeaway-mark" aria-hidden="true">
                            <Check size={14} />
                          </span>
                          <div>
                            <p>{claim.text}</p>
                            {citation(claim)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
                <section className="practice-invitation">
                  <div className="practice-art" aria-hidden="true">
                    <BookOpen size={30} strokeWidth={1.3} />
                    <span>?</span>
                  </div>
                  <div>
                    <span className="small-label">From listening to learning</span>
                    <h2>What stayed with you?</h2>
                    <p>{episode.quiz.length} questions. A chance to connect the dots.</p>
                  </div>
                  <button className="button primary" onClick={() => navigate("practice")}>
                    {checked ? "Continue practice" : "Try a little recall"}
                    <ArrowRight size={17} aria-hidden="true" />
                  </button>
                </section>
              </>
            )}

            {view === "chapters" && (
              <section className="chapters-section">
                <div className="section-heading">
                  <div>
                    <h2>Find your way through.</h2>
                    <p>
                      {transcript.timed
                        ? "Timestamps come from your subtitle file."
                        : "No timestamps were supplied. Navigate by source passage instead."}
                    </p>
                  </div>
                </div>
                <div className="chapter-list">
                  {episode.chapters.map((chapter, i) => (
                    <button
                      className="chapter-card"
                      key={chapter.id}
                      onClick={() =>
                        showEvidence(chapterSourceIds(chapter, transcript), chapter.title)
                      }
                    >
                      <span className="chapter-index">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <small>{sourceLabel([chapter.startId], transcript)}</small>
                        <h3>{chapter.title}</h3>
                        <p>{chapter.description}</p>
                      </div>
                      <ArrowUpRight size={22} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            )}
            {view === "practice" && (
              <Practice
                key={workspace.rawText}
                episode={episode}
                transcript={transcript}
                answers={answers}
                onAnswer={(id, answer) => setAnswers((old) => ({ ...old, [id]: answer }))}
                onReset={() => setAnswers({})}
                onEvidence={showEvidence}
              />
            )}
            {view === "transcript" && (
              <section className="transcript-section">
                <div className="section-heading">
                  <div>
                    <h2>The original words.</h2>
                    <p>
                      {workspace.isSample
                        ? "An original fictional conversation written for this demo."
                        : "The supplied source, with stable passage references."}
                    </p>
                  </div>
                </div>
                <label className="search-field">
                  <span>Find in transcript</span>
                  <input
                    type="search"
                    placeholder="Search a word or phrase…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <div className="transcript-passages">
                  {transcript.segments
                    .filter((s) => !search || s.text.toLowerCase().includes(search.toLowerCase()))
                    .map((segment) => (
                      <article className="transcript-passage" key={segment.id}>
                        <button
                          className="source-link"
                          onClick={() => showEvidence([segment.id], "Original passage")}
                        >
                          {sourceLabel([segment.id], transcript)}
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </button>
                        <p>{segment.text}</p>
                      </article>
                    ))}
                  {!transcript.segments.some((s) =>
                    s.text.toLowerCase().includes(search.toLowerCase()),
                  ) && (
                    <p className="empty-state">
                      No passages match “{search}”. Try a different word.
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
          <footer className="workspace-footer">
            <span>
              <Mark /> Made for the moments worth remembering.
            </span>
            <span>Interpretations deserve a source.</span>
          </footer>
        </main>
      </div>
      <EpisodeInput
        open={inputOpen}
        onClose={() => setInputOpen(false)}
        onGenerated={load}
        onSample={() => load(sampleWorkspace())}
      />
      <Dialog
        open={Boolean(evidence)}
        onClose={() => setEvidence(null)}
        title={evidence?.title ?? "Source evidence"}
        side
      >
        <div className="evidence-content">
          <span className="evidence-kicker">
            <Quote size={15} aria-hidden="true" /> From the original transcript
          </span>
          <p className="muted">
            Read the passage and decide whether it supports the interpretation.
          </p>
          {transcript.segments
            .filter((s) => evidence?.ids.includes(s.id))
            .map((segment) => (
              <article className="evidence-passage" key={segment.id}>
                <span>{sourceLabel([segment.id], transcript)}</span>
                <p>{segment.text}</p>
              </article>
            ))}
          <p className="evidence-footnote">
            {transcript.timed
              ? "Times are supplied by the subtitle file, not generated by AI."
              : "This transcript has no timing information. Passage references identify the source without estimating timestamps."}
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setEvidence(null);
              navigate("transcript");
            }}
          >
            Open full transcript <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Dialog>
      <Dialog open={previousOpen} onClose={() => setPreviousOpen(false)} title="What changed">
        <div className="comparison">
          <section>
            <h3>Before</h3>
            {workspace.previousOverview?.summary.map((c, i) => (
              <p key={i}>{c.text}</p>
            ))}
          </section>
          <section>
            <h3>Now</h3>
            {episode.overview.summary.map((c, i) => (
              <p key={i}>{c.text}</p>
            ))}
          </section>
          <p className="muted">
            Only the overview changed. Your chapters and quiz progress are kept.
          </p>
        </div>
      </Dialog>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} aria-hidden="true" />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
