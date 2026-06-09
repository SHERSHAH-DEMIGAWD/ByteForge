'use client'

export default function GuidePage() {
  const algorithms = [
    {
      name: 'Huffman Coding',
      paradigm: 'Greedy Algorithm',
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      bestCase: 'O(n log n) - always',
      worstCase: 'O(n log n) - always',
      description:
        'A greedy algorithm that builds an optimal binary tree by repeatedly combining the two symbols with smallest frequency. The resulting variable-length codes are optimal for lossless compression of a given distribution.',
      useCases:
        'Text with non-uniform character distribution. Excellent entropy coder. Often used as a final stage in multi-algorithm pipelines (e.g., DEFLATE, JPEG).',
      advantages: 'Provably optimal codes for a given frequency distribution. Fast encoding/decoding.',
      disadvantages: 'Requires frequency analysis and codebook transmission. Less effective on uniform distributions.',
    },
    {
      name: 'LZ77 Compression',
      paradigm: 'Dictionary-Based (Sliding Window)',
      timeComplexity: 'O(n²) naive, O(n) with hash tables',
      spaceComplexity: 'O(w) where w = window size',
      bestCase: 'O(n) with hash tables',
      worstCase: 'O(n²) without optimization',
      description:
        'A dictionary-based algorithm using a sliding window. It finds matching patterns within a fixed-size window and encodes them as (offset, length, next_char) triples. Lazy matching can improve compression further.',
      useCases:
        'Data with local repetition patterns. Foundation for ZIP, GZIP, and other real-world standards. Effective on general-purpose data.',
      advantages: 'Adapts to patterns in the data. No frequency analysis needed. Window size is configurable.',
      disadvantages: 'Can be slow without optimization. Window size limits how far back it can reference.',
    },
    {
      name: 'RLE (Run-Length Encoding)',
      paradigm: 'Brute Force / Simple',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1) excluding output',
      bestCase: 'O(n) - linear scan',
      worstCase: 'O(n) - linear scan',
      description:
        'The simplest compression algorithm: counts consecutive identical characters and stores count-character pairs. Can expand data if there are few runs.',
      useCases:
        'Data with long runs of identical characters (e.g., uncompressed images, fax data, certain binary formats). Not suitable for general text.',
      advantages: 'Extremely simple and fast. Minimal memory overhead. Deterministic.',
      disadvantages: 'Highly specialized. Can actually expand data if no long runs exist.',
    },
    {
      name: 'BWT Pipeline',
      paradigm: 'Transform-Based',
      timeComplexity: 'O(n log n) standard, O(n) induced sorting',
      spaceComplexity: 'O(n)',
      bestCase: 'O(n) with linear-time suffix sorting',
      worstCase: 'O(n²) for comparison-based sorting',
      description:
        'The Burrows-Wheeler Transform reorders characters to group similar ones together, followed by Move-to-Front (MTF) encoding. This transform makes the data more compressible by subsequent stages.',
      useCases:
        'Highly compressible text data. Popular in bzip2. Less effective on random or already-compressed data.',
      advantages: 'Can achieve excellent compression ratios. Reversible. Exposes data structure for further compression.',
      disadvantages: 'Requires suffix sorting (expensive). Needs temporary storage. Less effective on random data.',
    },
    {
      name: 'DEFLATE Compression',
      paradigm: 'Hybrid / Two-Stage',
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      bestCase: 'O(n) for highly compressible data',
      worstCase: 'O(n log n) for random data',
      description:
        'A hybrid algorithm combining LZ77 dictionary compression with Huffman coding. First, LZ77 finds repeated patterns and creates tokens. Then Huffman encoding compresses those tokens. This synergy achieves better results than either alone.',
      useCases:
        'Industry standard for general-purpose compression. ZIP, gzip, HTTP compression, PNG, WebP. Balances compression ratio and speed.',
      advantages: 'Excellent compression on diverse data. Fast. Widely compatible. Adjustable compression levels.',
      disadvantages: 'More complex to implement. Slower than simple algorithms. Not optimal for specialized data.',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Academic Complexity Guide</h1>
        <p className="text-muted-foreground">
          Detailed analysis of compression algorithm paradigms, complexities, and use cases for academic study
        </p>
      </div>

      <div className="space-y-8">
        {algorithms.map((algo) => (
          <div key={algo.name} className="bg-card/50 backdrop-blur-md border border-border/30 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-border/30 px-6 py-4">
              <h2 className="text-2xl font-bold text-primary mb-1">{algo.name}</h2>
              <p className="text-sm text-muted-foreground">{algo.paradigm}</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Complexity Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-background/30 rounded-lg p-4 border border-border/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Time</p>
                  <p className="text-sm font-mono text-accent">{algo.timeComplexity}</p>
                </div>
                <div className="bg-background/30 rounded-lg p-4 border border-border/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Space</p>
                  <p className="text-sm font-mono text-accent">{algo.spaceComplexity}</p>
                </div>
                <div className="bg-background/30 rounded-lg p-4 border border-border/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Best Case</p>
                  <p className="text-sm font-mono text-accent">{algo.bestCase}</p>
                </div>
                <div className="bg-background/30 rounded-lg p-4 border border-border/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Worst Case</p>
                  <p className="text-sm font-mono text-accent">{algo.worstCase}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-foreground mb-3">How It Works</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{algo.description}</p>
              </div>

              {/* Grid for remaining sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Use Cases */}
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-3">Best Use Cases</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{algo.useCases}</p>
                </div>

                {/* Advantages/Disadvantages */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-accent mb-3">Advantages</h3>
                    <ul className="space-y-2">
                      {algo.advantages.split('. ').map((adv, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-muted-foreground">
                          <span className="text-accent mt-1">✓</span>
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-destructive mb-3">Disadvantages</h3>
                    <ul className="space-y-2">
                      {algo.disadvantages.split('. ').map((dis, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-muted-foreground">
                          <span className="text-destructive mt-1">✕</span>
                          <span>{dis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Key Insights */}
      <div className="mt-12 bg-card/50 backdrop-blur-md border border-border/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Key Takeaways</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-l-4 border-primary pl-4">
            <p className="font-bold text-foreground mb-2">No One-Size-Fits-All Solution</p>
            <p className="text-sm text-muted-foreground">
              Different algorithms excel under different conditions. RLE is unbeatable for long runs but terrible for varied data.
            </p>
          </div>
          <div className="border-l-4 border-accent pl-4">
            <p className="font-bold text-foreground mb-2">Hybrid Approaches Win</p>
            <p className="text-sm text-muted-foreground">
              DEFLATE&apos;s combination of LZ77 and Huffman shows how multiple techniques can complement each other.
            </p>
          </div>
          <div className="border-l-4 border-primary pl-4">
            <p className="font-bold text-foreground mb-2">Paradigm Matters</p>
            <p className="text-sm text-muted-foreground">
              Greedy (Huffman), Dictionary-based (LZ77), and Transform-based (BWT) each have fundamentally different strengths.
            </p>
          </div>
          <div className="border-l-4 border-accent pl-4">
            <p className="font-bold text-foreground mb-2">Trade-offs Are Constant</p>
            <p className="text-sm text-muted-foreground">
              Speed vs. compression ratio, memory vs. time, simplicity vs. effectiveness are eternal tensions in algorithm design.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
