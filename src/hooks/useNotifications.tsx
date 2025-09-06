import { useCallback } from "react";
// import { toast } from "sonner";
const toast = { 
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg),
  info: (msg: string) => console.info('ℹ️', msg)
};

type NotificationType = "success" | "error" | "info" | "warning" | "loading";

interface NotificationOptions {
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const getNotificationStyle = (type: NotificationType) => {
  const baseStyle = {
    background: "#1a1a1a",
    border: "1px solid",
    color: "#ffffff",
    fontFamily: "monospace",
  };

  switch (type) {
    case "success":
      return { ...baseStyle, borderColor: "#00ff00", color: "#00ff00" };
    case "error":
      return { ...baseStyle, borderColor: "#ff0040", color: "#ff0040" };
    case "warning":
      return { ...baseStyle, borderColor: "#F59E0B", color: "#F59E0B" };
    case "info":
      return { ...baseStyle, borderColor: "#00aaff", color: "#00aaff" };
    case "loading":
      return { ...baseStyle, borderColor: "#888888", color: "#888888" };
    default:
      return baseStyle;
  }
};

export const useNotifications = () => {
  const showNotification = useCallback(
    (
      type: NotificationType,
      message: string,
      options: NotificationOptions = {},
    ) => {
      const {
        duration = 4000,
        position = "top-right",
        dismissible = true,
        action,
      } = options;

      const toastOptions = {
        duration: type === "loading" ? Infinity : duration,
        position,
        style: getNotificationStyle(type),
        className: "siam-notification",
      };

      let toastId: string;

      if (type === "loading") {
        toastId = toast.loading(message, toastOptions);
      } else {
        const content = action ? (
          <div className="flex items-center justify-between w-full">
            <span>{message}</span>
            <button
              onClick={() => {
                action.onClick();
                if (dismissible) toast.dismiss();
              }}
              className="ml-4 px-2 py-1 text-xs bg-transparent border border-current hover:bg-current hover:text-black transition-colors"
              data-testid="notification-action"
            >
              {action.label}
            </button>
          </div>
        ) : (
          message
        );

        switch (type) {
          case "success":
            toastId = toast.success(content, toastOptions);
            break;
          case "error":
            toastId = toast.error(content, toastOptions);
            break;
          default:
            toastId = toast(content, toastOptions);
        }
      }

      return toastId;
    },
    [],
  );

  const success = useCallback(
    (message: string, options?: NotificationOptions) => {
      return showNotification("success", message, options);
    },
    [showNotification],
  );

  const error = useCallback(
    (message: string, options?: NotificationOptions) => {
      return showNotification("error", message, options);
    },
    [showNotification],
  );

  const warning = useCallback(
    (message: string, options?: NotificationOptions) => {
      return showNotification("warning", message, options);
    },
    [showNotification],
  );

  const info = useCallback(
    (message: string, options?: NotificationOptions) => {
      return showNotification("info", message, options);
    },
    [showNotification],
  );

  const loading = useCallback(
    (message: string, options?: NotificationOptions) => {
      return showNotification("loading", message, options);
    },
    [showNotification],
  );

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  const promise = useCallback(
    <T,>(
      promiseOrFunction: Promise<T> | (() => Promise<T>),
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      },
      options?: NotificationOptions,
    ) => {
      const style = getNotificationStyle("loading");

      return toast.promise(
        typeof promiseOrFunction === "function"
          ? promiseOrFunction()
          : promiseOrFunction,
        {
          loading: messages.loading,
          success: messages.success,
          error: messages.error,
        },
        {
          style,
          position: options?.position || "top-right",
          ...options,
        },
      );
    },
    [],
  );

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    promise,
    showNotification,
  };
};

export default useNotifications;
