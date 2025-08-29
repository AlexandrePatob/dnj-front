import { QueueType } from "@/lib/types";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface FloatingPositionHeaderProps {
  userName: string;
  position: number;
  totalInQueue: number;
  isVisible: boolean;
  direction: QueueType;
}

export function FloatingPositionHeader({
  userName,
  position,
  totalInQueue,
  isVisible,
  direction,
}: FloatingPositionHeaderProps) {
  const [showOnScroll, setShowOnScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowOnScroll(scrollTop > 100); // Aparece após 100px de scroll
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cores baseadas na direção
  const isConfissao = direction === "confissoes";
  const primaryColor = isConfissao ? "bg-[#5446fe]" : "bg-[#b9ff89]";
  const accentColor = isConfissao ? "text-[#5446fe]" : "text-[#b9ff89]";

  if (!isVisible || !showOnScroll) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#181818]/95 backdrop-blur-sm border-b border-gray-700 shadow-lg transition-all duration-300 ease-in-out rounded-b-2xl">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${primaryColor} rounded-full flex items-center justify-center`}>
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{userName}</p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-sm font-bold ${accentColor}`}>
              Posicao Atual: {position}ª
            </div>
            <div className="text-sm font-bold text-white">
              Total: {totalInQueue}ª
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
