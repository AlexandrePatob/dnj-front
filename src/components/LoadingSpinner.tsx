interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "blue" | "red" | "green" | "gray";
  className?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  color = "blue", 
  className = "" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const colorClasses = {
    blue: "border-blue-600",
    red: "border-red-600",
    green: "border-green-600",
    gray: "border-gray-600"
  };

  return (
    <div 
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
}
