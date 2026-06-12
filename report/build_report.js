/* ByteForge — DAA Experiential Learning Report generator
 * Matches the RVCE CSE report template (Times New Roman, cover/certificate/
 * declaration/TOC/Chapters 1-5/References). Content is grounded in the actual
 * ByteForge codebase.
 */
const path = require('path');
const fs = require('fs');
const GLOBAL = 'C:/Users/Shreyas/AppData/Roaming/npm/node_modules';
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, Header, Footer, TableOfContents,
  VerticalAlign,
} = require(path.join(GLOBAL, 'docx'));

const FONT = 'Times New Roman';
const CONTENT_W = 9026; // A4, 1" margins

// ---- helpers --------------------------------------------------------------
const T = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 24, bold: o.bold, italics: o.italics, color: o.color });

function P(text, o = {}) {
  return new Paragraph({
    alignment: o.align || AlignmentType.JUSTIFIED,
    spacing: { line: o.line || 360, after: o.after == null ? 120 : o.after, before: o.before || 0 },
    indent: o.indent,
    children: Array.isArray(text) ? text : [T(text, o)],
  });
}
const center = (text, o = {}) => P(text, { ...o, align: AlignmentType.CENTER });

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bul', level },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 340, after: 60 },
    children: Array.isArray(text) ? text : [T(text)],
  });
}
function numItem(text, ref = 'num') {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 340, after: 60 },
    children: Array.isArray(text) ? text : [T(text)],
  });
}
const H1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 200 }, children: [T(text, { bold: true, size: 32 })] });
const H1np = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [T(text, { bold: true, size: 32 })] });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 }, children: [T(text, { bold: true, size: 28 })] });
const H3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 140, after: 100 }, children: [T(text, { bold: true, size: 24 })] });

const border = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

function cell(text, w, opts = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: opts.head ? { fill: 'D9E2F3', type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: (Array.isArray(text) ? text : [text]).map((t) =>
      new Paragraph({ alignment: opts.align || AlignmentType.LEFT, spacing: { line: 300, after: 0 }, children: [T(String(t), { bold: opts.head || opts.bold, size: opts.size || 22 })] })),
  });
}
function table(rows, widths, opts = {}) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    borders,
    rows: rows.map((r, ri) =>
      new TableRow({
        tableHeader: ri === 0 && !opts.noHead,
        children: r.map((c, ci) => cell(c, widths[ci], { head: ri === 0 && !opts.noHead, align: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER, bold: opts.boldFirst && ci === 0 })),
      })),
  });
}
const gap = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [T('')] }));

// ===========================================================================
// FRONT MATTER
// ===========================================================================
const cover = [
  center('RV COLLEGE OF ENGINEERING, BENGALURU – 560059', { bold: true, size: 26, after: 60 }),
  center('(An Autonomous Institution affiliated to VTU, Belagavi)', { italics: true, size: 20, after: 200 }),
  center('DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING (DATA SCIENCE)', { bold: true, size: 26, after: 400 }),
  ...gap(1),
  center('ByteForge', { bold: true, size: 44, after: 60 }),
  center('Algorithm Visualizer and Data Compression Engine', { bold: true, size: 30, after: 300 }),
  ...gap(1),
  center('Design and Analysis of Algorithms (CD343AI)', { bold: true, size: 28, after: 80 }),
  center('Experiential Learning (Lab)', { bold: true, size: 28, after: 80 }),
  center('REPORT', { bold: true, size: 28, after: 240 }),
  center('Submitted by', { size: 24, after: 160 }),
  table([
    ['Ronith', '1RV24CD043'],
    ['Sarthak S Chavare', '1RV24CD045'],
    ['Shreesha S Koushik', '1RV24CD048'],
    ['Shreyas Kale', '1RV24CD049'],
  ], [3200, 2400], { noHead: true }),
  ...gap(1),
  center('Under the guidance of', { size: 24, after: 80 }),
  center('Dr. Karanam Sunil Kumar', { bold: true, size: 26, after: 40 }),
  center('Department of Computer Science and Engineering (Data Science)', { size: 22, after: 240 }),
  center('In partial fulfilment for the award of the degree of', { size: 24, after: 80 }),
  center('Bachelor of Engineering', { bold: true, size: 30, after: 300 }),
  center('Department of Computer Science and Engineering (Data Science)', { bold: true, size: 26, after: 60 }),
  center('2025 – 2026', { bold: true, size: 26 }),
];

const certificate = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [T('RV COLLEGE OF ENGINEERING, BENGALURU – 560059', { bold: true, size: 26 })] }),
  center('DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING (DATA SCIENCE)', { bold: true, size: 24, after: 300 }),
  center('CERTIFICATE', { bold: true, size: 32, after: 300 }),
  P([
    T('Certified that the Experiential Learning work titled '),
    T('“ByteForge – Algorithm Visualizer and Data Compression Engine”', { bold: true }),
    T(' is carried out by '),
    T('Ronith (1RV24CD043), Sarthak S Chavare (1RV24CD045), Shreesha S Koushik (1RV24CD048)', { bold: true }),
    T(' and '),
    T('Shreyas Kale (1RV24CD049)', { bold: true }),
    T(', who are bonafide students of RV College of Engineering, Bengaluru, in partial fulfilment for the Experiential Learning component of the course Design and Analysis of Algorithms (CD343AI) of the Department of Computer Science and Engineering (Data Science) during the academic year 2025–2026. It is certified that all corrections and suggestions indicated for the internal assessment have been incorporated in the report. The report has been approved as it satisfies the academic requirements prescribed for the said course.'),
  ], { line: 400 }),
  ...gap(3),
  table([
    ['Signature of Guide', 'Signature of Coordinator', 'Signature of HOD'],
    ['Dr. Karanam Sunil Kumar', 'Course Coordinator', 'Head of Department'],
  ], [3009, 3008, 3009], { noHead: true, boldFirst: false }),
  ...gap(2),
  center('External Viva', { bold: true, size: 26, after: 160 }),
  table([
    ['Name of Examiners', 'Signature with Date'],
    ['1.', ''],
    ['2.', ''],
  ], [5026, 4000]),
];

const declaration = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [T('DECLARATION', { bold: true, size: 32 })] }),
  P([
    T('We, '),
    T('Ronith (1RV24CD043), Sarthak S Chavare (1RV24CD045), Shreesha S Koushik (1RV24CD048)', { bold: true }),
    T(' and '),
    T('Shreyas Kale (1RV24CD049)', { bold: true }),
    T(', students of the Department of Computer Science and Engineering (Data Science), RV College of Engineering, Bengaluru, hereby declare that the Experiential Learning work titled '),
    T('“ByteForge – Algorithm Visualizer and Data Compression Engine”', { bold: true }),
    T(' has been carried out by us and submitted in partial fulfilment of the requirements of the course Design and Analysis of Algorithms (CD343AI) during the academic year 2025–2026. We further declare that the contents of this report have not been submitted to any other university or institution for the award of any degree.'),
  ], { line: 400 }),
  P('We also declare that any Intellectual Property Rights generated out of this project carried out at RVCE will be the property of RV College of Engineering, Bengaluru, and we will be one of the authors of the same.', { line: 400, after: 300 }),
  ...gap(2),
  P('Place: Bengaluru', { after: 60 }),
  P('Date:', { after: 240 }),
  table([
    ['Name', 'USN', 'Signature'],
    ['Ronith', '1RV24CD043', ''],
    ['Sarthak S Chavare', '1RV24CD045', ''],
    ['Shreesha S Koushik', '1RV24CD048', ''],
    ['Shreyas Kale', '1RV24CD049', ''],
  ], [3526, 2500, 3000]),
];

const toc = [
  new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [T('TABLE OF CONTENTS', { bold: true, size: 32 })] }),
  new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-2' }),
  P([T('(In Microsoft Word, right-click the table above and choose ', { italics: true, size: 20 }), T('Update Field → Update entire table', { italics: true, bold: true, size: 20 }), T(' to populate page numbers.)', { italics: true, size: 20 })], { align: AlignmentType.CENTER, before: 160 }),
];

// ===========================================================================
// ABSTRACT
// ===========================================================================
const abstract = [
  H1('Abstract'),
  P('The Design and Analysis of Algorithms (DAA) curriculum spans a broad range of algorithmic paradigms — brute force, divide-and-conquer, greedy methods, dynamic programming, backtracking and space–time trade-offs — yet these topics are most often taught through static pseudocode and worked examples. Such presentations make it difficult for students to develop an intuition for how an algorithm transforms its data structures step by step, or to appreciate why one paradigm out-performs another on a given input.'),
  P('ByteForge is an interactive, full-stack laboratory platform built to close this gap. It unifies more than twenty classic algorithms across the entire DAA syllabus into a single visual sandbox, alongside a dedicated lossless data-compression and information-theory engine. Each algorithm is implemented in pure Python and instrumented to emit a structured, step-by-step execution trace; a modern web client then animates these traces, highlighting comparisons, swaps, relaxations, recursive calls and backtracking decisions in real time, with a natural-language explanation attached to every step.'),
  P('The system is engineered using a decoupled client–server architecture. A FastAPI service exposes the algorithmic engine as REST endpoints with microsecond-precision profiling, while a Next.js (React) front end renders SVG-based visualizers, complexity dashboards and an examination-style viva sandbox. The compression engine compares Shannon-entropy lower bounds against the actual output sizes of Huffman coding, LZ77, LZW, RLE, Burrows–Wheeler Transform, Arithmetic coding and DEFLATE.'),
  P('Experimental evaluation confirms both correctness and pedagogical value. Empirical run-time profiling reproduces the expected asymptotic curves of each algorithm; the compression engine demonstrates measurable ratios approaching the theoretical entropy limit on low-entropy inputs; and instrumented comparisons show, for example, that Knuth–Morris–Pratt performs 23 character comparisons against the naive algorithm’s 29 on a benchmark pattern, while Strassen’s method reduces 4×4 matrix multiplications from 64 to 49. ByteForge thus serves as a verifiable, hands-on companion to the DAA course, replacing abstract description with reproducible visual proof.'),
];

// ===========================================================================
// CHAPTER 1 — INTRODUCTION
// ===========================================================================
const ch1 = [
  H1('Chapter 1: Introduction'),
  P('Algorithms form the intellectual core of computer science, and the Design and Analysis of Algorithms course is where students first learn to reason rigorously about correctness, optimality and computational complexity. The course demands two complementary skills: the ability to trace an algorithm’s mechanical execution on concrete data, and the ability to argue about its asymptotic behaviour in the abstract. In conventional teaching these skills are developed almost entirely on paper, which creates a well-known difficulty — students can often recite the time complexity of an algorithm without being able to predict how it will actually behave on a particular input.'),
  P('The problem is especially acute for algorithms whose behaviour is inherently dynamic. The partition step of Quick Sort, the relaxation sequence of Dijkstra’s and Bellman–Ford’s algorithms, the cache-hit pruning of memoized recursion, the disjoint-set merges inside Kruskal’s algorithm, and the search–backtrack rhythm of the N-Queens problem all unfold over many intermediate states. A static figure can capture at most one of these states; the transitions between them — which is precisely where the algorithmic insight lives — remain invisible.'),
  H2('1.1 Motivation'),
  P('The motivation for ByteForge is to make these invisible transitions visible, interactive and verifiable. Rather than presenting an algorithm as a finished artefact, ByteForge lets a student supply their own input, run the algorithm, and watch every comparison, swap, relaxation and recursive call animate in sequence, each accompanied by a plain-language explanation of why that step occurred. By coupling this with live micro-benchmarking, the platform allows learners to confirm theoretical complexity empirically — to literally see an O(n log n) curve diverge from an O(n²) curve as input size grows.'),
  P('A second motivation comes from information theory and data compression — a syllabus area that ties greedy methods (Huffman) and dictionary techniques (LZ77, LZW) directly to the quantitative notion of Shannon entropy. Compression is an ideal teaching vehicle because its quality has an objective lower bound, allowing students to compare a real algorithm’s output against a provable theoretical minimum.'),
  H2('1.2 Problem Statement'),
  P('To design and implement an interactive, full-stack educational platform that (i) provides correct, instrumented implementations of the major algorithmic paradigms in the DAA syllabus; (ii) visualizes their step-by-step execution with synchronized natural-language explanations; (iii) empirically verifies their asymptotic complexity through live profiling; and (iv) integrates a lossless data-compression engine that quantifies compression performance against the Shannon-entropy bound.'),
  H2('1.3 Objectives'),
  bullet('Implement more than twenty classical algorithms spanning brute force, divide-and-conquer, greedy, dynamic programming, backtracking and space–time-trade-off paradigms.'),
  bullet('Instrument each algorithm to emit a structured execution trace capturing every meaningful state transition.'),
  bullet('Build an animated web front end that renders these traces as SVG visualizations with per-step explanations.'),
  bullet('Provide a compression workspace that benchmarks seven lossless algorithms against Shannon entropy.'),
  bullet('Offer an analytical layer — benchmark charts, an empirical Big-O verification page and an examination-style viva sandbox — to support revision and assessment.'),
  H2('1.4 Scope of the Project'),
  P('ByteForge is scoped as an educational and analytical tool rather than a production compression utility. Inputs are deliberately bounded (for example, recursion depth and graph size are capped) so that the generated traces remain small enough to animate clearly. The emphasis throughout is on transparency of the algorithmic process and on reproducibility of complexity behaviour, not on competing with industrial-strength library implementations.'),
  H2('1.5 Contributions'),
  P('The principal contributions of this work are: (i) a unified, instrumented Python algorithm engine covering the breadth of the DAA syllabus; (ii) a trace-driven visualization protocol in which the backend emits explanatory step objects that the front end animates generically; (iii) an entropy-aware compression comparison workspace; and (iv) an integrated assessment layer combining empirical complexity verification with an interactive viva and quiz module.'),
];

// ===========================================================================
// CHAPTER 2 — SOLUTION DESIGN
// ===========================================================================
const ch2 = [
  H1('Chapter 2: Solution Design'),
  H2('2.1 Overview of the Proposed Solution'),
  P('ByteForge is designed as a decoupled, high-performance client–server system. The core idea is a clean separation between an algorithmic engine, which knows how to execute and instrument algorithms, and a presentation layer, which knows how to animate the resulting traces. This separation means the same trace produced by the backend can drive multiple visual representations, and new algorithms can be added on the server without changing the rendering machinery.'),
  P('When a user supplies an input and runs an algorithm, the front end issues a REST request carrying the parameters as JSON. The backend dispatches the request to the corresponding pure-Python implementation, which executes the algorithm while recording a list of step objects — each step capturing the relevant data-structure state together with a natural-language explanation. A profiler simultaneously measures execution time and memory. The structured trace is returned to the client, which animates it frame by frame and displays the associated benchmarks.'),
  H2('2.2 System Architecture Design'),
  H3('2.2.1 Architectural Components'),
  P('The system is organized into the following modules:'),
  bullet([T('Web Client (Next.js / React): ', { bold: true }), T('an App-Router single-page application that renders SVG visualizers, dashboards, the compression workspace and the viva sandbox, and manages interaction state.')]),
  bullet([T('REST API Layer (FastAPI, api.py): ', { bold: true }), T('validates incoming requests with Pydantic models, dispatches them to the algorithm modules, and serializes the resulting traces and benchmarks as JSON.')]),
  bullet([T('Algorithm Engine (algorithms/): ', { bold: true }), T('pure-Python implementations of every supported algorithm, each emitting a structured, explanation-annotated execution trace.')]),
  bullet([T('Execution Profiler (utils/profiler.py): ', { bold: true }), T('wraps each algorithm call to capture wall-clock time and peak memory at microsecond / kilobyte resolution.')]),
  bullet([T('Compression & Information-Theory Module: ', { bold: true }), T('Huffman, LZ77, LZW, RLE, BWT, Arithmetic and DEFLATE encoders plus a Shannon-entropy calculator that establishes the theoretical lower bound.')]),
  P('This architecture mirrors the request–response lifecycle directly: the client gathers parameters, the API dispatches to an algorithm module, the profiler measures execution, and a structured trace flows back to drive the animation.', { before: 80 }),
  H3('2.2.2 Technology Stack and Rationale'),
  table([
    ['Layer', 'Technology', 'Rationale'],
    ['Front end', 'Next.js 16 (React 19), Tailwind CSS v4', 'App-Router structure, persistent layout, fast SVG rendering of live algorithm state'],
    ['State', 'Zustand', 'Lightweight global store for compression inputs and results'],
    ['Charts', 'Recharts', 'Declarative benchmark and complexity charts'],
    ['Back end', 'FastAPI + Uvicorn (Python 3.11)', 'Asynchronous REST routing, automatic OpenAPI docs, Python’s readable pseudocode-like syntax'],
    ['Profiling', 'time + tracemalloc', 'Microsecond timing and peak-memory measurement'],
  ], [1600, 3200, 4226]),
  H2('2.3 Data Structures and Operations'),
  H3('2.3.1 Data Structures Used'),
  table([
    ['Data Structure', 'Purpose'],
    ['Min-Heap / Priority Queue', 'Huffman tree construction; Dijkstra and Prim frontier selection; A* open set'],
    ['Disjoint Set (Union-Find)', 'Cycle detection in Kruskal’s MST with path compression'],
    ['2-D DP Table (matrix)', '0/1 Knapsack, Longest Common Subsequence, Floyd–Warshall'],
    ['Hash Map / Dictionary', 'Frequency counts, codebooks, LZW dictionary, memoization cache, adjacency maps'],
    ['Binary Tree (Node objects)', 'Huffman code tree and recursion-call trees'],
    ['Sliding Window + Lookahead Buffer', 'LZ77 dictionary encoding'],
    ['Queue / In-degree array', 'Kahn’s topological ordering'],
    ['Recursion Stack', 'Backtracking in N-Queens; divide-and-conquer in Merge Sort and Strassen'],
  ], [3400, 5626]),
  H3('2.3.2 Operations Performed'),
  bullet('Trace generation — recording each comparison, swap, relaxation, merge or placement as an explanation-annotated step object.'),
  bullet('Profiling — measuring time and memory for each algorithm invocation and for incremental input sizes.'),
  bullet('Entropy evaluation — computing Shannon entropy and the theoretical minimum encoded size of an input.'),
  bullet('Encoding / decoding — round-trip compression and reconstruction to verify losslessness.'),
  bullet('Graph relaxation and traversal — shortest-path, MST and topological computations with per-edge logging.'),
  H2('2.4 Flow Chart and Description'),
  P('The end-to-end control flow of a typical visualization request is as follows:'),
  numItem('The user selects an algorithm and enters input parameters (an array, graph, string, matrix or file) in the web client.'),
  numItem('On “Run”, the client serializes the parameters to JSON and issues a POST request to the corresponding FastAPI endpoint.'),
  numItem('FastAPI validates the payload against a Pydantic request model, rejecting malformed or oversized inputs with a descriptive error.'),
  numItem('The request is dispatched to the relevant pure-Python algorithm module.'),
  numItem('The algorithm executes, appending an explanation-annotated step object to a trace list at every meaningful state change, while the profiler records time and memory.'),
  numItem('The structured trace and benchmarks are serialized and returned with HTTP 200.'),
  numItem('The client steps or auto-plays through the trace, animating SVG components and displaying the natural-language explanation and metrics for the active step.'),
  H2('2.5 Design Justification'),
  bullet('The trace-driven design decouples computation from presentation, so a new algorithm needs only to emit steps — no rendering code changes.'),
  bullet('Pure-Python implementations keep the algorithms readable and close to textbook pseudocode, reinforcing the pedagogical goal.'),
  bullet('Per-step natural-language explanations turn every animation frame into a self-contained teaching statement.'),
  bullet('Bounded inputs guarantee that traces remain small and animations remain legible, prioritizing clarity over raw scale.'),
  bullet('Entropy-aware compression grounds an otherwise qualitative topic in an objective, provable lower bound.'),
];

// ===========================================================================
// CHAPTER 3 — IMPLEMENTATION DETAILS
// ===========================================================================
const ch3 = [
  H1('Chapter 3: Implementation Details'),
  H2('3.1 Implementation Approach'),
  P('The platform is implemented as a trace-producing algorithm engine behind a REST interface, consumed by an animated web client. Each algorithm is written as a self-contained Python module exposing a solver function that returns both the result and a list of step objects. A step object is a dictionary carrying the data-structure state relevant to that moment — for example the current array and pointer positions during sorting, or the distance vector during a relaxation — together with an explain field containing a human-readable description. The front end is agnostic to the specific algorithm: it consumes the generic step list and animates whichever fields are present.'),
  P('The compression subsystem follows the same philosophy. Every encoder accepts a byte string and returns the compressed payload along with auxiliary structures (codebooks, token logs or probability ranges) needed both for visualization and for exact reconstruction. A complementary decoder verifies that compression is lossless by reproducing the original bytes.'),
  H2('3.2 Software Design and Modularity'),
  P('The codebase is divided into clearly bounded modules, each with a single responsibility:'),
  bullet([T('algorithms/ ', { bold: true }), T('— one module per algorithm family (sorting, mst, dijkstra, bellman_ford, astar, knapsack, lcs, nqueens, strassen, topological, recursion, string_matching) plus the compression encoders (huffman, lz77, lzw, rle, bwt, deflate, arithmetic, entropy).')]),
  bullet([T('api.py ', { bold: true }), T('— the FastAPI controller defining one endpoint and Pydantic request model per feature, with per-algorithm error isolation.')]),
  bullet([T('utils/ ', { bold: true }), T('— cross-cutting services: the execution profiler and file handling.')]),
  bullet([T('frontend/app/ ', { bold: true }), T('— App-Router pages, one per visualizer, each fetching from its endpoint and rendering the trace.')]),
  bullet([T('frontend/components/ ', { bold: true }), T('— reusable UI: SVG tree and graph renderers, the theme toggle, the share-link and PDF-export controls, and the sidebar.')]),
  H2('3.3 Algorithms Implemented'),
  P('ByteForge implements the following algorithms, organized by paradigm and mapped to the DAA syllabus units:'),
  table([
    ['Category', 'Algorithms'],
    ['Brute Force', 'Bubble Sort, Selection Sort, Naive String Matching'],
    ['Divide & Conquer', 'Merge Sort, Quick Sort, Strassen’s Matrix Multiplication'],
    ['Decrease & Conquer', 'Kahn’s Topological Sort, DFS Topological Sort'],
    ['Transform & Conquer', 'Heap Sort, Horspool’s and Boyer–Moore matching'],
    ['Greedy', 'Huffman Coding, Kruskal’s & Prim’s MST, Dijkstra, Fractional Knapsack'],
    ['Dynamic Programming', '0/1 Knapsack, LCS, Floyd–Warshall, Bellman–Ford, Memoized Fibonacci'],
    ['Backtracking', 'N-Queens'],
    ['Space–Time Trade-off', 'Counting Sort, KMP, input-enhanced string matching'],
    ['Compression / Info-Theory', 'Huffman, LZ77, LZW, RLE, BWT, Arithmetic, DEFLATE, Shannon Entropy'],
  ], [2800, 6226]),
  H3('3.3.1 Newly Added Algorithm Modules'),
  P('As part of this work the engine was extended with six additional algorithms, each fully instrumented for visualization:'),
  bullet([T('Bellman–Ford ', { bold: true }), T('(Dynamic Programming) — relaxes all edges V−1 times, supports negative weights, and detects negative-weight cycles via a final verification pass, logging every relaxation.')]),
  bullet([T('A* Pathfinding ', { bold: true }), T('(informed search) — expands grid cells in order of f(n) = g(n) + h(n) using the admissible Manhattan-distance heuristic, recording the open/closed sets and f, g, h scores at each expansion.')]),
  bullet([T('Knuth–Morris–Pratt ', { bold: true }), T('(space–time trade-off) — pre-computes the longest-proper-prefix-suffix (failure) table to guarantee O(N + M) matching with no backtracking of the text pointer.')]),
  bullet([T('Longest Common Subsequence ', { bold: true }), T('(Dynamic Programming) — fills the 2-D DP table with diagonal/top/left provenance for each cell and performs a traceback to recover the subsequence.')]),
  bullet([T('N-Queens ', { bold: true }), T('(Backtracking) — places queens row by row using column and diagonal conflict sets, logging every attempt, conflict, placement and backtrack.')]),
  bullet([T('Strassen’s Matrix Multiplication ', { bold: true }), T('(Divide & Conquer) — computes the seven sub-products M1–M7 recursively and reports the multiplication count against the naive O(N³) baseline.')]),
  H2('3.4 Coding Best Practices'),
  H3('3.4.1 Modularity'),
  bullet('Each algorithm lives in its own module and exposes a single solver function with a well-defined return contract.'),
  bullet('The REST layer is isolated from algorithmic logic; endpoints merely validate, dispatch and serialize.'),
  bullet('Visualization is decoupled from computation through the generic step-object protocol.'),
  H3('3.4.2 Readability'),
  bullet('Every algorithm module opens with a docstring stating its paradigm, time and space complexity, and a short explanation.'),
  bullet('Meaningful names and textbook-faithful structure keep the code close to the pseudocode taught in class.'),
  bullet('Each emitted step carries a natural-language explanation, doubling as inline documentation of the algorithm’s logic.'),
  H3('3.4.3 Maintainability and Robustness'),
  bullet('Input bounds (recursion depth, graph size, string and matrix dimensions) are enforced centrally in the request models.'),
  bullet('Each compression algorithm is wrapped in independent error handling so that one failure never aborts a batch comparison.'),
  bullet('Round-trip decoders validate losslessness, providing a built-in correctness check for the compression engine.'),
];

// ===========================================================================
// CHAPTER 4 — RESULTS AND DISCUSSION
// ===========================================================================
const ch4 = [
  H1('Chapter 4: Results and Discussion'),
  H2('4.1 Overall Functional Results'),
  P('All algorithm modules were validated against known ground-truth outputs and integrated end-to-end through the running FastAPI service and Next.js client. Every endpoint returns correct results together with a complete, animatable execution trace. The compression engine produces lossless round-trips, and the analytical pages reproduce the expected complexity behaviour. The sections below summarize representative measured results.'),
  H2('4.2 Algorithm Complexity Reference'),
  P('The following matrix summarizes the paradigm and complexity of the principal algorithms, as documented in their implementations and demonstrated empirically by the platform:'),
  table([
    ['Algorithm', 'Paradigm', 'Time (Best / Avg / Worst)', 'Space'],
    ['Bubble Sort', 'Brute Force', 'O(N) / O(N²) / O(N²)', 'O(1)'],
    ['Quick Sort', 'Divide & Conquer', 'O(N log N) / O(N log N) / O(N²)', 'O(log N)'],
    ['Merge Sort', 'Divide & Conquer', 'O(N log N) (all cases)', 'O(N)'],
    ['Heap Sort', 'Transform & Conquer', 'O(N log N) (all cases)', 'O(1)'],
    ['Counting Sort', 'Space–Time Trade-off', 'O(N + K) (all cases)', 'O(N + K)'],
    ['Huffman Coding', 'Greedy', 'O(N log K)', 'O(K)'],
    ['Dijkstra', 'Greedy', 'O((V + E) log V)', 'O(V + E)'],
    ['Bellman–Ford', 'Dynamic Programming', 'O(V · E)', 'O(V)'],
    ['Kruskal / Prim', 'Greedy', 'O(E log E) / O(E log V)', 'O(V + E)'],
    ['A* Search', 'Informed Search', 'O(E log V)', 'O(V)'],
    ['0/1 Knapsack', 'Dynamic Programming', 'O(N · W)', 'O(N · W)'],
    ['LCS', 'Dynamic Programming', 'O(N · M)', 'O(N · M)'],
    ['KMP', 'Space–Time Trade-off', 'O(N + M)', 'O(M)'],
    ['N-Queens', 'Backtracking', 'O(N!) (pruned)', 'O(N)'],
    ['Strassen', 'Divide & Conquer', 'O(N^2.807)', 'O(N²)'],
  ], [2000, 2200, 3326, 1500], { boldFirst: true }),
  H2('4.3 String-Matching Comparison'),
  P('Running the four matching algorithms on the benchmark text “ABABDABACDABABCABAB” with the pattern “ABABCABAB” yields the comparison counts below. The input-enhanced and space–time-trade-off algorithms substantially reduce character comparisons relative to the naive approach, confirming the theoretical advantage of pre-processing the pattern.'),
  table([
    ['Algorithm', 'Strategy', 'Character Comparisons'],
    ['Naive', 'Brute force, left-to-right', '29'],
    ['Knuth–Morris–Pratt', 'Failure (LPS) table', '23'],
    ['Horspool / Boyer–Moore', 'Bad-character shift table', 'Fewer via right-to-left skips'],
  ], [2800, 4000, 2226]),
  P('The measured KMP result of 23 comparisons versus the naive 29 directly demonstrates how the failure table avoids re-examining already-matched text, validating the O(N + M) bound.', { before: 80 }),
  H2('4.4 Shortest-Path with Negative Edges'),
  P('On the directed graph A→B (4), A→C (2), B→C (−3), B→D (2), C→D (4), Bellman–Ford correctly computes the shortest path A→B→C→D with total cost 5 — a route that exploits the negative B→C edge and that Dijkstra’s greedy strategy cannot discover. A separate graph containing a negative-weight cycle is correctly flagged by the verification pass, demonstrating cycle detection.'),
  table([
    ['Vertex', 'A', 'B', 'C', 'D'],
    ['Shortest distance from A', '0', '4', '1', '5'],
  ], [3026, 1500, 1500, 1500, 1500], { noHead: false, boldFirst: true }),
  H2('4.5 Divide-and-Conquer Multiplication Efficiency'),
  P('For two 4×4 integer matrices, the naive algorithm performs 64 scalar multiplications (N³), whereas Strassen’s method performs only 49 (7^log₂N), a reduction of roughly 23%. Both produce identical product matrices, confirming correctness while illustrating the asymptotic advantage of the divide-and-conquer reformulation.'),
  table([
    ['Method', 'Scalar Multiplications (4×4)', 'Result Correct'],
    ['Naive (row × column)', '64', 'Yes'],
    ['Strassen (M1–M7)', '49', 'Yes'],
  ], [3526, 3500, 2000]),
  H2('4.6 Compression and Entropy Results'),
  P('The compression workspace evaluates each encoder against the Shannon-entropy lower bound. On low-entropy inputs (long runs and repeated substrings) the dictionary and run-length methods achieve high compression ratios approaching the entropy limit, while on high-entropy inputs all methods converge towards the original size — a direct, observable demonstration of Shannon’s source-coding theorem. Huffman coding is shown to be optimal among prefix codes for a known symbol distribution, and every encoder’s output is verified by a matching decoder for losslessness.'),
  H2('4.7 Empirical Complexity Verification'),
  P('The verification page profiles each algorithm over a sequence of increasing input sizes and plots measured execution time against input size. The resulting curves visibly track their theoretical growth rates — linear, log-linear and quadratic algorithms separate cleanly as input size increases — allowing students to confirm asymptotic analysis empirically rather than accepting it on authority.'),
  H2('4.8 Handling of Edge Cases'),
  bullet('Single-symbol input to Huffman coding is handled by assigning a one-bit code, avoiding an empty codebook.'),
  bullet('Graphs with negative-weight cycles are detected and reported rather than producing meaningless distances.'),
  bullet('Recursion and graph sizes are bounded so that pathological inputs cannot exhaust memory or produce unreadable traces.'),
  bullet('Empty or malformed requests are rejected at the API boundary with descriptive HTTP error messages.'),
  bullet('Backtracking and trace logs are capped, with truncation flagged, so that large search spaces degrade gracefully.'),
];

// ===========================================================================
// CHAPTER 5 — CONCLUSION AND FUTURE SCOPE
// ===========================================================================
const ch5 = [
  H1('Chapter 5: Conclusion and Future Scope'),
  H2('5.1 Conclusion'),
  P('This project set out to address a persistent difficulty in teaching the Design and Analysis of Algorithms: the gap between an algorithm’s static description and its dynamic behaviour. ByteForge bridges that gap by unifying more than twenty algorithms across every major paradigm into a single interactive platform that executes, instruments and animates them, while empirically verifying their complexity and quantifying compression against the Shannon-entropy bound. The trace-driven architecture cleanly separates computation from presentation, the per-step natural-language explanations make each animation frame self-explanatory, and the measured results — from KMP’s reduced comparison count to Strassen’s multiplication savings to entropy-bounded compression ratios — confirm both the correctness and the pedagogical value of the system.'),
  H2('5.2 Real-World Applicability'),
  P('Although built as an educational laboratory, ByteForge’s design has wider relevance. The instrumented-trace approach is directly applicable to algorithm-visualization tools, technical-interview preparation platforms and classroom demonstration software. The decoupled FastAPI + Next.js architecture is representative of modern production web systems, and the compression and information-theory components provide a foundation for exploring real data-encoding pipelines. The platform requires no specialized hardware and runs on any standard machine, making it readily deployable for coursework and self-study.'),
  H2('5.3 Future Scope and Innovation'),
  bullet('A universal trace-player component with a timeline scrubber, variable playback speed and synchronized pseudocode-line highlighting across all visualizers.'),
  bullet('An interactive graph editor allowing users to construct arbitrary graphs by direct manipulation for the MST, shortest-path and scheduling modules.'),
  bullet('Automatic curve fitting on the verification page to report the best-fit empirical complexity class with a goodness-of-fit measure.'),
  bullet('Canvas-based rendering for large sorting inputs, enabling smooth animation of thousands of elements.'),
  bullet('Expansion of the algorithm catalogue to include Bellman-Held-Karp, suffix structures, network flow and additional approximation algorithms.'),
  bullet('Cloud deployment with a configurable API origin so the platform can be hosted and shared publicly.'),
];

// ===========================================================================
// REFERENCES
// ===========================================================================
const references = [
  H1('References'),
  P('[1] T. H. Cormen, C. E. Leiserson, R. L. Rivest and C. Stein, Introduction to Algorithms, 4th ed. Cambridge, MA: MIT Press, 2022.', { after: 100, line: 320 }),
  P('[2] A. Levitin, Introduction to the Design and Analysis of Algorithms, 3rd ed. Boston, MA: Pearson, 2012.', { after: 100, line: 320 }),
  P('[3] D. A. Huffman, “A Method for the Construction of Minimum-Redundancy Codes,” Proceedings of the IRE, vol. 40, no. 9, pp. 1098–1101, 1952.', { after: 100, line: 320 }),
  P('[4] J. Ziv and A. Lempel, “A Universal Algorithm for Sequential Data Compression,” IEEE Transactions on Information Theory, vol. 23, no. 3, pp. 337–343, 1977.', { after: 100, line: 320 }),
  P('[5] C. E. Shannon, “A Mathematical Theory of Communication,” The Bell System Technical Journal, vol. 27, pp. 379–423, 1948.', { after: 100, line: 320 }),
  P('[6] D. E. Knuth, J. H. Morris and V. R. Pratt, “Fast Pattern Matching in Strings,” SIAM Journal on Computing, vol. 6, no. 2, pp. 323–350, 1977.', { after: 100, line: 320 }),
  P('[7] V. Strassen, “Gaussian Elimination is Not Optimal,” Numerische Mathematik, vol. 13, no. 4, pp. 354–356, 1969.', { after: 100, line: 320 }),
  P('[8] FastAPI Documentation. [Online]. Available: https://fastapi.tiangolo.com/', { after: 100, line: 320 }),
  P('[9] Next.js Documentation. [Online]. Available: https://nextjs.org/docs', { after: 100, line: 320 }),
];

// ===========================================================================
// ASSEMBLE DOCUMENT
// ===========================================================================
const doc = new Document({
  creator: 'ByteForge Team',
  title: 'ByteForge — Algorithm Visualizer and Data Compression Engine',
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: FONT }, paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: FONT }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: FONT }, paragraph: { spacing: { before: 140, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bul', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ] },
      { reference: 'num', levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ] },
    ],
  },
  sections: [
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: [...cover, ...certificate, ...declaration, ...toc],
    },
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [T('', {}), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })] }) },
      children: [
        ...abstract, ...ch1, ...ch2, ...ch3, ...ch4, ...ch5, ...references,
      ],
    },
  ],
});

const OUT = path.join(__dirname, 'ByteForge_DAA_Report.docx');
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(OUT, buf); console.log('WROTE', OUT, buf.length, 'bytes'); });
