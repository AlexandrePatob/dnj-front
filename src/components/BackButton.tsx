import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BackButtonProps {
  href: string;
  text: string;
  className?: string;
}

export function BackButton({ href, text, className = "" }: BackButtonProps) {
  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Link
        href={href}
        className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{text}</span>
      </Link>
    </div>
  );
}
