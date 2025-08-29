import Image from "next/image";
import { QueueType } from "@/lib/types";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  queueType?: QueueType;
  showLogo?: boolean;
}

export function Header({ 
  title, 
  subtitle, 
  queueType,
  showLogo = true 
}: HeaderProps) {
  const getDefaultSubtitle = () => {
    if (subtitle) return subtitle;
    if (queueType) {
      return queueType === "confissoes" 
        ? "Fila de Confissão" 
        : "Fila de Direção Espiritual";
    }
    return "Sistema de Fila Digital";
  };

  return (
    <div className="text-center mb-8 pt-8">
      {showLogo && (
        <div className="inline-flex items-center justify-center w-full h-full rounded-xl mb-4">
          <Image 
            src="/logo-fila.png" 
            alt="Logo DNJ" 
            width={450} 
            height={450} 
          />
        </div>
      )}
      {title && (
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
      )}
      {subtitle && (
        <p className="text-white text-sm">{getDefaultSubtitle()}</p>
      )}
    </div>
  );
}
