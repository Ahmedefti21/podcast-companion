"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleHelp, RotateCcw } from "lucide-react";
import type { Episode, Transcript } from "@/lib/schema";
import { chapterSourceIds } from "@/lib/evidence";

export type Answer = { choice: number; confident: boolean; checked: boolean };
export function Practice({
  episode,
  transcript,
  answers,
  onAnswer,
  onEvidence,
  onReset,
}: {
  episode: Episode;
  transcript: Transcript;
  answers: Record<string, Answer>;
  onAnswer: (id: string, answer: Answer) => void;
  onEvidence: (ids: string[], title: string) => void;
  onReset: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [reviewOnly, setReviewOnly] = useState(false);
  const question = episode.quiz[index];
  const answer = answers[question.id];
  const checked = episode.quiz.filter((q) => answers[q.id]?.checked);
  const correct = checked.filter((q) => answers[q.id].choice === q.correctIndex);
  const missed = checked.filter((q) => answers[q.id].choice !== q.correctIndex);
  const confidentMisses = missed.filter((q) => answers[q.id].confident);
  const complete = checked.length === episode.quiz.length;
  const reviewChapters = episode.chapters.filter((c) =>
    missed.some((q) => q.sourceIds.some((id) => chapterSourceIds(c, transcript).includes(id))),
  );

  return (
    <section className="practice-section" aria-label="Recall practice">
      <div className="section-heading">
        <div>
          <h2>A little recall goes a long way.</h2>
          <p>Try it from memory. Then follow the evidence.</p>
        </div>
        <span className="pill">
          {checked.length} of {episode.quiz.length} checked
        </span>
      </div>
      <div className="recall-track" aria-label="Question progress">
        {episode.quiz.map((q, i) => {
          const a = answers[q.id];
          return (
            <button
              key={q.id}
              className={`recall-step ${i === index ? "current" : ""} ${a?.checked ? (a.choice === q.correctIndex ? "correct" : "missed") : ""}`}
              aria-label={`Question ${i + 1}${a?.checked ? (a.choice === q.correctIndex ? ", correct" : ", needs review") : ""}`}
              aria-current={i === index ? "step" : undefined}
              onClick={() => {
                setIndex(i);
                setReviewOnly(false);
              }}
            >
              {a?.checked && a.choice === q.correctIndex ? (
                <Check size={17} aria-hidden="true" />
              ) : (
                i + 1
              )}
            </button>
          );
        })}
      </div>
      {!reviewOnly && (
        <div className="question-panel">
          <span className="question-number">Question {index + 1}</span>
          <h3>{question.prompt}</h3>
          <fieldset className="choices" disabled={answer?.checked}>
            <legend className="sr-only">Choose one answer</legend>
            {question.choices.map((choice, i) => (
              <label
                key={i}
                className={`choice ${answer?.choice === i ? "selected" : ""} ${answer?.checked && i === question.correctIndex ? "answer-correct" : ""} ${answer?.checked && answer.choice === i && i !== question.correctIndex ? "answer-wrong" : ""}`}
              >
                <input
                  type="radio"
                  name={`answer-${question.id}`}
                  checked={answer?.choice === i}
                  onChange={() =>
                    onAnswer(question.id, {
                      choice: i,
                      confident: answer?.confident ?? false,
                      checked: false,
                    })
                  }
                />
                <span className="choice-letter" aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{choice}</span>
                {answer?.checked && i === question.correctIndex && (
                  <Check size={18} aria-hidden="true" />
                )}
              </label>
            ))}
          </fieldset>
          {!answer?.checked ? (
            <div className="check-row">
              <label className="confidence">
                <input
                  type="checkbox"
                  checked={answer?.confident ?? false}
                  disabled={!answer || answer.choice < 0}
                  onChange={(e) =>
                    onAnswer(question.id, {
                      choice: answer?.choice ?? -1,
                      confident: e.target.checked,
                      checked: false,
                    })
                  }
                />
                <span>I’m confident in this answer</span>
              </label>
              <button
                className="button primary"
                disabled={!answer || answer.choice < 0}
                onClick={() => onAnswer(question.id, { ...answer!, checked: true })}
              >
                Check answer
              </button>
            </div>
          ) : (
            <div
              className={`answer-feedback ${answer.choice === question.correctIndex ? "success" : "review"}`}
              role="status"
            >
              <strong>
                {answer.choice === question.correctIndex ? "That’s it." : "Worth a second look."}
              </strong>
              <p>{question.explanation}</p>
              <button
                className="text-button"
                onClick={() => onEvidence(question.sourceIds, "The answer, in context")}
              >
                Read the supporting passage <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="question-navigation">
            <button
              className="button secondary"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              <ArrowLeft size={16} aria-hidden="true" /> Previous
            </button>
            <button
              className="button secondary"
              disabled={index === episode.quiz.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              Next question <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      {complete && (
        <div className="practice-results" aria-live="polite">
          <div className="result-score">
            {correct.length}
            <span>/{episode.quiz.length}</span>
          </div>
          <div>
            <h3>{missed.length ? "Now you know what to revisit." : "Those ideas are sticking."}</h3>
            <p>
              {missed.length
                ? `${missed.length} question${missed.length === 1 ? " needs" : "s need"} another look.`
                : "You answered every question correctly. You can still explore the source behind each answer."}
              {confidentMisses.length > 0 &&
                ` ${confidentMisses.length} ${confidentMisses.length === 1 ? "was" : "were"} marked confident—a useful place to start.`}
            </p>
            <div className="button-row">
              {missed.length > 0 && (
                <button className="button primary" onClick={() => setReviewOnly(!reviewOnly)}>
                  {reviewOnly ? "Back to questions" : "Review what I missed"}
                </button>
              )}
              <button
                className="text-button"
                onClick={() => {
                  onReset();
                  setIndex(0);
                  setReviewOnly(false);
                }}
              >
                <RotateCcw size={15} aria-hidden="true" /> Try again
              </button>
            </div>
          </div>
        </div>
      )}
      {reviewOnly && (
        <div className="review-list">
          <h3>Your return path</h3>
          <p className="muted">These chapters contain the evidence for the questions you missed.</p>
          {reviewChapters.map((chapter) => (
            <button
              className="review-chapter"
              key={chapter.id}
              onClick={() => onEvidence(chapterSourceIds(chapter, transcript), chapter.title)}
            >
              <CircleHelp size={20} aria-hidden="true" />
              <span>
                <strong>{chapter.title}</strong>
                <small>{chapter.description}</small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
