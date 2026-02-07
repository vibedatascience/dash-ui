import './globals.css'
import { Newsreader, Outfit, JetBrains_Mono } from 'next/font/google'

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata = {
  title: 'Dash — AI Data Analyst',
  description: 'AI-powered data analyst that queries databases, analyzes data, and creates visualizations',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
