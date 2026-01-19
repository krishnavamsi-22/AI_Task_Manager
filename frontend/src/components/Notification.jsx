import React from 'react';
import { toast } from 'react-toastify';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

const Notification = ({ message, type, onClose }) => {
  // This component is now replaced by react-toastify
  // But we keep it for backward compatibility
  React.useEffect(() => {
    if (message) {
      switch (type) {
        case 'success':
          toast.success(message, {
            icon: <CheckCircle className="w-5 h-5" />,
            className: 'ai-badge-success',
          });
          break;
        case 'error':
          toast.error(message, {
            icon: <XCircle className="w-5 h-5" />,
            className: 'ai-badge-error',
          });
          break;
        case 'warning':
          toast.warning(message, {
            icon: <AlertCircle className="w-5 h-5" />,
            className: 'ai-badge-warning',
          });
          break;
        case 'info':
        default:
          toast.info(message, {
            icon: <Info className="w-5 h-5" />,
            className: 'ai-badge-info',
          });
          break;
      }
      if (onClose) onClose();
    }
  }, [message, type, onClose]);

  return null; // react-toastify handles the rendering
};

// Export utility functions for direct toast usage
export const showSuccess = (message) => {
  toast.success(message, {
    icon: <CheckCircle className="w-5 h-5" />,
  });
};

export const showError = (message) => {
  toast.error(message, {
    icon: <XCircle className="w-5 h-5" />,
  });
};

export const showWarning = (message) => {
  toast.warning(message, {
    icon: <AlertCircle className="w-5 h-5" />,
  });
};

export const showInfo = (message) => {
  toast.info(message, {
    icon: <Info className="w-5 h-5" />,
  });
};

export default Notification;
