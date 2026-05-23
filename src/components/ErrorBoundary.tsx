import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center max-w-md px-6">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="mt-4 text-lg font-medium">页面发生错误</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error.message || '未知错误'}
            </p>
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={() => {
                this.handleReset()
                window.location.reload()
              }}
            >
              <RefreshCw className="h-4 w-4" />
              重新加载
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
