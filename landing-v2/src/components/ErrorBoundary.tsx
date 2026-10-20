import { Component, type ReactNode } from 'react'

/** Si un hijo rompe al renderizar, muestra `fallback` en vez de dejar toda la página en blanco. */
export default class ErrorBoundary extends Component<
  { fallback?: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
