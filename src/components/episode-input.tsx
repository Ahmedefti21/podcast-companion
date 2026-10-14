"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, FileText, LoaderCircle, Upload } from "lucide-react";
import { Dialog } from "./dialog";
import { LIMITS, type Workspace } from "@/lib/schema";
import { parseTranscript, countWords } from "@/lib/transcript";
import { validateEpisode } from "@/lib/evidence";
import { SAMPLE_TEXT } from "@/lib/sample";

export function EpisodeInput({
  open,
  onClose,
  onGenerated,
  onSample,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (workspace: Workspace) => void;
  onSample: () => void;
}) {
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("transcript.txt");
  const [permission, setPermission] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  function fail(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  async function readFile(file?: File) {
    if (!file || busy) return;
    if (file.size > LIMITS.maxBytes) return fail("Use a text file under 1 MB.");
    if (!/\.(txt|srt|vtt)$/i.test(file.name))
      return fail("Choose a .txt, .srt, or .vtt file. Audio isn't supported yet.");
    try {
      const value = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
      setText(value);
      setFilename(file.name);
      setError("");
    } catch {
      fail(
        "This file could not be read as UTF-8 text. Export it as a text transcript and try again.",
      );
    }
  }
  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    try {
      parseTranscript(text, filename);
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Check your transcript.");
    }
    if (!permission) return fail("Confirm that you have permission to process this transcript.");
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, filename, permission }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(125000)]),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Generation could not finish. Please try again.");
      // Recreate references from the source rather than trusting a client-visible payload.
      const transcript = parseTranscript(text, filename);
      const episode = validateEpisode(data.episode, transcript);
      onGenerated({
        episode,
        transcript,
        rawText: text,
        filename,
        isSample: false,
        warnings: data.warnings ?? [],
      });
      onClose();
    } catch (err) {
      if (controller.signal.aborted)
        setError("Processing was cancelled. Your transcript is still here.");
      else
        fail(
          err instanceof Error && err.name !== "TimeoutError"
            ? err.message
            : "Processing took too long. Your transcript is still here; try a shorter excerpt.",
        );
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (busy) abortRef.current?.abort();
        onClose();
      }}
      title="Start with an episode"
    >
      <form onSubmit={generate} className="input-form">
        <p className="muted">Bring the words. We’ll help you find the ideas worth keeping.</p>
        <div
          className={`upload-zone ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void readFile(e.dataTransfer.files[0]);
          }}
        >
          <Upload size={25} aria-hidden="true" />
          <div>
            <strong>Drop a transcript here</strong>
            <span>.txt, .srt or .vtt · Up to 1 MB</span>
          </div>
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            Browse files
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.srt,.vtt,text/plain"
            hidden
            aria-label="Upload transcript"
            onChange={(e) => {
              void readFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <div className="field-heading">
          <label htmlFor="transcript-input">Or paste your transcript</label>
          <span>{countWords(text).toLocaleString()} / 12,000 words</span>
        </div>
        <textarea
          id="transcript-input"
          value={text}
          disabled={busy}
          maxLength={1_000_000}
          placeholder="Host: What changed the way you think about…"
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          aria-describedby="input-hint input-error"
        />
        <div className="input-details">
          <span id="input-hint">
            <FileText size={14} aria-hidden="true" />
            {filename} · At least 200 words
          </span>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              setText(SAMPLE_TEXT);
              setFilename("small-hours.txt");
              setError("");
            }}
          >
            Use sample text
          </button>
        </div>
        <label className="permission">
          <input
            type="checkbox"
            checked={permission}
            disabled={busy}
            onChange={(e) => setPermission(e.target.checked)}
          />
          <span>
            I have permission to process this content. It contains no sensitive or confidential
            information.
          </span>
        </label>
        <p className="privacy-note">
          Generation sends this text to Google’s Gemini API. Free-tier content may be used to
          improve Google products. Recast keeps your workspace in this tab and does not save
          transcripts to a database. English is the currently tested language.
        </p>
        <p
          id="input-error"
          ref={errorRef}
          tabIndex={-1}
          className={error ? "error-message" : "sr-only"}
          role={error ? "alert" : undefined}
        >
          {error}
        </p>
        {busy && (
          <div className="processing" role="status">
            <LoaderCircle className="spin" size={18} aria-hidden="true" />
            <div>
              <strong>Reading, composing, and checking the source…</strong>
              <span>
                This can take up to two minutes. Your current episode is kept until the new one is
                ready.
              </span>
            </div>
          </div>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              onSample();
              onClose();
            }}
          >
            Explore the sample
          </button>
          {busy ? (
            <button
              type="button"
              className="button secondary"
              onClick={() => abortRef.current?.abort()}
            >
              Cancel processing
            </button>
          ) : (
            <button className="button primary" type="submit">
              Create companion <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
