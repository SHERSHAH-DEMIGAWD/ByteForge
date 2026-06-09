'use client'

import { useState } from 'react'
import { GraduationCap, Award, HelpCircle, BookOpen, Calculator, Info, Grid, FileText } from 'lucide-react'

// Mock Viva Questions Database
const VIVA_QUESTIONS = [
  {
    id: 1,
    question: "Why does Dijkstra's algorithm fail on negative edge weights? What is the alternative?",
    category: "Greedy Techniques (Unit IV)",
    answer: [
      "Greedy Choice Assumption: Dijkstra's assumes that once a vertex is added to the visited set, its shortest path is finalized. Negative weights can violate this by offering a 'backdoor' shorter path later.",
      "Cut-Crossing: If a negative edge exists, relaxing it might reduce the distance of an already visited node, but Dijkstra's does not re-add visited nodes to the priority queue.",
      "Alternative: The Bellman-Ford algorithm (Dynamic Programming) handles negative weights and detects negative cycles by relaxing all edges $V-1$ times. Complexity: $O(V \\cdot E)$."
    ]
  },
  {
    id: 2,
    question: "What is the key difference between Kruskal's and Prim's MST strategies? When is one preferred?",
    category: "Greedy Techniques (Unit IV)",
    answer: [
      "Selection Strategy: Kruskal's is edge-based (selects the cheapest globally available edge that doesn't form a cycle). Prim's is vertex-based (grows a single tree from a root, selecting the cheapest edge connected to visited nodes).",
      "Core Data Structures: Kruskal's uses a Disjoint Set (Union-Find) with path compression. Prim's uses a Priority Queue (Min-Heap).",
      "Preference: Kruskal's is better for sparse graphs (fewer edges, $E \\approx V$). Prim's is better for dense graphs (many edges, $E \\approx V^2$)."
    ]
  },
  {
    id: 3,
    question: "What is the Principle of Optimality in Dynamic Programming? Give an example.",
    category: "Dynamic Programming (Unit IV)",
    answer: [
      "Definition: An optimal solution to an instance of a problem contains optimal solutions to its subproblems.",
      "Example: In the Shortest Path problem, if the shortest path from A to C passes through B, then the segment from A to B must be the shortest path from A to B, and B to C must be the shortest path from B to C.",
      "Counterexample: Longest simple path does NOT satisfy the principle of optimality because combining two longest simple subpaths can create cycles."
    ]
  },
  {
    id: 4,
    question: "What makes Quick Sort run in O(N²) worst-case time? How do we mitigate it?",
    category: "Divide & Conquer (Unit II)",
    answer: [
      "Worst Case Cause: Extremely unbalanced partitioning. This happens when the array is already sorted (or reverse sorted) and we consistently pick the smallest or largest element as the pivot. The tree depth becomes $O(N)$ instead of $O(\\log N)$.",
      "Mitigation 1: Randomized Quick Sort. Pick a random element as the pivot, ensuring a high probability of balanced splits. Expected time becomes $O(N \\log N)$.",
      "Mitigation 2: Median-of-Three. Select the median of the first, middle, and last elements as the pivot."
    ]
  },
  {
    id: 5,
    question: "How does a Decision Tree prove the lower bound of comparison-based sorting is Ω(N log N)?",
    category: "Decision Trees (Unit V)",
    answer: [
      "Leaf Nodes Representation: Any sorting algorithm must distinguish between all $N!$ permutations of an array. Therefore, the decision tree must have at least $N!$ leaves.",
      "Height vs Leaves: A binary tree of height $h$ can have at most $2^h$ leaves. Thus: $2^h \\ge N!$.",
      "Taking Logarithms: Applying logarithms yields $h \\ge \\log_2(N!)$. By Stirling's approximation, $\\log_2(N!) \\approx N \\log_2 N - N \\log_2 e$, proving the height (comparisons) is $\\Omega(N \\log N)$."
    ]
  },
  {
    id: 6,
    question: "What is the difference between NP-Complete and NP-Hard classes?",
    category: "NP & NP-Complete (Unit V)",
    answer: [
      "NP (Nondeterministic Polynomial): Problems where a proposed solution can be verified in polynomial time.",
      "NP-Hard: Problems that are at least as hard as the hardest problems in NP. A problem $X$ is NP-Hard if every problem in NP is polynomial-time reducible to $X$.",
      "NP-Complete: The intersection of NP and NP-Hard. $Y$ is NP-Complete if: (1) $Y \\in \\text{NP}$ and (2) every problem in NP is reducible to $Y$ in polynomial time."
    ]
  }
]

export default function VivaGuidePage() {
  const [activeTab, setActiveTab] = useState<'viva' | 'solvers'>('viva')
  const [activeSolver, setActiveSolver] = useState<'binomial' | 'floyd'>('binomial')
  
  // Viva States
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0)
  const [showAnswer, setShowAnswer] = useState<boolean>(false)

  // Binomial Coefficient DP States
  const [binomN, setBinomN] = useState<number>(6)
  const [binomK, setBinomK] = useState<number>(4)
  const [binomMatrix, setBinomMatrix] = useState<number[][] | null>(null)

  // Floyd-Warshall DP States
  const [floydK, setFloydK] = useState<number>(0)
  const [floydMatrices, setFloydMatrices] = useState<number[][][] | null>(null)
  
  const initialFloydMatrix = [
    [0, 3, 999, 7],   // 999 represents Infinity
    [8, 0, 2, 999],
    [5, 999, 0, 1],
    [2, 999, 999, 0]
  ]

  const solveBinomialCoefficient = () => {
    const n = binomN
    const k = binomK
    
    // Create matrix of size (n+1) x (k+1)
    const C: number[][] = Array.from({ length: n + 1 }, () => Array(k + 1).fill(0))
    
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= Math.min(i, k); j++) {
        if (j === 0 || j === i) {
          C[i][j] = 1
        } else {
          C[i][j] = C[i - 1][j - 1] + C[i - 1][j]
        }
      }
    }
    setBinomMatrix(C)
  }

  const solveFloydWarshall = () => {
    // 4 nodes
    const n = 4
    let D = initialFloydMatrix.map(row => [...row])
    const steps: number[][][] = [D.map(row => [...row])] // step 0

    for (let k = 0; k < n; k++) {
      const nextD = D.map(row => [...row])
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          nextD[i][j] = Math.min(D[i][j], D[i][k] + D[k][j])
        }
      }
      D = nextD
      steps.push(D.map(row => [...row]))
    }
    setFloydMatrices(steps)
    setFloydK(0)
  }

  const currentQuestion = VIVA_QUESTIONS[currentQuestionIdx]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
          DAA Viva Sandbox
        </h1>
        <p className="text-muted-foreground">
          Prepare for academic project examinations with interactive oral simulators and dynamic subproblem matrix solvers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border/30 pb-4">
        <button
          onClick={() => setActiveTab('viva')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase rounded-lg border transition-all ${
            activeTab === 'viva'
              ? 'bg-primary/20 text-primary border-primary/45'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Viva Simulator
        </button>
        <button
          onClick={() => {
            setActiveTab('solvers')
            solveBinomialCoefficient()
            solveFloydWarshall()
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase rounded-lg border transition-all ${
            activeTab === 'solvers'
              ? 'bg-primary/20 text-primary border-primary/45'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calculator className="w-4 h-4" /> Dynamic DP Solvers
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'viva' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Question Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-[10px] uppercase font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-1 rounded">
                {currentQuestion.category}
              </div>

              <div className="flex items-start gap-4 mt-4">
                <HelpCircle className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-4">
                  <h3 className="text-xl font-bold leading-relaxed">{currentQuestion.question}</h3>
                  
                  {!showAnswer ? (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="px-5 py-3 bg-gradient-to-r from-primary to-accent text-background font-bold text-xs uppercase rounded-lg hover:opacity-90 transition-all shadow-md"
                    >
                      Reveal Answer Outline
                    </button>
                  ) : (
                    <div className="space-y-4 pt-4 border-t border-border/20 animate-in fade-in duration-300">
                      <h4 className="text-xs uppercase font-bold text-accent tracking-wider">Structured Answer Outline:</h4>
                      <ul className="space-y-3">
                        {currentQuestion.answer.map((bullet, idx) => (
                          <li key={idx} className="flex gap-2.5 text-xs text-muted-foreground leading-relaxed">
                            <span className="text-accent font-bold mt-0.5">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <button
                        onClick={() => setShowAnswer(false)}
                        className="text-xs text-muted-foreground hover:text-foreground border border-border/30 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Hide Answer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center bg-card/40 p-4 border border-border/20 rounded-lg">
              <button
                onClick={() => {
                  setCurrentQuestionIdx(prev => (prev === 0 ? VIVA_QUESTIONS.length - 1 : prev - 1))
                  setShowAnswer(false)
                }}
                className="px-4 py-2 border border-border/30 hover:border-primary/50 text-xs font-bold uppercase rounded-lg transition-all"
              >
                Previous Question
              </button>
              
              <span className="font-mono text-xs text-muted-foreground">
                Question {currentQuestionIdx + 1} / {VIVA_QUESTIONS.length}
              </span>

              <button
                onClick={() => {
                  setCurrentQuestionIdx(prev => (prev === VIVA_QUESTIONS.length - 1 ? 0 : prev + 1))
                  setShowAnswer(false)
                }}
                className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs font-bold uppercase rounded-lg transition-all"
              >
                Next Question
              </button>
            </div>
          </div>

          {/* Quick Syllabus Review Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-6 space-y-4">
              <h4 className="text-sm font-bold text-primary uppercase border-b border-border/20 pb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" /> Presentation Strategy
              </h4>
              <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <div className="p-2.5 bg-background/50 border border-border/10 rounded-lg">
                  <span className="font-bold text-foreground block">1. State Complexity Bounds</span>
                  Give worst-case, best-case, and space bounds clearly using mathematical notations.
                </div>
                <div className="p-2.5 bg-background/50 border border-border/10 rounded-lg">
                  <span className="font-bold text-foreground block">2. Explain the Paradigm Choice</span>
                  Be prepared to justify why Greedy is preferred over DP, or how Divide & Conquer saves recursive splits.
                </div>
                <div className="p-2.5 bg-background/50 border border-border/10 rounded-lg">
                  <span className="font-bold text-foreground block">3. Relate to Real-World Uses</span>
                  Link Huffman to file compressing, Dijkstra to routing tables, and Knapsack to bandwidth budgets.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'solvers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {/* Solvers Sidebar Controller */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Grid className="w-5 h-5" /> Select Solver
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => setActiveSolver('binomial')}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    activeSolver === 'binomial'
                      ? 'bg-primary/20 border-primary/35 text-primary font-bold'
                      : 'border-border/20 text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}
                >
                  Binomial Coefficient ($C(n, k)$)
                  <span className="block text-[10px] text-muted-foreground font-normal mt-1">DP bottom-up formula matrix</span>
                </button>
                
                <button
                  onClick={() => setActiveSolver('floyd')}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    activeSolver === 'floyd'
                      ? 'bg-primary/20 border-primary/35 text-primary font-bold'
                      : 'border-border/20 text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}
                >
                  Floyd-Warshall All-Pairs SP
                  <span className="block text-[10px] text-muted-foreground font-normal mt-1">Matrix transition states $D^{(k)}$</span>
                </button>
              </div>
            </div>

            {activeSolver === 'binomial' && (
              <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-4">
                <h4 className="text-xs uppercase font-bold text-muted-foreground">Matrix Bounds</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Rows ($n$)</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={binomN}
                      onChange={(e) => setBinomN(Math.min(8, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full bg-background border border-border/30 rounded-lg p-2 text-xs focus:outline-none focus:border-primary/50 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Cols ($k$)</label>
                    <input
                      type="number"
                      min="0"
                      max={binomN}
                      value={binomK}
                      onChange={(e) => setBinomK(Math.min(binomN, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full bg-background border border-border/30 rounded-lg p-2 text-xs focus:outline-none focus:border-primary/50 text-foreground"
                    />
                  </div>
                </div>
                <button
                  onClick={solveBinomialCoefficient}
                  className="w-full py-2 bg-primary text-background font-bold text-xs uppercase rounded-lg hover:opacity-90 transition-all"
                >
                  Generate Table
                </button>
              </div>
            )}

            {activeSolver === 'floyd' && (
              <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-4">
                <h4 className="text-xs uppercase font-bold text-muted-foreground">Original Adjacency Matrix</h4>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Initial graph weights (999 denotes $\infty$). Floyd's algorithm solves all-pairs shortest paths by iteratively allowing nodes 0, 1, 2, 3 as intermediate steps.
                </p>
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-xs">
                  {initialFloydMatrix.map((row, rIdx) => 
                    row.map((val, cIdx) => (
                      <div key={`${rIdx}-${cIdx}`} className="p-1.5 bg-background border border-border/15 rounded">
                        {val === 999 ? '∞' : val}
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={solveFloydWarshall}
                  className="w-full py-2 bg-primary text-background font-bold text-xs uppercase rounded-lg hover:opacity-90 transition-all"
                >
                  Calculate Transitions
                </button>
              </div>
            )}
          </div>

          {/* Solver Display Panel */}
          <div className="lg:col-span-2">
            {activeSolver === 'binomial' && binomMatrix && (
              <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-6">
                <div>
                  <h4 className="text-base font-bold text-primary mb-1">Binomial Coefficient DP Matrix</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Uses the subproblem formula $C[i][j] = C[i-1][j-1] + C[i-1][j]$. Notice how each cell is calculated from the cell directly above it and the cell diagonally to the upper-left.
                  </p>
                </div>

                <div className="overflow-x-auto border border-border/20 rounded-lg">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="bg-background/80 border-b border-border/20">
                        <th className="py-2.5 px-3 text-left border-r border-border/20 text-muted-foreground">n \ k</th>
                        {Array.from({ length: binomK + 1 }).map((_, k) => (
                          <th key={k} className="py-2.5 px-2 text-center border-r border-border/20 w-12">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {binomMatrix.map((row, i) => (
                        <tr key={i} className="border-b border-border/15 hover:bg-primary/5">
                          <td className="py-2.5 px-3 border-r border-border/20 font-bold bg-background/25">{i}</td>
                          {row.map((val, j) => {
                            const isAnswerCell = i === binomN && j === binomK
                            return (
                              <td 
                                key={j} 
                                className={`py-2.5 px-2 text-center border-r border-border/20 ${
                                  isAnswerCell 
                                    ? 'bg-accent/20 text-accent font-extrabold border-accent/40 text-sm' 
                                    : val > 0 
                                      ? 'text-foreground' 
                                      : 'text-muted-foreground/30'
                                }`}
                              >
                                {val}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2.5 text-xs text-muted-foreground">
                  <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-foreground">viva Tip:</span> Notice the final answer in the highlighted cell <span className="font-bold text-accent">({binomMatrix[binomN][binomK]})</span>. This dynamic programming table computes $C({binomN}, {binomK})$ in $O(n \\cdot k)$ time using auxiliary space of $O(n \\cdot k)$, avoiding duplicate recursive calculation.
                  </div>
                </div>
              </div>
            )}

            {activeSolver === 'floyd' && floydMatrices && (
              <div className="bg-card/50 border border-border/30 rounded-lg p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-border/20 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-primary">Floyd-Warshall Path Transition Matrix</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Displaying intermediate matrix $D^{({floydK})}$ allowing nodes up to {floydK - 1} as paths.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setFloydK(idx)}
                        className={`w-7 h-7 flex items-center justify-center rounded text-xs font-mono font-bold border transition-all ${
                          floydK === idx
                            ? 'bg-primary/25 border-primary text-primary'
                            : 'border-border/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        D{idx}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-black/40 border border-border/15 p-6 rounded-lg flex justify-center">
                  <div className="grid grid-cols-4 gap-3 text-center max-w-[280px] w-full font-mono text-sm font-bold">
                    {floydMatrices[floydK].map((row, rIdx) => 
                      row.map((val, cIdx) => {
                        const cellKey = `${rIdx}-${cIdx}`
                        const oldVal = floydK > 0 ? floydMatrices[floydK - 1][rIdx][cIdx] : val
                        const wasRelaxed = val < oldVal
                        
                        let cellBg = 'bg-card border-border/20 text-foreground'
                        if (rIdx === cIdx) cellBg = 'bg-background border-border/10 text-muted-foreground/45'
                        else if (wasRelaxed) cellBg = 'bg-green-500/15 border-green-500/50 text-green-400 scale-105 animate-pulse'

                        return (
                          <div key={cellKey} className={`p-4 border rounded-lg flex flex-col justify-center min-h-[52px] ${cellBg}`}>
                            {val === 999 ? '∞' : val}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2.5 text-xs text-muted-foreground">
                  <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-foreground">viva Formula:</span> In intermediate matrix $D^{({floydK})}$, each transition relaxes paths by calculating $D^{(k)}[i][j] = \\min(D^{(k-1)}[i][j], D^{(k-1)}[i][k] + D^{(k-1)}[k][j])$. A negative value on the main diagonal indicates a negative cycle!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
