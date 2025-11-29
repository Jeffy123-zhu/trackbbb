import './globals.css'

export const metadata = {
  title: 'AI Commit - AI-Powered Git Commit Message Generator',
  description: 'Generate meaningful commit messages with AI. Supports OpenAI, Claude, and Ollama.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">{children}</body>
    </html>
  )
}
