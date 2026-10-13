import { type Episode, type Overview, type RevisionMode, type Workspace } from "./schema";
import { parseTranscript } from "./transcript";

// Original fictional transcript and editorial examples, authored for this project.
// No fabricated playback times: this sample is intentionally untimed.
export const SAMPLE_TEXT = `Maya: Welcome to Small Hours, a conversation about making things and making room for them. Today I am speaking with illustrator and teacher Leon about the creative habit. People often describe creativity as a sudden arrival: you wait, an idea appears, and then you work. Is that how it feels to you? Leon: Occasionally, but most of my useful ideas arrive while I am already doing something ordinary. I think waiting for the perfect idea can become a way of avoiding the uncomfortable first attempt.

Maya: What changed that for you? Leon: I used to set aside a whole Sunday for drawing. The promise was enormous, and so was the pressure. When Sunday went badly, I felt I had lost the entire week. I replaced that with twenty minutes at the kitchen table before breakfast. That is a personal routine, not a scientific prescription. Someone else might need a different time or a different kind of practice. The important change for me was making the starting point small enough to repeat.

Maya: Did the smaller routine make the drawings better immediately? Leon: No. The first pages were often awkward. What improved first was my willingness to begin. I stopped asking every page to be a finished piece. Some days I only drew the same cup from several angles. Repetition gave me a way to notice differences. I was learning to observe, even when I had nothing I wanted to publish. A habit can create opportunities for good work without guaranteeing that every session produces it.

Maya: You also keep a notebook of things you notice. What goes into it? Leon: Fragments. The shape of a bus ticket, a sentence overheard with no identifying details, the shadow under a chair. I call it an observation bank. I do not collect them because I know exactly what they will become. I collect them so that, when I sit down to work, I have somewhere concrete to begin. It is a set of starting points rather than a list of finished ideas.

Maya: How do you stop collecting from becoming another form of procrastination? Leon: Every Friday I choose one observation and make three rough interpretations. A chair shadow might become a landscape, a character, or a pattern. The rule connects collecting to making. Without that step, my notebook can become a museum of things I never use. I keep the interpretations rough because a polished first version can make me reluctant to explore alternatives. Three is simply a useful constraint in this exercise, not a universal rule.

Maya: Can someone borrow another artist's observation? Leon: They can study how another person pays attention, but copying the resulting work and presenting it as original is different. I encourage students to record what they noticed themselves and keep track of references. Looking widely can help, but the work still needs a personal decision. Sometimes that decision is to leave an idea alone because it belongs too closely to someone else's experience. Being curious does not remove the responsibility to give credit.

Maya: When do you bring someone else into the process? Leon: Earlier than I used to, but with a narrower question. If I show a rough poster and ask whether it is good, I get a mixture of taste and encouragement. If I ask what someone notices first, I learn about the hierarchy. If I ask what they think the event is, I learn whether the message is legible. A useful question gives feedback a job. It also helps me avoid treating every preference as an instruction.

Maya: What happens when two people give opposite advice? Leon: I go back to the purpose of the piece. Advice from someone in the intended audience may reveal something important, but it is still one observation. I look for patterns and test a change. I do not count votes and assume the most popular version is automatically right. Feedback informs a decision; it does not make the decision for me. There are also times when the disagreement tells me I have not made the purpose clear enough.

Maya: So the creative habit includes editing? Leon: Absolutely. I separate making options from choosing among them. In an early session I want several possibilities. In a later session I ask which one serves the purpose. Mixing those tasks too tightly makes me reject an idea before I can see it. Separation is a technique that helps me, not a claim that every artist should work in two rigid stages. Sometimes making and editing naturally overlap, and that can be useful too.

Maya: People listening may feel that they are already behind. What would you suggest trying this week? Leon: Choose a small repeatable session, keep one observation each day, and turn one of those observations into a rough experiment. At the end of the week, ask what made it easier to start and what created friction. I would measure whether the routine fits your life before measuring how much work you produced. A routine that only works on an ideal day probably needs adjusting.

Maya: Would you share the experiment publicly? Leon: Only if that helps. A private sketch can be useful. Sharing is not the same as learning, and a quiet week can still be a productive one. If you want feedback, ask one specific question of someone who understands the context. If you need rest, take it. I have had to learn that consistency does not mean never missing a day. Returning after a break matters more to me than protecting an unbroken streak.

Maya: What should we leave listeners with? Leon: Give ideas somewhere to land. Build a modest practice, notice the world around you, and ask questions that help you make decisions. None of this guarantees brilliant work, and my experience will not fit everyone. But these habits give me more chances to make something meaningful. Maya: Thank you, Leon. This has been Small Hours. For this week, perhaps the useful question is not whether you are a creative person, but what you could make room to notice.`;

export const SAMPLE_EPISODE: Episode = {
  title: "The creative habit",
  themes: ["Creativity", "Daily practice", "Making things"],
  overview: {
    summary: [
      {
        text: "Good ideas need somewhere to land. Illustrator Leon describes how a small, repeatable practice helped him begin, without asking every attempt to become finished work.",
        sourceIds: ["s1", "s2", "s3"],
      },
      {
        text: "He gathers everyday observations, turns them into rough experiments, and asks specific questions when seeking feedback. His approach makes room for exploration, editing, and returning after a break—without promising a formula for creativity.",
        sourceIds: ["s4", "s5", "s7", "s9", "s11", "s12"],
      },
    ],
    takeaways: [
      { text: "Make the starting point small enough to repeat.", sourceIds: ["s2", "s3"] },
      { text: "Turn something you notice into something you make.", sourceIds: ["s4", "s5"] },
      { text: "Give feedback a specific question to answer.", sourceIds: ["s7", "s8"] },
      { text: "Build a practice you can return to after a break.", sourceIds: ["s10", "s11"] },
    ],
  },
  chapters: [
    {
      id: "c1",
      title: "Start before you're ready",
      description:
        "Why a smaller creative routine made it easier for Leon to begin, even when the first attempts felt awkward.",
      startId: "s1",
      endId: "s3",
    },
    {
      id: "c2",
      title: "An eye for the ordinary",
      description:
        "Collecting everyday observations, making rough experiments, and respecting the work of others.",
      startId: "s4",
      endId: "s6",
    },
    {
      id: "c3",
      title: "Give feedback a job",
      description:
        "Ask specific questions, weigh conflicting advice against a purpose, and make space for editing.",
      startId: "s7",
      endId: "s9",
    },
    {
      id: "c4",
      title: "A practice you can return to",
      description:
        "A small experiment for the week, with room for privacy, rest, and starting again.",
      startId: "s10",
      endId: "s12",
    },
  ],
  quiz: [
    {
      id: "q1",
      prompt: "What improved first when Leon made his drawing sessions smaller?",
      choices: [
        "The quality of every finished drawing",
        "His willingness to begin",
        "The number of commissions he received",
        "His ability to work without breaks",
      ],
      correctIndex: 1,
      explanation:
        "Leon says the first pages were still awkward. The initial improvement was his willingness to begin, not an immediate improvement in every drawing.",
      sourceIds: ["s3"],
    },
    {
      id: "q2",
      prompt: "How does Leon connect his observation bank to actual making?",
      choices: [
        "He publishes every observation",
        "He collects only complete ideas",
        "He makes three rough interpretations of one observation",
        "He waits until an observation becomes a polished concept",
      ],
      correctIndex: 2,
      explanation:
        "Each Friday, he chooses an observation and makes three rough interpretations. This keeps collecting connected to experimentation.",
      sourceIds: ["s5"],
    },
    {
      id: "q3",
      prompt: "Which feedback question best fits Leon's approach to a rough poster?",
      choices: [
        "What do you notice first?",
        "Do you like my style?",
        "Is this good?",
        "Would everyone agree with this?",
      ],
      correctIndex: 0,
      explanation:
        "Asking what someone notices first gives feedback a specific job: testing visual hierarchy. Broad approval questions tend to mix taste with encouragement.",
      sourceIds: ["s7"],
    },
    {
      id: "q4",
      prompt: "How would Leon most likely respond to missing a day of practice?",
      choices: [
        "Restart only when he can promise a perfect streak",
        "Publish extra work to make up for the break",
        "Give up because the routine has failed",
        "Return to the practice and adjust it if needed",
      ],
      correctIndex: 3,
      explanation:
        "Leon values returning after a break more than maintaining an unbroken streak, and recommends adjusting a routine that does not fit everyday life.",
      sourceIds: ["s10", "s11"],
    },
  ],
};

export function sampleWorkspace(): Workspace {
  return {
    episode: structuredClone(SAMPLE_EPISODE),
    transcript: parseTranscript(SAMPLE_TEXT),
    rawText: SAMPLE_TEXT,
    filename: "small-hours.txt",
    isSample: true,
    warnings: [],
  };
}

export function sampleRevision(mode: RevisionMode): Overview {
  return {
    summary:
      mode === "shorter"
        ? [
            {
              text: "Leon builds his creative practice around small sessions, everyday observations, and specific feedback. He values experiments and returning after breaks over polished output or perfect streaks.",
              sourceIds: ["s2", "s4", "s5", "s7", "s11"],
            },
          ]
        : [
            {
              text: "Start with a little time to make something. Notice things around you and try turning one into a rough idea. When you need feedback, ask a clear question. Leon says these habits help him, but they are not rules for everyone. Taking a break is okay; you can come back.",
              sourceIds: ["s2", "s4", "s5", "s7", "s11", "s12"],
            },
          ],
    takeaways: structuredClone(SAMPLE_EPISODE.overview.takeaways),
  };
}
