import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface StateScreenProps {
  icon: ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
  buttonOnClick?: () => void;
  showBackButton?: boolean;
  backButtonHref?: string;
  backButtonText?: string;
  className?: string;
}

export function StateScreen({
  icon,
  title,
  description,
  buttonText,
  buttonHref,
  buttonOnClick,
  showBackButton = false,
  backButtonHref = "/",
  backButtonText = "Voltar ao início",
  className = ""
}: StateScreenProps) {
  const renderButton = () => {
    if (buttonOnClick) {
      return (
        <button
          onClick={buttonOnClick}
          className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          {buttonText}
        </button>
      );
    }

    if (buttonHref && buttonText) {
      return (
        <Link
          href={buttonHref}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{buttonText}</span>
        </Link>
      );
    }

    return null;
  };

  return (
    <div className={`min-h-screen p-4 flex items-center justify-center ${className}`} style={{ background: "#e5e9ff" }}>
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {icon}
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        
        {renderButton()}

        {showBackButton && (
          <div className="mt-6">
            <Link
              href={backButtonHref}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backButtonText}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
