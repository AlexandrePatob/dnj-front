import Image from "next/image";
import { QueueType } from "@/lib/types";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  queueType?: QueueType;
  showLogo?: boolean;
}

export function Header({ 
  title = "DNJ - Fila", 
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
        <div className="inline-flex items-center justify-center w-[5rem] h-16 bg-blue-600 rounded-xl mb-4">
          <Image 
            src="https://dnjcuritiba.com.br/wp-content/uploads/2025/07/Vector.png" 
            alt="Logo DNJ" 
            width={64} 
            height={64} 
          />
        </div>
      )}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-gray-600 text-sm">{getDefaultSubtitle()}</p>
    </div>
  );
}
