'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { useCompressionStore } from '@/lib/store'

const SAMPLE_FILES = [
  { name: 'Lorem Ipsum', file: 'lorem.txt', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' },
  { name: 'DNA Sequence', file: 'dna.txt', content: 'ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG' },
  { name: 'Repetitive Text', file: 'repetitive.txt', content: 'AAAAAABBBBBBCCCCCCDDDDDDEEEEEEAAAAAA BBBBBBCCCCCCDDDDDDEEEEEEAAAAAA BBBBBBCCCCCCDDDDDDEEEEEE'.repeat(5) },
]

export function FileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [textInput, setTextInput] = useState('')
  const setInputData = useCompressionStore((state) => state.setInputData)
  const currentFile = useCompressionStore((state) => state.currentFile)
  const setCurrentFile = useCompressionStore((state) => state.setCurrentFile)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setInputData(content)
      setCurrentFile(file.name)
    }
    reader.readAsText(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleSampleFile = (content: string, name: string) => {
    setInputData(content)
    setCurrentFile(name)
    setTextInput('')
  }

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setInputData(textInput)
      setCurrentFile('Custom Input')
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer overflow-hidden ${
          dragActive
            ? 'border-primary/60 bg-primary/10'
            : 'border-border/50 hover:border-primary/40 bg-card/30'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {dragActive && (
          <div className="absolute inset-0 z-10 bg-transparent" />
        )}
        <div className="pointer-events-none">
          {currentFile ? (
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 mx-auto mb-4 text-primary" />
              <p className="text-sm font-bold text-primary">Ready: {currentFile}</p>
              <p className="text-xs text-muted-foreground mt-1">Click compress to continue or browse to replace</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-4 text-primary/60" />
              <p className="text-sm font-medium">Drag and drop your file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Text Input Tab */}
      <div>
        <label className="text-sm font-medium block mb-2">Or paste text directly:</label>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="w-full h-24 bg-card/50 border border-border/30 rounded-lg p-3 text-sm focus:border-primary/50 focus:outline-none resize-none"
          placeholder="Paste your text here..."
        />
        <button
          onClick={handleTextSubmit}
          className="mt-2 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:opacity-90 transition-all"
        >
          Use Text Input
        </button>
      </div>

      {/* Sample Files */}
      <div>
        <label className="text-sm font-medium block mb-3">Pre-generated samples:</label>
        <div className="grid grid-cols-1 gap-2">
          {SAMPLE_FILES.map(({ name, content }) => (
            <button
              key={name}
              onClick={() => handleSampleFile(content, name)}
              className="text-left px-4 py-3 bg-card/50 border border-border/30 rounded-lg hover:border-primary/50 hover:bg-card/70 transition-all"
            >
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground mt-1">{content.length} bytes</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
