import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  writeBatch,
  limit,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebase";
import { CalledPerson } from "./types";

const COLLECTION_NAME = "calledPeople";
const TIMER_DURATION = 5 * 60 * 1000; // 5 minutos

interface CallCounters {
  confissoesConfirmed: number;
  direcaoEspiritualConfirmed: number;
}

export function useFirebaseCalledPeople() {
  const [calledPeople, setCalledPeople] = useState<CalledPerson[]>([]);
  const [counters, setCounters] = useState<CallCounters>({
    confissoesConfirmed: 0,
    direcaoEspiritualConfirmed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Listener OTIMIZADO - apenas pessoas aguardando ação (status = 'waiting')
  useEffect(() => {
    // TEMPORÁRIO: Query simples até criar o índice
    const q = query(
      collection(db, COLLECTION_NAME),
      where("status", "==", "waiting") // SÓ pessoas que precisam de ação!
      // orderBy removido temporariamente para não precisar de índice
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const calledData: CalledPerson[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          calledData.push({
            id: doc.id,
            name: data.name,
            phone: data.phone,
            queueType: data.queueType,
            calledAt: data.calledAt?.toDate?.()?.getTime(),
            expiresAt: data.expiresAt?.toDate?.()?.getTime(),
            status: data.status || "waiting",
            updatedAt:
              data.updatedAt?.toDate?.()?.getTime() ||
              data.calledAt?.toDate?.()?.getTime(),
          });
        });

        setCalledPeople(calledData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Erro no listener de pessoas chamadas:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Verificar pessoas expiradas a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const expired = calledPeople.filter(
        (person) => person.status === "waiting" && person.expiresAt <= now
      );

      if (expired.length > 0) {
        // Marcar como não compareceu
        expired.forEach(async (person) => {
          try {
            await updateDoc(doc(db, COLLECTION_NAME, person.id), {
              status: "no-show",
              updatedAt: serverTimestamp(),
            });

            // O filtro por tempo vai remover automaticamente após 1 minuto
          } catch (error) {
            console.error("Erro ao marcar como no-show:", error);
          }
        });

        // Notificar admin sobre pessoas expiradas
        expired.forEach((person) => {
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Tempo Expirado", {
              body: `${person.name} não confirmou presença em 5 minutos.`,
              icon: "/favicon.ico",
            });
          }
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calledPeople]);

  // Buscar contadores de estatísticas via count queries (MUITO mais eficiente)
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const queries = [
          // Apenas confirmados por fila (o que realmente importa)
          getCountFromServer(
            query(
              collection(db, COLLECTION_NAME),
              where("queueType", "==", "confissoes"),
              where("status", "==", "confirmed")
            )
          ),
          getCountFromServer(
            query(
              collection(db, COLLECTION_NAME),
              where("queueType", "==", "direcao-espiritual"),
              where("status", "==", "confirmed")
            )
          ),
        ];

        const results = await Promise.all(queries);

        setCounters({
          confissoesConfirmed: results[0].data().count,
          direcaoEspiritualConfirmed: results[1].data().count,
        });
      } catch (error) {
        console.error("Erro ao buscar contadores:", error);
      }
    };

    // Buscar contadores inicialmente
    fetchCounters();

    // Atualizar contadores a cada 60 segundos
    const interval = setInterval(fetchCounters, 60000);

    return () => clearInterval(interval);
  }, []);

  // Confirmar presença
  const confirmPresence = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: "confirmed",
        updatedAt: serverTimestamp(),
      });
      // O filtro por tempo vai remover automaticamente após 1 minuto
    } catch (error) {
      console.error("Erro ao confirmar presença:", error);
    }
  }, []);

  // Marcar como não compareceu
  const markAsNoShow = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: "no-show",
        updatedAt: serverTimestamp(),
      });
      // O filtro por tempo vai remover automaticamente após 1 minuto
    } catch (error) {
      console.error("Erro ao marcar como no-show:", error);
    }
  }, []);

  // Remover pessoa da lista
  const removePerson = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Erro ao remover pessoa:", error);
    }
  }, []);

  // Limpar histórico
  const clearHistory = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      // Pega todos os documentos para deletar
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
    }
  }, []);

  // Solicitar permissão para notificações
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  return {
    calledPeople, // Apenas pessoas aguardando ação (status = 'waiting')
    counters, // Estatísticas via count queries
    isLoading,
    confirmPresence,
    markAsNoShow,
    removePerson,
    clearHistory,
    requestNotificationPermission,
  };
}
