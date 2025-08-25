import { ReactNode } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface StatusCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  status?: "loading" | "error" | "success" | "info";
  showSpinner?: boolean;
  spinnerColor?: "blue" | "red" | "green" | "gray";
  children?: ReactNode;
  className?: string;
}

export function StatusCard({ 
  icon, 
  title, 
  description, 
  status = "info",
  showSpinner = false,
  spinnerColor = "blue",
  children,
  className = ""
}: StatusCardProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "error":
        return "border-red-200 bg-red-50";
      case "success":
        return "border-green-200 bg-green-50";
      case "loading":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const getIconBgColor = () => {
    switch (status) {
      case "error":
        return "bg-red-100";
      case "success":
        return "bg-green-100";
      case "loading":
        return "bg-blue-100";
      default:
        return "bg-gray-100";
    }
  };

  const getIconColor = () => {
    switch (status) {
      case "error":
        return "text-red-600";
      case "success":
        return "text-green-600";
      case "loading":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className={`bg-white rounded-2xl shadow-lg p-6 border ${getStatusStyles()} text-center`}>
        <div className={`w-16 h-16 ${getIconBgColor()} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <div className={getIconColor()}>
            {icon}
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
        
        {description && (
          <p className="text-gray-600 text-sm mb-4">{description}</p>
        )}

        {showSpinner && (
          <div className="flex justify-center mb-4">
            <LoadingSpinner color={spinnerColor} />
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
