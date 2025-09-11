"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, AlertCircle } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useFirebaseQueue } from "../../../lib/useFirebaseQueue";
import { User, QueueType } from "../../../lib/types";
import {
  Header,
  StatusCard,
  TipsCard,
  LoadingSpinner,
  BackButton,
  AlertCard,
  CalledScreen,
  FloatingPositionHeader,
} from "../../../components";

type QueueStatus = "joining" | "joined" | "error";

export default function WaitingPage({ params }: { params: { type: string } }) {
  const queueType = params.type as QueueType;
  const router = useRouter();

  // Hooks e Estado
  const { joinQueue, getUserStatus } = useFirebaseQueue();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<QueueStatus>("joining");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Novo estado para a posição e total
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [totalInQueue, setTotalInQueue] = useState<number | null>(null);
  
  // Estado para saber se o usuário foi chamado
  const [isCalled, setIsCalled] = useState(false);

  // Armazena o ID do documento do usuário na fila para polling e listening
  const userDocIdRef = useRef<string | null>(null);

  // 1. Efeito para carregar o usuário e entrar na fila (executa uma vez)
  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (!userData) {
      router.push("/");
      return;
    }
    const currentUser = JSON.parse(userData);
    setUser(currentUser);

    const enterQueue = async () => {
      try {
        setStatus("joining");
        const result = await joinQueue(currentUser, queueType);
        if (result.status === "success" && result.docId) {
          userDocIdRef.current = result.docId;
          setStatus("joined");
        } else if (result.status === "called") {
          // ✅ NOVO: Pessoa já foi chamada e está aguardando
          setIsCalled(true);
          setStatus("joined"); // Muda para joined para não mostrar loading
        } else {
          // Caso a função retorne um status de erro conhecido
          setErrorMessage(result.message || "Não foi possível entrar na fila.");
          setStatus("error");
        }
      } catch (error: any) {
        // Trata erros lançados pela Cloud Function (HttpsError)
        setErrorMessage(error.message || "Ocorreu um erro desconhecido.");
        setStatus("error");
      }
    };

    enterQueue();
  }, [queueType, router, joinQueue]);


  // 2. Efeito para ouvir se o usuário foi chamado (depende do docId)
  useEffect(() => {
    if (status !== "joined" || !userDocIdRef.current) return;

    const userDocRef = doc(db, "queue", userDocIdRef.current);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      // Se o documento não existe mais, significa que fomos chamados!
      if (!doc.exists()) {
        setIsCalled(true);
        unsubscribe(); // Para de ouvir
      }
    });

    return () => unsubscribe(); // Cleanup
  }, [status]);


  // 3. Efeito para buscar a posição periodicamente (polling)
  useEffect(() => {
    if (status !== "joined" || !userDocIdRef.current || !user) return;

    const fetchStatus = async () => {
      if (!userDocIdRef.current || !user) return;
      try {
        const result = await getUserStatus(user, queueType, userDocIdRef.current);
        if (result.status === "success") {
          setUserPosition(result.position);
          setTotalInQueue(result.totalInQueue);
        } else if (result.status === "not_found") {
          // Se não foi encontrado, provavelmente já foi chamado
          setIsCalled(true);
        }
      } catch (error) {
        console.error("Erro ao buscar status da fila:", error);
      }
    };

    fetchStatus(); // Busca a primeira vez
    const intervalId = setInterval(fetchStatus, 30000); // E depois a cada 30s

    return () => clearInterval(intervalId); // Cleanup
  }, [status, user, queueType, getUserStatus]);


  // --- Renderização dos diferentes estados da UI ---

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181818]">
        <LoadingSpinner size="lg" color="white" />
      </div>
    );
  }

  if (isCalled) {
    return <CalledScreen currentUser={user} />;
  }

  if (status === "joining") {
    return (
      <div className="min-h-screen p-4 bg-[#181818] text-white">
        <Header queueType={queueType} />
        <StatusCard
          icon={<Clock className="w-8 h-8" />}
          title="Entrando na fila..."
          description="Aguarde um momento, estamos validando sua entrada."
          status="loading"
          showSpinner={true}
        />
      </div>
    );
  }

  if (status === "error") {
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

  // Tela principal de espera (status === "joined")
  return (
    <div className="min-h-screen p-4 bg-[#181818] text-white">
      <Header queueType={queueType} />
      
      <FloatingPositionHeader
        userName={user.name || ""}
        position={userPosition || 0}
        totalInQueue={totalInQueue || 0}
        isVisible={!!userPosition && userPosition > 0}
        direction={queueType}
      />

      <div className="sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-rows-1 md:grid-rows-2 lg:grid-rows-1 gap-6">
            <div className="text-center w-full max-h-sm ">
              <h2 className="text-lg text-center mb-2 uppercase text-black">
                {queueType === "confissoes" ? "Confissão" : "Direção Espiritual"}
              </h2>
              <div className="flex flex-col justify-center items-center bg-gray-50 rounded-lg p-5 flex-1 min-w-[220px]">
                <span className="text-xl font-semibold text-gray-800 mb-2">
                  {user.name}
                </span>

                {userPosition === null ? (
                   <LoadingSpinner size="sm" color="white" className="my-2"/>
                ) : userPosition === 1 ? (
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
                
                {totalInQueue !== null && totalInQueue > 1 && (
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
            <div className="space-y-4">
              <AlertCard
                type="info"
                icon={<span className="text-xl">⚠️</span>}
                title="Atenção!"
                description="Fique atento! Acompanhe para não perder sua vaga"
              />
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <BackButton
            href="/select-queue"
            text="Voltar à seleção"
            className="text-white"
          />
        </div>
      </div>
    </div>
  );
}
