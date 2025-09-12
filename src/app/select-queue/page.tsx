"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Users, XCircle } from "lucide-react";
import { User } from "@/lib/types";
import { Header, LoadingSpinner, BackButton } from "@/components";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface QueueConfig {
  isQueueOpen: boolean;
}

export default function SelectQueue() {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<QueueConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push("/");
      return;
    }

    const configRef = doc(db, 'config', 'default');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig({ isQueueOpen: data.isQueueOpen !== undefined ? data.isQueueOpen : true });
      } else {
        setConfig({ isQueueOpen: true });
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Erro ao ouvir configuração da fila:', error);
      setConfig({ isQueueOpen: true });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181818]">
        <div className="text-center text-white">
          <LoadingSpinner size="lg" color="white" className="mx-auto mb-4" />
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!config?.isQueueOpen) {
    return (
      <div className="min-h-screen bg-[#181818] text-white flex flex-col items-center justify-center p-4">
        <Header showLogo={true} />
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-6 text-2xl font-bold text-gray-800">
              Atendimento Finalizado
            </h2>
            <p className="mt-2 text-gray-600">
              O atendimento por esta fila foi encerrado por hoje. Agradecemos a sua participação!
            </p>
            <BackButton href="/" text="Voltar ao Início" className="mt-6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181818] text-white p-4">
      {/* Header com logos e grade de ícones */}
      <Header subtitle="Escolha o tipo de atendimento" showLogo={true} />

      {/* Saudação */}

      <div className="max-w-screen-sm mx-auto border border-white rounded-xl p-6">
        <div className="max-w-md mx-auto mb-6">
          <div className="bg-[#181818] rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-2 text-center">
              Olá, {user.name}!
            </h2>
            <p className="text-white text-center text-sm">
              Escolha entre as opções disponíveis:
            </p>
          </div>
        </div>

        {/* Opções de Fila */}
        <div className="max-w-md mx-auto space-y-4 sm:mb-14 md:mb-20">
          {/* Fila de Confissão */}
          <button
            onClick={() => router.push("/waiting/confissoes")}
            className="w-full bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left flex-1 no-wrap ">
                <h3 className="text-lg font-semibold text-gray-800">
                  Fila de Confissão
                </h3>
                <p className="text-sm text-gray-600">
                  Receba o sacramento da reconciliação
                </p>
              </div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </button>

          {/* Fila de Direção Espiritual */}
          <button
            onClick={() => router.push("/waiting/direcao-espiritual")}
            className="w-full bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200 hover:border-green-400 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  Fila de Direção Espiritual
                </h3>
                <p className="text-sm text-gray-600">
                  Receba orientação espiritual personalizada
                </p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </button>
        </div>
      </div>

      <BackButton href="/" text="Voltar ao início" className="mt-8 text-white" />
    </div>
  );
}
