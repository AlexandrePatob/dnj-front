import { QueueType } from "@/lib/types";

interface TipsCardProps {
  queueType: QueueType;
  className?: string;
}

export function TipsCard({ queueType, className = "" }: TipsCardProps) {
  const getTips = () => {
    if (queueType === "confissoes") {
      return [
        "Reflita sobre seus pecados antes da confissão",
        "Seja sincero e específico ao confessar",
        "Prepare-se para receber a absolvição"
      ];
    } else {
      return [
        "Pense nas questões que gostaria de abordar",
        "Esteja aberto para receber orientações",
        "Prepare-se para um momento de reflexão"
      ];
    }
  };

  const getDotColor = () => {
    return queueType === "confissoes" ? "bg-blue-500" : "bg-green-500";
  };

  return (
    <div className={`max-w-md mx-auto mb-6 ${className}`}>
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Dicas Importantes
        </h3>

        <div className="space-y-3">
          {getTips().map((tip, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`w-2 h-2 ${getDotColor()} rounded-full mt-2 flex-shrink-0`}></div>
              <p className="text-sm text-gray-600">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
