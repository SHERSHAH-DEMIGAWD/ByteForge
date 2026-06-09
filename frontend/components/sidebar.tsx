'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Zap, BarChart3, Code, BookOpen, Unlock } from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/huffman', label: 'Huffman Coding', icon: Zap },
  { href: '/lz77', label: 'LZ77 Compression', icon: Zap },
  { href: '/rle', label: 'RLE Encoding', icon: Zap },
  { href: '/bwt', label: 'BWT Pipeline', icon: Zap },
  { href: '/deflate', label: 'Deflate Compression', icon: Zap },
  { href: '/decoder', label: 'The Decoder Node', icon: Unlock },
  { href: '/analytics', label: 'Benchmark & Analytics', icon: BarChart3 },
  { href: '/verification', label: 'Big-O Verification', icon: Code },
  { href: '/guide', label: 'Complexity Guide', icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-md fixed h-screen overflow-y-auto">
      {/* Logo */}
      <div className="sticky top-0 p-6 border-b border-border/50 bg-card/80 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          ByteForge
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Compression Engine</p>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        <div className="mb-6 px-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Core</p>
        </div>
        
        {links.slice(0, 1).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              pathname === href
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-foreground/70 hover:text-foreground hover:bg-card/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}

        <div className="mt-6 mb-2 px-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Algorithms</p>
        </div>
        
        {links.slice(1, 6).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              pathname === href
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-foreground/70 hover:text-foreground hover:bg-card/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}

        <div className="mt-6 mb-2 px-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analysis</p>
        </div>
        
        {links.slice(6).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              pathname === href
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-foreground/70 hover:text-foreground hover:bg-card/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
