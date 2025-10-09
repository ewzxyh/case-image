import * as React from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export const useToast = (): { toast: (props: ToastProps) => void } => {
  const toast = React.useCallback(
    ({ title, description }: ToastProps) => {},
    []
  );

  return { toast };
};
