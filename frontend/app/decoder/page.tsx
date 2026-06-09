'use client'

import { useState } from 'react'
import { UploadCloud, Unlock, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function DecoderPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDecoding, setIsDecoding] = useState(false)
  const [result, setResult] = useState<{ text: string, time: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0]
      if (dropped.name.endsWith('.bfg')) {
        setFile(dropped)
        setResult(null)
        setError(null)
      } else {
        setError('Please upload a valid .bfg (ByteForge) payload.')
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleDecode = async () => {
    if (!file) return

    setIsDecoding(true)
    setError(null)
    setResult(null)

    try {
      const text = await file.text()
      const payload = JSON.parse(text)

      const start = performance.now()
      
      const response = await fetch('http://localhost:8000/decompress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_base64: payload.data_base64,
          algorithm: payload.algorithm,
          metadata: payload.metadata
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Decompression failed')
      }

      const data = await response.json()
      const end = performance.now()

      setResult({
        text: data.decompressed_text,
        time: end - start
      })

    } catch (err: any) {
      setError(err.message || 'Failed to decode file.')
    } finally {
      setIsDecoding(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-green-500 mb-2 flex items-center gap-3">
          <Unlock className="w-8 h-8 text-accent" />
          The Decoder Node
        </h1>
        <p className="text-muted-foreground">
          Upload a downloaded <code>.bfg</code> payload to losslessly reconstruct the original data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              file ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50 hover:bg-card/50'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".bfg"
              onChange={handleFileInput}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <UploadCloud className={`w-16 h-16 mb-4 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
              <h3 className="text-xl font-bold mb-2">
                {file ? file.name : 'Drop .bfg Payload Here'}
              </h3>
              <p className="text-muted-foreground mb-6">
                or click to browse your files
              </p>
            </label>
          </div>

          <button
            onClick={handleDecode}
            disabled={!file || isDecoding}
            className="w-full py-4 bg-gradient-to-r from-accent to-green-600 text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2 text-lg"
          >
            {isDecoding ? 'Decoding...' : 'Reconstruct Data Losslessly'}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div>
          {result ? (
            <div className="bg-card/50 border border-border/30 rounded-lg p-6 h-full flex flex-col animate-in fade-in zoom-in duration-500">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/30">
                <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  Successfully Reconstructed
                </h3>
                <div className="text-sm text-muted-foreground">
                  Time: <span className="text-accent font-mono">{result.time.toFixed(2)}ms</span>
                </div>
              </div>
              
              <div className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-sm text-foreground overflow-y-auto custom-scrollbar border border-border/20 whitespace-pre-wrap">
                {result.text}
              </div>
            </div>
          ) : (
            <div className="bg-card/20 border border-border/20 rounded-lg p-6 h-full flex flex-col items-center justify-center text-center">
              <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg">
                Reconstructed data will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
