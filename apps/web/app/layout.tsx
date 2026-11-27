import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600'] })

export const metadata: Metadata = {
  title: 'Orca',
  description: 'AI coworkers workspace',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0a0a0a] text-zinc-200 antialiased">
        <div className="flex h-screen">
          <div className="w-64 shrink-0 flex-col border-r border-white/[0.08] bg-[#0d0d0d]">
            <div className="flex items-center gap-2 px-4 py-4">
              <span className="text-sm font-medium text-zinc-100">Orca</span>
            </div>
            <div className="px-3 pb-2">
              <input
                placeholder="New space, press Enter"
                className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-f54e00/50"
              />
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
              <p className="px-1 py-1 text-xs text-zinc-600">Spaces</p>
            </nav>
          </div>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
