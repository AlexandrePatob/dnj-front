import { Clock } from "lucide-react";

interface QueueStatusCardProps {
  userName: string;
  position: number;
  totalInQueue: number;
  isConnected: boolean;
  hasProcessedQueueUpdate: boolean;
  className?: string;
}

export function QueueStatusCard({
  userName,
  position,
  totalInQueue,
  isConnected,
  hasProcessedQueueUpdate,
  className = ""
}: QueueStatusCardProps) {
  return (
    <div className={`max-w-md mx-auto mb-6 ${className}`}>
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
        
        {/* título */}
        <h2 className="mt-1 text-center text-xl font-semibold text-slate-900">
          {userName.split(" ")[0]}
        </h2>

        {/* posição destacada */}
        <div className="mt-4 flex items-baseline justify-center gap-2">
          <span className="text-sm text-slate-600">Sua posição</span>
        </div>
        <div className="mt-1 text-center">
          <span className="text-6xl font-extrabold tracking-tight text-blue-600">
            {position}
            <sup className="ml-0.5 align-super text-lg font-bold text-blue-500">
              ª
            </sup>
          </span>
        </div>

        {/* stats / chips */}
        <div className="mt-4 grid grid-cols-1 gap-2 text-center">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">Total na fila</p>
            <p className="text-base font-semibold text-slate-900">
              {totalInQueue === 0 ? "0 pessoas" : `${totalInQueue} pessoas`}
            </p>
          </div>
        </div>

        {/* Status quando conectado mas sem posição ainda */}
        {isConnected && hasProcessedQueueUpdate && position === 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              ✅ Solicitação enviada! Aguardando confirmação do servidor...
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Você será adicionado à fila em instantes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
