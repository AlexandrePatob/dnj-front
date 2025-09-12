import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  doc,
  runTransaction,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, db } from "./firebase";
import { QueueItem, QueueType, User } from "./types";

// Inicializa o SDK das Cloud Functions, especificando a região correta.
const functions = getFunctions(app, "southamerica-east1");

// Define as chamadas para as nossas funções
const joinQueueCallable = httpsCallable(functions, "joinQueue");
const callNextPersonCallable = httpsCallable(functions, "callNextPerson");
const getUserQueueStatusCallable = httpsCallable(
  functions,
  "getUserQueueStatus"
);

export function useFirebaseQueue() {
  // Para o Admin: armazena a lista limitada dos próximos na fila
  const [queue, setQueue] = useState<QueueItem[]>([]);
  // Para o Admin: armazena o total de pessoas na fila
  const [totalInQueue, setTotalInQueue] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref para guardar o estado anterior da fila e comparar mudanças
  const previousQueueRef = useRef<QueueItem[]>([]);

  // --- Funções que chamam o Backend (Cloud Functions) ---

  const joinQueue = useCallback(async (user: User, queueType: QueueType) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await joinQueueCallable({ user, queueType });
      return result.data as {
        status: string;
        message: string;
        docId: string;
        calledAt?: any;
      };
    } catch (err: any) {
      console.error("Erro ao chamar joinQueue:", err);
      setError(err.message || "Erro ao entrar na fila.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const callNextPerson = useCallback(async (queueType: QueueType) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await callNextPersonCallable({ queueType });
      return result.data as {
        status: string;
        message?: string;
        calledPerson?: any;
      };
    } catch (err: any) {
      console.error("Erro ao chamar callNextPerson:", err);
      setError(err.message || "Erro ao chamar o próximo da fila.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserStatus = useCallback(
    async (user: User, queueType: QueueType, docId: string) => {
      try {
        const result = await getUserQueueStatusCallable({
          user,
          queueType,
          docId,
        });
        return result.data as {
          status: string;
          position: number;
          totalInQueue: number;
        };
      } catch (err: any) {
        console.error("Erro ao chamar getUserQueueStatus:", err);
        // Não seta erro global para não poluir a UI do usuário com falhas de polling
        throw err;
      }
    },
    []
  );

  // --- Listener para o Admin ---
  // Este useEffect configura os listeners que o painel do admin usará.
  // Ele é otimizado para ler apenas os 5 primeiros e o total.
  useEffect(() => {
    // Função para buscar a configuração de "Quase Lá"
    const fetchQueueConfig = async () => {
      try {
        const response = await fetch("/api/config");
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (e) {
        console.error("Erro ao buscar config da fila:", e);
      }
      return { almostTherePosition: 5, whatsAppEnabled: false }; // Padrão
    };

    // Função para disparar a notificação "Almost There"
    const sendAlmostThereNotification = async (
      person: QueueItem,
      position: number
    ) => {
      console.log(
        `Disparando notificação 'almost-there' para ${person.name} na posição ${position}`
      );
      try {
        await fetch("https://fila.dnjcuritiba.com.br/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: person.name,
            phone: person.phone,
            queueType: person.queueType,
            type: "almost-there",
            position: position,
          }),
        });
      } catch (e) {
        console.error("Erro ao enviar notificação 'almost-there':", e);
      }
    };

    // Função atômica para enviar notificação (resolve race conditions)
    const sendAlmostThereNotificationAtomically = async (
      person: QueueItem,
      position: number
    ) => {
      try {
        const result = await runTransaction(db, async (transaction) => {
          const docRef = doc(db, "queue", person.id);
          const docSnap = await transaction.get(docRef);

          // Se não existe o documento ou já foi enviado, retorna null
          if (
            !docSnap.exists() ||
            docSnap.data()?.almostThereNotificationSent
          ) {
            return null;
          }

          // Marca como enviado ANTES de enviar (evita race conditions)
          transaction.update(docRef, { almostThereNotificationSent: true });
          return person;
        });

        // Se a transação retornou a pessoa, significa que conseguimos marcar
        if (result) {
          await sendAlmostThereNotification(person, position);
          console.log(
            `✅ Notificação 'almost-there' enviada atomicamente para ${person.name}`
          );
          return true;
        } else {
          console.log(
            `⏭️ Notificação 'almost-there' já foi enviada para ${person.name} por outro admin`
          );
          return false;
        }
      } catch (error) {
        console.error("Erro na transação de notificação:", error);
        return false;
      }
    };

    // Função que processa as atualizações da fila e dispara notificações
    const processQueueUpdate = async (
      newQueueData: QueueItem[],
      queueType: QueueType
    ) => {
      const { almostTherePosition, whatsAppEnabled } = await fetchQueueConfig();
      if (!whatsAppEnabled) return;

      const previousQueue = previousQueueRef.current;

      // Encontra o usuário que acabou de entrar na posição "Quase Lá"
      const targetPerson = newQueueData[almostTherePosition - 1];
      if (targetPerson) {
        // Verifica se essa pessoa não estava na mesma posição antes (evita re-envio)
        const wasAlreadyThere = previousQueue.some(
          (p) =>
            p.id === targetPerson.id &&
            previousQueue.indexOf(p) === almostTherePosition - 1
        );
        if (!wasAlreadyThere) {
          // Usar função atômica que resolve race conditions entre múltiplos admins
          await sendAlmostThereNotificationAtomically(
            targetPerson,
            almostTherePosition
          );
        }
      }

      // Atualiza o estado da fila para o admin
      setQueue((prev) => [
        ...prev.filter((p) => p.queueType !== queueType),
        ...newQueueData,
      ]);
      previousQueueRef.current = [
        ...previousQueue.filter((p) => p.queueType !== queueType),
        ...newQueueData,
      ]; // Atualiza a ref
    };

    // Listener para os 5 primeiros da fila de confissões
    const confissoesQuery = query(
      collection(db, "queue"),
      where("queueType", "==", "confissoes"),
      orderBy("createdAt", "asc"),
      limit(10)
    );
    // Listener para os 5 primeiros da fila de direção espiritual
    const direcaoQuery = query(
      collection(db, "queue"),
      where("queueType", "==", "direcao-espiritual"),
      orderBy("createdAt", "asc"),
      limit(10)
    );

    const unsubscribeConfissoes = onSnapshot(
      confissoesQuery,
      (snapshot) => {
        const confissoesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as QueueItem[];
        processQueueUpdate(confissoesData, "confissoes");
        setIsLoading(false);
      },
      (err) => {
        console.error("Erro no listener de confissões:", err);
        setError("Erro ao carregar a fila de confissões.");
        setIsLoading(false);
      }
    );

    const unsubscribeDirecao = onSnapshot(
      direcaoQuery,
      (snapshot) => {
        const direcaoData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as QueueItem[];
        processQueueUpdate(direcaoData, "direcao-espiritual");
        setIsLoading(false);
      },
      (err) => {
        console.error("Erro no listener de direção espiritual:", err);
        setError("Erro ao carregar a fila de direção espiritual.");
        setIsLoading(false);
      }
    );

    // Função para buscar o total em cada fila
    const fetchTotals = async () => {
      try {
        const confissoesTotalQuery = query(
          collection(db, "queue"),
          where("queueType", "==", "confissoes")
        );
        const direcaoTotalQuery = query(
          collection(db, "queue"),
          where("queueType", "==", "direcao-espiritual")
        );

        const [confissoesSnapshot, direcaoSnapshot] = await Promise.all([
          getCountFromServer(confissoesTotalQuery),
          getCountFromServer(direcaoTotalQuery),
        ]);

        setTotalInQueue(
          confissoesSnapshot.data().count + direcaoSnapshot.data().count
        );
      } catch (err) {
        console.error("Erro ao buscar totais:", err);
      }
    };

    // Busca os totais inicialmente e depois a cada 30 segundos
    fetchTotals();
    const intervalId = setInterval(fetchTotals, 30000);

    // Cleanup
    return () => {
      unsubscribeConfissoes();
      unsubscribeDirecao();
      clearInterval(intervalId);
    };
  }, []);

  return {
    // Para o Admin
    queue,
    totalInQueue,
    isListening: !isLoading,

    // Para ambos
    isLoading,
    error,

    // Funções (agora chamam o backend)
    joinQueue,
    callNextPerson,
    getUserStatus,
  };
}
