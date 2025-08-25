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
} from "../../../components";

export default function WaitingPage({ params }: { params: { type: string } }) {
  const queueType = params.type as QueueType;
  const [user, setUser] = useState<User | null>(null);
  const [showAlmostThere, setShowAlmostThere] = useState(false);
  const [showCalled, setShowCalled] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Estados para controle de entrada na fila
  const [queueStatus, setQueueStatus] = useState<
    "joining" | "joined" | "error"
  >("joining");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasJoinedQueue, setHasJoinedQueue] = useState(false);
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);

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
    error
  } = useWaitingStatus(user, queueType);



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
      if (hasAttemptedToJoinRef.current || hasJoinedQueue || isAddingToQueue) return;

      const currentUser = getUser();
      if (!currentUser) return;

      try {
        hasAttemptedToJoinRef.current = true; // Marca que já tentou
        setIsAddingToQueue(true); // Ativar loading
        setQueueStatus("joining");
        await addToQueue(currentUser, queueType);
        setQueueStatus("joined");
        setHasJoinedQueue(true);
      } catch (error) {
        setQueueStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Erro ao entrar na fila");
        
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#e5e9ff" }}>
        <div className="text-center">
          <LoadingSpinner size="lg" color="blue" className="mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela de agradecimento
  if (showThankYou) {
    return (
      <StateScreen
        icon={<CheckCircle className="w-10 h-10 text-green-600" />}
        title="Obrigado!"
        description="Que Deus abençoe você e sua família. Obrigado por participar do DNJ."
        buttonText="Voltar ao início"
        buttonHref="/"
      />
    );
  }

  // Tela de chamada
  if (showCalled) {
    return <CalledScreen onFinishService={() => setShowThankYou(true)} />;
  }

  // Tela de entrada na fila (quando ainda não entrou)
  if (queueStatus === "joining") {
    return (
      <div className="min-h-screen p-4" style={{ background: "#e5e9ff" }}>
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
            isAddingToQueue ? "Adicionando você à fila..." : "Conectando ao sistema..."
          }
          status="loading"
          showSpinner={true}
          spinnerColor="blue"
        >
          <p className="text-xs text-gray-500 mt-4">
            {isAddingToQueue ? "Aguarde, não clique novamente..." : "Aguarde um momento..."}
          </p>
        </StatusCard>
      </div>
    );
  }

  // Tela de erro na entrada da fila
  if (queueStatus === "error") {
    return (
      <div className="min-h-screen p-4" style={{ background: "#e5e9ff" }}>
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
    <div className="min-h-screen p-4" style={{ background: "#e5e9ff" }}>
      <Header queueType={queueType} />

      <QueueStatusCard
        userName={user.name}
        position={userPosition}
        totalInQueue={totalInQueue}
        isConnected={!isLoading && !error}
        hasProcessedQueueUpdate={hasProcessedQueueUpdate}
      />

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

      {/* Alertas */}
      {showAlmostThere && (
        <AlertCard
          type="warning"
          icon={<Bell className="w-6 h-6" />}
          title="Está quase!"
          description={`Faltam apenas ${userPosition}. Fique atento!`}
          subtitle="Notificação enviada via WhatsApp"
        />
      )}

      <TipsCard queueType={queueType} />

      {/* Mensagem de Atenção */}
      <AlertCard
        type="info"
        icon={<span className="text-xl">⚠️</span>}
        title="Atenção!"
        description="Fique atento! Acompanhe para não perder sua vaga"
      />

      {/* Botão de voltar - só mostra quando não estiver processando */}
      {!isAddingToQueue && (
        <BackButton 
          href="/select-queue" 
          text="Voltar à seleção" 
        />
      )}
    </div>
  );
}
