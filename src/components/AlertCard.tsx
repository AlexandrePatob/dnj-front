import { ReactNode } from "react";

interface AlertCardProps {
  type: "warning" | "info" | "success";
  icon: ReactNode;
  title: string;
  description: string;
  subtitle?: string;
  className?: string;
}

export function AlertCard({ 
  type, 
  icon, 
  title, 
  description, 
  subtitle,
  className = "" 
}: AlertCardProps) {
  const getTypeStyles = () => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-2 border-yellow-200";
      case "info":
        return "bg-blue-50 border-2 border-blue-200";
      case "success":
        return "bg-green-50 border-2 border-green-200";
      default:
        return "bg-blue-50 border-2 border-blue-200";
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case "warning":
        return "bg-yellow-100";
      case "info":
        return "bg-blue-100";
      case "success":
        return "bg-green-100";
      default:
        return "bg-blue-100";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "warning":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      default:
        return "text-blue-600";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "warning":
        return "text-yellow-800";
      case "info":
        return "text-blue-800";
      case "success":
        return "text-green-800";
      default:
        return "text-blue-800";
    }
  };

  return (
    <div className={`max-w-md mx-auto mb-6 ${className}`}>
      <div className={`${getTypeStyles()} rounded-2xl p-4 text-center`}>
        <div className={`w-12 h-12 ${getIconBgColor()} rounded-full flex items-center justify-center mx-auto mb-3`}>
          <div className={getIconColor()}>
            {icon}
          </div>
        </div>
        <h3 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
          {title}
        </h3>
        <p className={`${getTextColor()} text-sm`}>
          {description}
        </p>
        {subtitle && (
          <p className={`${getTextColor()} text-xs mt-2 opacity-80`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
