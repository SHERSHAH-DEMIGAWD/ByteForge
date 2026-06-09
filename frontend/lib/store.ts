import { create } from 'zustand'

export interface AlgorithmResult {
  size: number
  ratio: number
  time: number
  memory: number
  codebook?: Record<string, string>
  tree?: any
  tokens?: any[]
  sequences?: any[]
  intermediate?: any
  payload_base64?: string
}

export interface CompressionResult {
  original_size: number
  shannon_entropy: number
  theoretical_min_size: number
  algorithms: {
    huffman?: AlgorithmResult
    lz77?: AlgorithmResult
    rle?: AlgorithmResult
    bwt?: AlgorithmResult
    deflate?: AlgorithmResult
    lzw?: AlgorithmResult
    arithmetic?: AlgorithmResult
  }
}

interface CompressionStore {
  inputData: string | null
  selectedAlgorithms: Set<string>
  engineMode: 'naive' | 'optimized'
  results: CompressionResult | null
  isLoading: boolean
  currentFile: string | null
  
  // Actions
  setInputData: (data: string) => void
  toggleAlgorithm: (algo: string) => void
  setEngineMode: (mode: 'naive' | 'optimized') => void
  setResults: (results: CompressionResult) => void
  setIsLoading: (loading: boolean) => void
  setCurrentFile: (file: string) => void
  resetResults: () => void
}

export const useCompressionStore = create<CompressionStore>((set) => ({
  inputData: null,
  selectedAlgorithms: new Set(['huffman', 'lz77', 'rle', 'bwt', 'deflate', 'lzw', 'arithmetic']),
  engineMode: 'optimized',
  results: null,
  isLoading: false,
  currentFile: null,

  setInputData: (data) => set({ inputData: data }),
  
  toggleAlgorithm: (algo) => set((state) => {
    const newSet = new Set(state.selectedAlgorithms)
    if (newSet.has(algo)) {
      newSet.delete(algo)
    } else {
      newSet.add(algo)
    }
    return { selectedAlgorithms: newSet }
  }),

  setEngineMode: (mode) => set({ engineMode: mode }),
  
  setResults: (results) => set({ results }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setCurrentFile: (file) => set({ currentFile: file }),
  
  resetResults: () => set({ results: null, inputData: null }),
}))
