"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, Bell, CheckCircle, AlertCircle } from "lucide-react";
import { useFirebaseQueue } from "../../../lib/useFirebaseQueue";
import { useWaitingStatus } from "../../../lib/useWaitingStatus";
import { User, QueueType } from "../../../lib/types";
import {
  Header,
  StatusCard,
  QueueStatusCard,
  TipsCard,
  LoadingSpinner,
  BackButton,
  AlertCard,
  StateScreen,
  CalledScreen,
  FloatingPositionHeader,
} from "../../../components";

export default function WaitingPage({ params }: { params: { type: string } }) {
  const queueType = params.type as QueueType;
  const [user, setUser] = useState<User | null>(null);
  const [showAlmostThere, setShowAlmostThere] = useState(false);
  const [showCalled, setShowCalled] = useState(false);

  // Estados para controle de entrada na fila
  const [queueStatus, setQueueStatus] = useState<
    "joining" | "joined" | "error" | "validation-error"
  >("joining");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasJoinedQueue, setHasJoinedQueue] = useState(false);
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<number | null>(null);

  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAttemptedToJoinRef = useRef(false);

  // Usar o novo hook para status de espera
  const {
    userPosition,
    totalInQueue,
    isCalled,
    hasProcessedQueueUpdate,
    isLoading,
    error,
  } = useWaitingStatus(user, queueType);

  // Usar o hook da fila para validação
  const { validateUserCanJoinQueue } = useFirebaseQueue();

  // Função para buscar usuário do localStorage em tempo real
  const getUser = (): User | null => {
    try {
      const userData = localStorage.getItem("userData");
      if (userData) {
        const userObj = JSON.parse(userData);
        // Atualiza o estado se for diferente
        if (JSON.stringify(userObj) !== JSON.stringify(user)) {
          setUser(userObj);
        }
        return userObj;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Carregar usuário inicial
  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push("/");
      return;
    }
  }, [router]);

  // Detectar quando o usuário é chamado
  useEffect(() => {
    if (isCalled && hasProcessedQueueUpdate) {
      setShowCalled(true);
    }
  }, [isCalled, hasProcessedQueueUpdate]);

  const { addToQueue } = useFirebaseQueue();

  // Entrar na fila quando o componente carregar
  useEffect(() => {
    const enterQueue = async () => {
      // Se já tentou ou já está processando, não faz nada
      if (hasAttemptedToJoinRef.current || hasJoinedQueue || isAddingToQueue)
        return;

      const currentUser = getUser();
      if (!currentUser) return;

      try {
        hasAttemptedToJoinRef.current = true; // Marca que já tentou
        setIsAddingToQueue(true); // Ativar loading
        setQueueStatus("joining");

        // Primeiro validar se pode entrar na fila
        const validation = await validateUserCanJoinQueue(
          currentUser,
          queueType
        );

        if (validation.calling) {
          setShowCalled(true);
          return;
        }

        if (!validation.canJoin) {
          // Se o usuário já está na fila e pode recuperar o status
          if (validation.shouldRecover && validation.currentPosition) {
            setCurrentPosition(validation.currentPosition);
            setQueueStatus("joined");
            setHasJoinedQueue(true);
            return;
          }

          // Se não pode recuperar, mostrar erro
          setQueueStatus("validation-error");
          setErrorMessage(
            validation.reason || "Não foi possível entrar na fila"
          );
          return;
        }

        // Se pode entrar, adicionar à fila
        await addToQueue(currentUser, queueType);
        setQueueStatus("joined");
        setHasJoinedQueue(true);
      } catch (error) {
        setQueueStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao entrar na fila"
        );

        // Tentar continuar mesmo com erro
        setTimeout(() => {
          setQueueStatus("joined");
        }, 2000);
      } finally {
        setIsAddingToQueue(false); // Sempre desativar loading
      }
    };

    if (!hasJoinedQueue) {
      enterQueue();
    }
  }, []); // SEM DEPENDÊNCIAS - executa apenas uma vez!

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181818]">
        <div className="text-center text-white">
          <LoadingSpinner size="lg" color="white" className="mx-auto mb-4" />
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela de chamada (unificada com agradecimento)
  if (showCalled) {
    return <CalledScreen currentUser={user} />;
  }

  // Tela de erro de validação
  if (queueStatus === "validation-error") {
    return (
      <div className="min-h-screen p-4 bg-[#181818] text-white">
        <Header queueType={queueType} />

        <StatusCard
          icon={<AlertCircle className="w-8 h-8" />}
          title="Não foi possível entrar na fila"
          description={errorMessage}
          status="error"
          showSpinner={false}
        >
          <p className="text-xs text-red-500 mt-4">
            Você já está em uma fila ou não pode entrar nesta fila no momento.
          </p>

          {/* Botão para voltar à seleção */}
          <BackButton
            href="/select-queue"
            text="Voltar à seleção"
            className="mt-4 text-white"
            color="black"
          />
        </StatusCard>
      </div>
    );
  }

  // Tela de entrada na fila (quando ainda não entrou)
  if (queueStatus === "joining") {
    return (
      <div className="min-h-screen p-4 bg-[#181818] text-white">
        <Header
          title="DNJ - Fila"
          subtitle={
            queueType === "confissoes"
              ? "Entrando na Fila de Confissão"
              : "Entrando na Fila de Direção Espiritual"
          }
          queueType={queueType}
        />

        <StatusCard
          icon={<Clock className="w-8 h-8" />}
          title="Entrando na fila..."
          description={
            isAddingToQueue
              ? "Adicionando você à fila..."
              : "Conectando ao sistema..."
          }
          status="loading"
          showSpinner={true}
          spinnerColor="blue"
        >
          <p className="text-xs text-gray-500 mt-4">
            {isAddingToQueue
              ? "Aguarde, não clique novamente..."
              : "Aguarde um momento..."}
          </p>
        </StatusCard>
      </div>
    );
  }

  // Tela de erro na entrada da fila
  if (queueStatus === "error") {
    return (
      <div className="min-h-screen p-4 bg-[#181818] text-white">
        <Header queueType={queueType} />

        <StatusCard
          icon={<AlertCircle className="w-8 h-8" />}
          title="Erro na conexão"
          description={errorMessage}
          status="error"
          showSpinner={true}
          spinnerColor="red"
        >
          <p className="text-xs text-red-500 mt-4">
            Tentando método alternativo...
          </p>

          {/* Botão para tentar novamente */}
          <button
            onClick={() => {
              setQueueStatus("joining");
              setHasJoinedQueue(false);
              setIsAddingToQueue(false);
            }}
            disabled={isAddingToQueue}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingToQueue ? "Tentando..." : "Tentar Novamente"}
          </button>
        </StatusCard>
      </div>
    );
  }

  // Tela principal de espera (quando já entrou na fila)
  return (
    <div className="min-h-screen p-4 bg-[#181818] text-white">
      <Header queueType={queueType} />

      {/* Header flutuante com posição */}
      <FloatingPositionHeader
        userName={user?.name || ""}
        position={userPosition || 0}
        totalInQueue={totalInQueue || 0}
        isVisible={!!userPosition && userPosition > 0}
        direction={queueType}
      />

      {/* Layout principal simplificado */}
      <div className="sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
        {/* Seção superior com posição e alertas unidos */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-rows-1 md:grid-rows-2 lg:grid-rows-1 gap-6">
            {/* Card de status da fila */}
            <div className="text-center w-full max-h-sm ">
              <h2 className="text-lg text-center mb-2 uppercase text-black">
                {queueType === "confissoes" ? "Confissão" : "Direção Espiritual"}
              </h2>
              <div className="flex flex-col justify-center items-center bg-gray-50 rounded-lg p-5 flex-1 min-w-[220px]">
                <span className="text-xl font-semibold text-gray-800 mb-2">
                  {user?.name}
                </span>
                {userPosition === 1 ? (
                  <span className="text-lg text-blue-700 mt-2 font-semibold">
                    Você é o próximo, aguarde ser chamado!
                  </span>
                ) : (
                  <span className="text-2xl text-gray-700 mt-2">
                    Você está na posição{" "}
                    <span className="font-bold text-[#5446fe]">
                      {userPosition}ª
                    </span>
                    .
                  </span>
                )}
                {totalInQueue > 1 && (
                  <span className="text-lg text-gray-700">
                    Total na fila{" "}
                    <span className="text-bold text-gray-800">
                      {totalInQueue}
                    </span>
                    .
                  </span>
                )}
              </div>
            </div>
            <div>
              <TipsCard queueType={queueType} />
            </div>
            {/* Coluna de alertas e mensagens */}
            <div className="space-y-4">
              {/* Mensagem de feedback durante entrada na fila */}
              {isAddingToQueue && (
                <AlertCard
                  type="info"
                  icon={<Clock className="w-6 h-6" />}
                  title="Adicionando à fila..."
                  description="Aguarde um momento, estamos processando sua entrada na fila."
                  subtitle="Não feche esta página"
                />
              )}

              {/* Mensagem de Atenção */}
              <AlertCard
                type="info"
                icon={<span className="text-xl">⚠️</span>}
                title="Atenção!"
                description="Fique atento! Acompanhe para não perder sua vaga"
              />
            </div>
          </div>
        </div>

        {/* Botão de voltar centralizado */}
        {!isAddingToQueue && (
          <div className="text-center">
            <BackButton
              href="/select-queue"
              text="Voltar à seleção"
              className="text-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}
