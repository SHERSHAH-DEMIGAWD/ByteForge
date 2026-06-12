'use client'

import { useState } from 'react'
import { Award, CheckCircle2, XCircle, RotateCcw, Timer, Target } from 'lucide-react'
import { QUIZ_QUESTIONS, QuizQuestion } from '@/app/viva-guide/quiz-data'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Phase = 'setup' | 'question' | 'results'

export function QuizMode() {
  const topics = ['All Topics', ...Array.from(new Set(QUIZ_QUESTIONS.map((q) => q.topic)))]
  const [phase, setPhase] = useState<Phase>('setup')
  const [topic, setTopic] = useState('All Topics')
  const [count, setCount] = useState(10)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<{ qid: number; correct: boolean }[]>([])
  const [startedAt, setStartedAt] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)

  const pool = topic === 'All Topics' ? QUIZ_QUESTIONS : QUIZ_QUESTIONS.filter((q) => q.topic === topic)
  const maxCount = Math.min(pool.length, 20)

  const startQuiz = () => {
    setQuestions(shuffle(pool).slice(0, Math.min(count, pool.length)))
    setQIdx(0)
    setSelected(null)
    setAnswers([])
    setStartedAt(Date.now())
    setPhase('question')
  }

  const currentQ = questions[qIdx]

  const choose = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    setAnswers((prev) => [...prev, { qid: currentQ.id, correct: idx === currentQ.correctIdx }])
  }

  const nextQuestion = () => {
    if (qIdx >= questions.length - 1) {
      setElapsedMs(Date.now() - startedAt)
      setPhase('results')
    } else {
      setQIdx(qIdx + 1)
      setSelected(null)
    }
  }

  const score = answers.filter((a) => a.correct).length

  // ---------- SETUP ----------
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <Target className="w-10 h-10 text-primary mx-auto" />
          <h3 className="text-2xl font-bold">Exam Mode</h3>
          <p className="text-sm text-muted-foreground">
            Timed multiple-choice drill. Each answer gets instant feedback with the reasoning an examiner expects to hear.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Topic Focus</label>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  topic === t ? 'bg-primary/20 text-primary border-primary/40' : 'bg-background/40 border-border/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
            Questions: <span className="text-accent font-bold">{Math.min(count, maxCount)}</span>
            <span className="text-muted-foreground/60 normal-case font-normal"> (of {pool.length} available)</span>
          </label>
          <input
            type="range" min={5} max={maxCount} value={Math.min(count, maxCount)}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full accent-primary bg-background h-2 rounded-lg"
          />
        </div>

        <button
          onClick={startQuiz}
          className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 transition-all"
        >
          Start Quiz
        </button>
      </div>
    )
  }

  // ---------- RESULTS ----------
  if (phase === 'results') {
    const pct = Math.round((100 * score) / questions.length)
    const verdict =
      pct >= 90 ? 'Outstanding — viva ready!' :
      pct >= 70 ? 'Solid — polish the missed topics.' :
      pct >= 50 ? 'Halfway there — revisit the explanations.' :
      'Time to hit the theory guides on each visualizer page.'

    const byTopic = new Map<string, { total: number; correct: number }>()
    questions.forEach((q, i) => {
      const t = byTopic.get(q.topic) || { total: 0, correct: 0 }
      t.total++
      if (answers[i]?.correct) t.correct++
      byTopic.set(q.topic, t)
    })

    return (
      <div className="max-w-2xl mx-auto bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8 space-y-6 text-center">
        <Award className={`w-12 h-12 mx-auto ${pct >= 70 ? 'text-accent' : 'text-muted-foreground'}`} />
        <div>
          <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            {score} / {questions.length}
          </div>
          <div className="text-sm text-muted-foreground mt-2">{verdict}</div>
        </div>

        <div className="flex justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> {pct}% accuracy</span>
          <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> {Math.round(elapsedMs / 1000)}s total · {Math.round(elapsedMs / 1000 / questions.length)}s per question</span>
        </div>

        <div className="space-y-2 text-left">
          <h4 className="text-xs font-bold text-muted-foreground uppercase">Topic Breakdown</h4>
          {[...byTopic.entries()].map(([t, s]) => (
            <div key={t} className="flex items-center gap-3 text-xs">
              <span className="w-56 truncate text-muted-foreground">{t}</span>
              <div className="flex-1 h-2 bg-background/60 rounded overflow-hidden">
                <div
                  className={`h-full ${s.correct === s.total ? 'bg-green-500/80' : s.correct >= s.total / 2 ? 'bg-accent/80' : 'bg-destructive/70'}`}
                  style={{ width: `${(100 * s.correct) / s.total}%` }}
                />
              </div>
              <span className="font-mono font-bold w-12 text-right">{s.correct}/{s.total}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setPhase('setup')}
          className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 transition-all inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> New Quiz
        </button>
      </div>
    )
  }

  // ---------- QUESTION ----------
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-background/60 rounded overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300" style={{ width: `${(100 * qIdx) / questions.length}%` }} />
        </div>
        <span className="font-mono text-xs text-muted-foreground">{qIdx + 1} / {questions.length}</span>
        <span className="font-mono text-xs text-accent font-bold">Score: {score}</span>
      </div>

      <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8 space-y-6">
        <div className="text-[10px] uppercase font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-1 rounded inline-block">
          {currentQ.topic}
        </div>
        <h3 className="text-lg font-bold leading-relaxed">{currentQ.question}</h3>

        <div className="space-y-2.5">
          {currentQ.options.map((opt, idx) => {
            let cls = 'border-border/30 bg-background/40 hover:border-primary/40 hover:bg-background/70'
            if (selected !== null) {
              if (idx === currentQ.correctIdx) cls = 'border-green-500/60 bg-green-500/10 text-green-500 dark:text-green-400'
              else if (idx === selected) cls = 'border-destructive/60 bg-destructive/10 text-destructive'
              else cls = 'border-border/20 bg-background/20 opacity-50'
            }
            return (
              <button
                key={idx}
                onClick={() => choose(idx)}
                disabled={selected !== null}
                className={`w-full text-left p-4 rounded-lg border transition-all text-sm flex items-start gap-3 ${cls}`}
              >
                <span className="font-mono font-bold text-xs mt-0.5 opacity-70">{String.fromCharCode(65 + idx)}.</span>
                <span>{opt}</span>
                {selected !== null && idx === currentQ.correctIdx && <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0 mt-0.5" />}
                {selected !== null && idx === selected && idx !== currentQ.correctIdx && <XCircle className="w-4 h-4 ml-auto flex-shrink-0 mt-0.5" />}
              </button>
            )
          })}
        </div>

        {selected !== null && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className={`p-4 rounded-lg border text-xs leading-relaxed ${
              selected === currentQ.correctIdx
                ? 'bg-green-500/10 border-green-500/30 text-muted-foreground'
                : 'bg-destructive/5 border-destructive/25 text-muted-foreground'
            }`}>
              <span className={`font-bold ${selected === currentQ.correctIdx ? 'text-green-500 dark:text-green-400' : 'text-destructive'}`}>
                {selected === currentQ.correctIdx ? 'Correct. ' : 'Not quite. '}
              </span>
              {currentQ.explanation}
            </div>
            <button
              onClick={nextQuestion}
              className="w-full py-3 bg-gradient-to-r from-primary to-accent text-background font-bold rounded-lg hover:opacity-90 transition-all"
            >
              {qIdx >= questions.length - 1 ? 'See Results' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
