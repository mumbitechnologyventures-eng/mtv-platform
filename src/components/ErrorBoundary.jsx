import { Component } from 'react'

// Catches render errors and failed lazy-chunk loads (which happen when a user
// has an old tab open after a new deploy) and shows a recoverable screen instead
// of a blank white page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Kept to console only — no third-party error service wired up.
    console.error('App error boundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="max-w-sm text-sm text-sand-400">
          The page failed to load. This usually clears with a refresh.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-clay px-4 py-2 text-sm font-medium text-ink-900"
        >
          Reload
        </button>
      </div>
    )
  }
}
