import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { QueueItem, QueueType, User } from "./types";

// Configurações
const COLLECTIONS = {
  QUEUE: "queue",
  CALLED_PEOPLE: "calledPeople",
  NOTIFICATIONS: "notifications",
} as const;

export function useFirebaseQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para executar quando chegar EXATAMENTE na posição configurada
  const executeAlmostThereFunction = useCallback(async (person: QueueItem) => {
    try {
      console.log(`📱 EXECUTANDO "QUASE LÁ" para ${person.name} na posição ${person.position}`);
      
      // Buscar configuração atual
      const configResponse = await fetch("/api/config");
      const config = await configResponse.json();

      console.log(`⚙️ WhatsApp habilitado: ${config.whatsAppEnabled}, Posição configurada: ${config.almostTherePosition}`);

      if (!config.whatsAppEnabled) {
        console.log(`❌ WhatsApp desabilitado - não enviando`);
        return;
      }

      // Chamar API do Next.js para enviar WhatsApp
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: person.name,
          phone: person.phone,
          queueType: person.queueType,
          type: "almost-there",
          position: person.position,
        }),
      });

      if (response.ok) {
        console.log(
          `✅ WhatsApp "quase lá" enviado para ${person.name} na posição ${person.position}`
        );
      } else {
        console.error('❌ Erro ao enviar WhatsApp "quase lá"');
      }
    } catch (error) {
      console.error('❌ Erro ao executar função "quase lá":', error);
    }
  }, []);

  // Função para executar quando for a vez
  const executeTurnFunction = useCallback(async (person: QueueItem) => {
    try {
      // Buscar configuração atual
      const configResponse = await fetch("/api/config");
      const config = await configResponse.json();

      if (!config.whatsAppEnabled) return;

      // Chamar API do Next.js para enviar WhatsApp
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: person.name,
          phone: person.phone,
          queueType: person.queueType,
          type: "turn",
        }),
      });

      if (response.ok) {
        console.log(`WhatsApp de vez enviado para ${person.name}`);
      } else {
        console.error("Erro ao enviar WhatsApp de vez");
      }
    } catch (error) {
      console.error("Erro ao executar função de vez:", error);
    }
  }, []);

  // Adicionar pessoa à fila
  const addToQueue = useCallback(async (user: User, queueType: QueueType) => {
    try {
      setIsLoading(true);

      // Verificar se já está na fila
      const existingQuery = query(
        collection(db, COLLECTIONS.QUEUE),
        where("name", "==", user.name),
        where("phone", "==", user.phone),
        where("queueType", "==", queueType),
        where("status", "==", "waiting")
      );

      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        throw new Error("Você já está nesta fila! Aguarde sua vez.");
      }

      // Adicionar à fila
      const docRef = await addDoc(collection(db, COLLECTIONS.QUEUE), {
        name: user.name,
        phone: user.phone,
        queueType: queueType,
        createdAt: serverTimestamp(),
        status: "waiting",
        position: 1, // Posição inicial (não pode ser 0)
      });

      // Atualizar posição baseada na ordem de chegada
      await updatePosition(docRef.id, queueType);

      return docRef.id;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao entrar na fila"
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para verificar e executar notificações
  const checkAndExecuteNotifications = useCallback(
    async (doc: any, personData: any, position: number) => {
      try {
        // Buscar configuração para verificar se deve enviar WhatsApp
        const configResponse = await fetch("/api/config");
        const config = await configResponse.json();

        // Verificar se deve executar função "quase lá" - APENAS quando chegar EXATAMENTE na posição configurada
        if (
          position === config.almostTherePosition &&
          personData.position !== position // Só se mudou para esta posição
        ) {
          console.log(`🚨 ENVIANDO "QUASE LÁ": ${personData.name} chegou na posição ${position} (configurado: ${config.almostTherePosition})`);
          executeAlmostThereFunction({
            id: doc.id,
            ...personData,
            position: position // Usar a nova posição
          } as QueueItem);
        }

        // REMOVIDO: Não enviar WhatsApp quando chega na posição 1
        // A notificação de "vez" só deve ser enviada quando o ADMIN chama!
      } catch (error) {
        console.error("Erro ao verificar notificações:", error);
      }
    },
    [executeAlmostThereFunction] // Remover executeTurnFunction das dependências
  );

  // Atualizar posição na fila
  const updatePosition = useCallback(
    async (personId: string, queueType: QueueType) => {
      try {
        const batch = writeBatch(db);

        // Buscar todas as pessoas da fila com status "waiting" ordenadas por criação
        const queueQuery = query(
          collection(db, COLLECTIONS.QUEUE),
          where("queueType", "==", queueType),
          where("status", "==", "waiting"),
          orderBy("createdAt", "asc")
        );

        const querySnapshot = await getDocs(queueQuery);
        let position = 1;

        for (const doc of querySnapshot.docs) {
          const personData = doc.data();
          const currentPosition = personData.position || 1; // Default para 1, não 0

          // Só atualizar se a posição mudou
          if (currentPosition !== position) {
            batch.update(doc.ref, { position });

            // Verificar e executar notificações apenas se mudou
            await checkAndExecuteNotifications(doc, personData, position);
          }

          position++;
        }

        await batch.commit();
      } catch (error) {
        console.error("Erro ao atualizar posições:", error);
      }
    },
    [checkAndExecuteNotifications]
  );

  // Remover pessoa da fila
  const removeFromQueue = useCallback(
    async (personId: string, queueType: QueueType) => {
      try {
        await deleteDoc(doc(db, COLLECTIONS.QUEUE, personId));
        await updatePosition(personId, queueType);
      } catch (error) {
        console.error("Erro ao remover da fila:", error);
      }
    },
    [updatePosition]
  );

  // Chamar próxima pessoa
  const callNext = useCallback(
    async (queueType: QueueType) => {
      try {
        const queueQuery = query(
          collection(db, COLLECTIONS.QUEUE),
          where("queueType", "==", queueType),
          where("status", "==", "waiting"),
          orderBy("createdAt", "asc"),
          orderBy("position", "asc")
        );

        const querySnapshot = await getDocs(queueQuery);
        if (!querySnapshot.empty) {
          const nextPerson = querySnapshot.docs[0];
          const personData = nextPerson.data();

          // ENVIAR WHATSAPP DE "VEZ" QUANDO O ADMIN CHAMA!
          try {
            const configResponse = await fetch("/api/config");
            const config = await configResponse.json();

            if (config.whatsAppEnabled) {
              const response = await fetch("/api/whatsapp", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: personData.name,
                  phone: personData.phone,
                  queueType: personData.queueType,
                  type: "turn",
                }),
              });

              if (response.ok) {
                console.log(`WhatsApp de vez enviado para ${personData.name} (chamado pelo admin)`);
              } else {
                console.error("Erro ao enviar WhatsApp de vez");
              }
            }
          } catch (error) {
            console.error("Erro ao enviar WhatsApp de vez:", error);
          }

          // Marcar como chamado (NÃO remover da fila)
          await updateDoc(nextPerson.ref, {
            status: "called",
            calledAt: serverTimestamp(),
          });

          // Adicionar à lista de pessoas chamadas
          await addDoc(collection(db, COLLECTIONS.CALLED_PEOPLE), {
            id: nextPerson.id,
            name: personData.name,
            phone: personData.phone,
            queueType: personData.queueType,
            calledAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
          });

          // Atualizar posições da fila (removendo apenas pessoas com status "called")
          await updatePosition(nextPerson.id, queueType);
        }
      } catch (error) {
        console.error("Erro ao chamar próximo:", error);
      }
    },
    [updatePosition]
  );

  // Listener em tempo real para a fila
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, COLLECTIONS.QUEUE), orderBy("createdAt", "asc")),
      (snapshot: any) => {
        const queueData: QueueItem[] = [];
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          // Só incluir pessoas com status "waiting" na fila ativa
          if (data.status === "waiting") {
            queueData.push({
              id: doc.id,
              name: data.name,
              phone: data.phone,
              position: data.position || 1, // Default para 1, não 0
              queueType: data.queueType,
              createdAt:
                data.createdAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
            });
          }
        });

        setQueue(queueData);
        setIsLoading(false);
      },
      (error: any) => {
        console.error("Erro no listener da fila:", error);
        setError("Erro ao conectar com o servidor");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    queue,
    isLoading,
    error,
    addToQueue,
    removeFromQueue,
    callNext,
    updatePosition,
  };
}
