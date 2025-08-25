import { Bell } from "lucide-react";

interface CalledScreenProps {
  onFinishService: () => void;
}

export function CalledScreen({ onFinishService }: CalledScreenProps) {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center" style={{ background: "#e5e9ff" }}>
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Bell className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-blue-800 mb-4">
          Chegou sua vez!
        </h1>
        <p className="text-gray-600 mb-6">
          Dirija-se ao local de atendimento. Sua vez chegou!
        </p>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200">
          <p className="text-sm text-gray-600 mb-2">
            Notificação enviada via WhatsApp
          </p>
        </div>

        {/* Botão para agradecimento */}
        <button
          onClick={onFinishService}
          className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Finalizar Atendimento
        </button>
      </div>
    </div>
  );
}
