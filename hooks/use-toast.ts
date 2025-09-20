import * as React from "react"

type ToastProps = {
    title?: string
    description?: string
    variant?: "default" | "destructive"
}

export const useToast = (): { toast: (props: ToastProps) => void } => {
    const toast = React.useCallback(({ title, description }: ToastProps) => {
        // Simple console log for now - can be replaced with actual toast implementation
        console.log(`${title}: ${description}`)
    }, [])

    return { toast }
}
