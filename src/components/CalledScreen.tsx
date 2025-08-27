import { Bell, CheckCircle } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { User } from "@/lib/types";

interface CalledScreenProps {
  currentUser: User;
}

export function CalledScreen({ currentUser }: CalledScreenProps) {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center bg-black text-white">
      <div className="max-w-md mx-auto text-center">
        {/* Ícone de chamada */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Bell className="w-10 h-10 text-blue-600" />
        </div>
        
        {/* Título principal */}
        <h1 className="text-3xl font-bold text-blue-800 mb-4">
          Chegou sua vez!
        </h1>
        
        {/* Box branco com instrução principal */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200 mb-4">
          <p className="text-lg font-bold text-gray-700">
            {currentUser.name}, dirija-se ao local de atendimento. <br />Sua vez chegou!
          </p>
        </div>
        
        {/* Informação sobre notificação */}
        <p className="text-sm text-gray-500 mb-6">
          Notificação enviada via WhatsApp
        </p>

        {/* Botão para voltar ao início */}
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao início</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
