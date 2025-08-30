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
import { QueueItem, QueueType, User, QueueValidation } from "./types";

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
  const [isCallingNext, setIsCallingNext] = useState(false);

  // Função para validar se o usuário pode entrar na fila
  const validateUserCanJoinQueue = useCallback(
    async (user: User, queueType: QueueType): Promise<QueueValidation> => {
      try {
        // Verificar se já está em alguma fila (qualquer status)
        const existingQuery = query(
          collection(db, COLLECTIONS.QUEUE),
          where("name", "==", user.name),
          where("phone", "==", user.phone)
        );

        const existingDocs = await getDocs(existingQuery);

        if (!existingDocs.empty) {
          const existingQueues: QueueType[] = [];
          let hasCalledStatus = false;
          let hasWaitingStatus = false;

          existingDocs.forEach((doc) => {
            const data = doc.data();
            if (data.queueType && !existingQueues.includes(data.queueType)) {
              existingQueues.push(data.queueType);
            }

            // Verificar status
            if (data.status === "called") {
              hasCalledStatus = true;
            } else if (data.status === "waiting") {
              hasWaitingStatus = true;
            }
          });

          // Se já está na fila específica
          if (existingQueues.includes(queueType)) {
            // Verificar se está na mesma fila com status "waiting" (pode ter atualizado a página)
            const sameQueueDoc = existingDocs.docs.find((doc) => {
              const data = doc.data();
              return data.queueType === queueType;
            });

            if (sameQueueDoc) {
              const sameQueueData = sameQueueDoc.data();

              const sameQueueDataWaiting = existingDocs.docs.sort(
                (a, b) => a.data().createdAt - b.data().createdAt
              );

              const lastQueueData =
                sameQueueDataWaiting[sameQueueDataWaiting.length - 1].data();

              // Se está na mesma fila com status "waiting", permitir recuperar o status
              if (
                lastQueueData?.status === "waiting" &&
                lastQueueData.queueType === queueType
              ) {
                return {
                  canJoin: false,
                  reason: "Você já está nesta fila! Aguarde sua vez.",
                  existingQueues,
                  isAlreadyWaiting: true,
                  shouldRecover: true,
                  currentPosition: sameQueueData.position || 1,
                  currentQueueType: queueType,
                };
              }

              // Se está na mesma fila com status "called", SEMPRE verificar na calledPeople
              if (
                lastQueueData.status === "called" &&
                lastQueueData.queueType === queueType
              ) {
                // SEMPRE verificar na coleção calledPeople para esta fila
                const calledPeopleQuery = query(
                  collection(db, COLLECTIONS.CALLED_PEOPLE),
                  where("name", "==", user.name),
                  where("phone", "==", user.phone),
                  where("queueType", "==", queueType)
                );

                const calledPeopleDocs = await getDocs(calledPeopleQuery);

                if (!calledPeopleDocs.empty) {
                  // Primeiro: procurar por documento SEM status
                  const docWithoutStatus = calledPeopleDocs.docs.find((doc) => {
                    const data = doc.data();
                    return !data.status || data.status === "sem-status";
                  });

                  let calledPeopleData;
                  let calledStatus;
                  let calledAt;

                  if (docWithoutStatus) {
                    // Se encontrou documento sem status, usar ele
                    calledPeopleData = docWithoutStatus.data();
                    calledStatus = calledPeopleData.status || "sem-status";
                    calledAt = calledPeopleData.calledAt;
                  } else {
                    // Se não encontrou sem status, pegar o mais recente pelo calledAt
                    // Ordenar por calledAt para pegar o mais recente
                    const sortedDocs = calledPeopleDocs.docs.sort((a, b) => {
                      const aTime =
                        a.data().calledAt?.toDate?.()?.getTime() || 0;
                      const bTime =
                        b.data().calledAt?.toDate?.()?.getTime() || 0;
                      return bTime - aTime; // Descending (mais recente primeiro)
                    });

                    calledPeopleData = sortedDocs[0].data();
                    calledStatus = calledPeopleData.status || "sem-status";
                    calledAt = calledPeopleData.calledAt;
                  }

                  // Se foi chamado recentemente (menos de 15 minutos), não permitir
                  if (calledAt && calledStatus !== "sem-status") {
                    const calledTime = calledAt.toDate();
                    const currentTime = new Date();
                    const timeDifference =
                      currentTime.getTime() - calledTime.getTime();
                    const fifteenMinutesInMs = 15 * 60 * 1000;

                    if (timeDifference < fifteenMinutesInMs) {
                      return {
                        canJoin: false,
                        reason:
                          "Você já foi chamado nesta fila! Aguarde alguns minutos e tente novamente!",
                        existingQueues,
                        isAlreadyCalled: true,
                      };
                    } else {
                      // Já passou 15 minutos, pode entrar novamente
                      if (
                        lastQueueData.status === "waiting" &&
                        lastQueueData.queueType === queueType
                      ) {
                        return {
                          canJoin: false,
                          reason: "Você já está nesta fila! Aguarde sua vez.",
                          existingQueues,
                          currentPosition: lastQueueData.position,
                          currentQueueType: queueType,
                          isAlreadyWaiting: true,
                        };
                      }
                      // insere ele na fila com status waiting
                      return {
                        canJoin: true,
                        existingQueues,
                      };
                    }
                  } else {
                    // Se não tem timestamp, verificar pelo status
                    if (
                      calledStatus === "no-show" ||
                      calledStatus === "sem-status"
                    ) {
                      return {
                        canJoin: false,
                        calling: true,
                        existingQueues,
                      };
                    } else {
                      return {
                        canJoin: false,
                        reason:
                          "Você já foi chamado nesta fila! Aguarde alguns minutos e tente novamente!",
                        existingQueues,
                        isAlreadyCalled: true,
                      };
                    }
                  }
                } else {
                  console.log(
                    `⚠️ Nenhum registro encontrado no calledPeople para fila ${queueType}`
                  );
                }
              }
            }
          }

          // Se tem status "called" em qualquer fila, verificar se a fila específica está bloqueada
          if (hasCalledStatus) {
            // Verificar se a fila específica que o usuário quer entrar está bloqueada
            const specificQueueDoc = existingDocs.docs
              .filter((doc) => {
                const data = doc.data();
                return data.queueType === queueType && data.status === "called";
              })
              .sort((a, b) => a.data().createdAt - b.data().createdAt);

            if (specificQueueDoc) {
              const specificQueueData =
                specificQueueDoc[specificQueueDoc.length - 1].data();

              if (specificQueueData.calledAt) {
                const calledTime = specificQueueData?.calledAt?.toDate();
                const currentTime = new Date();
                const timeDifference =
                  currentTime.getTime() - calledTime.getTime();
                const fifteenMinutesInMs = 15 * 60 * 1000;

                if (timeDifference < fifteenMinutesInMs) {
                  return {
                    canJoin: false,
                    reason:
                      "Você já foi chamado nesta fila! Aguarde alguns minutos e tente novamente!",
                    existingQueues,
                    isAlreadyCalled: true,
                  };
                }
              } else {
                // Verificar na calledPeople para esta fila específica
                const calledPeopleQuery = query(
                  collection(db, COLLECTIONS.CALLED_PEOPLE),
                  where("name", "==", user.name),
                  where("phone", "==", user.phone),
                  where("queueType", "==", queueType),
                  orderBy("calledAt", "desc")
                );

                const calledPeopleDocs = await getDocs(calledPeopleQuery);

                if (!calledPeopleDocs.empty) {
                  const calledPeopleData = calledPeopleDocs.docs[0].data();
                  const calledStatus = calledPeopleData.status || "sem-status";
                  const calledAt = calledPeopleData.calledAt;

                  if (calledAt && calledStatus !== "sem-status") {
                    const calledTime = calledAt.toDate();
                    const currentTime = new Date();
                    const timeDifference =
                      currentTime.getTime() - calledTime.getTime();
                    const fifteenMinutesInMs = 15 * 60 * 1000;

                    if (timeDifference < fifteenMinutesInMs) {
                      return {
                        canJoin: false,
                        reason:
                          "Você já foi chamado nesta fila! Aguarde alguns minutos e tente novamente!",
                        existingQueues,
                        isAlreadyCalled: true,
                      };
                    }
                  } else if (
                    calledStatus !== "no-show" &&
                    calledStatus !== "sem-status"
                  ) {
                    return {
                      canJoin: false,
                      reason:
                        "Você já foi chamado nesta fila! Aguarde alguns minutos e tente novamente!",
                      existingQueues,
                      isAlreadyCalled: true,
                    };
                  }
                }
              }
            }
          }

          // Se está em outra fila com status "waiting", verificar se pode entrar em outra fila
          if (hasWaitingStatus) {
            // SEMPRE BLOQUEAR se estiver em qualquer fila com status "waiting"
            const waitingQueueDoc = existingDocs.docs.find((doc) => {
              const data = doc.data();
              return data.status === "waiting";
            });

            if (waitingQueueDoc) {
              const waitingQueueData = waitingQueueDoc.data();

              return {
                canJoin: false,
                reason:
                  "Você já está aguardando em uma fila. Não pode entrar em outra fila ao mesmo tempo. Aguarde sua vez na fila atual.",
                existingQueues,
                isAlreadyWaiting: true,
                currentPosition: waitingQueueData.position || 1,
                currentQueueType: waitingQueueData.queueType,
              };
            }
          }
        }

        return { canJoin: true };
      } catch (error) {
        console.error("❌ Erro ao validar usuário:", error);
        return { canJoin: false, reason: "Erro ao validar usuário" };
      }
    },
    []
  );

  // Função para executar quando chegar EXATAMENTE na posição configurada
  const executeAlmostThereFunction = useCallback(async (person: QueueItem) => {
    try {
      // Buscar configuração atual
      const configResponse = await fetch("/api/config");
      const config = await configResponse.json();

      if (!config.whatsAppEnabled) {
        return;
      }

      // Adicionar delay antes de enviar a mensagem "almost-there"
      // Isso garante que chegue depois do welcome
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 segundos de delay

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
          `✅ WhatsApp "quase lá" enviado para ${person.name} na posição ${person.position} com delay de 5s`
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

  // Função para enviar mensagem de boas-vindas
  const sendWelcomeMessage = useCallback(async (person: QueueItem) => {
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
          type: "welcome",
          position: person.position,
        }),
      });

      if (response.ok) {
        console.log(`✅ WhatsApp de boas-vindas enviado para ${person.name}`);
      } else {
        console.error("❌ Erro ao enviar WhatsApp de boas-vindas");
      }
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem de boas-vindas:", error);
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
          executeAlmostThereFunction({
            id: doc.id,
            ...personData,
            position: position, // Usar a nova posição
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

  // Atualizar posição na fila - DECLARADA ANTES DE SER USADA
  const updatePosition = useCallback(
    async (
      personId: string,
      queueType: QueueType
    ): Promise<number | undefined> => {
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
        let newPosition: number | undefined;

        for (const doc of querySnapshot.docs) {
          const personData = doc.data();
          const currentPosition = personData.position || 1; // Default para 1, não 0

          // Só atualizar se a posição mudou
          if (currentPosition !== position) {
            batch.update(doc.ref, { position });

            // Verificar e executar notificações apenas se mudou
            await checkAndExecuteNotifications(doc, personData, position);
          }

          // Guardar a posição da pessoa que estamos atualizando
          if (doc.id === personId) {
            newPosition = position;
          }

          position++;
        }

        await batch.commit();
        return newPosition;
      } catch (error) {
        console.error("Erro ao atualizar posições:", error);
        return undefined;
      }
    },
    [checkAndExecuteNotifications]
  );

  // Adicionar pessoa à fila - AGORA PODE USAR updatePosition
  const addToQueue = useCallback(
    async (user: User, queueType: QueueType) => {
      try {
        setIsLoading(true);
        setError(null);

        // Validar se pode entrar na fila
        const validation = await validateUserCanJoinQueue(user, queueType);

        if (!validation.canJoin) {
          throw new Error(
            validation.reason || "Não foi possível entrar na fila"
          );
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
        const newPosition = await updatePosition(docRef.id, queueType);

        // Enviar mensagem de boas-vindas
        if (newPosition !== undefined) {
          await sendWelcomeMessage({
            id: docRef.id,
            name: user.name,
            phone: user.phone,
            queueType: queueType,
            position: newPosition,
            createdAt: new Date().toISOString(),
          } as QueueItem);
        }

        return docRef.id;
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Erro ao entrar na fila"
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [validateUserCanJoinQueue, updatePosition, sendWelcomeMessage]
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
        setIsCallingNext(true);
        setError(null);

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
        setError("Erro ao chamar próximo da fila");
      } finally {
        setIsCallingNext(false);
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
    isLoading: isLoading || isCallingNext,
    error,
    addToQueue,
    removeFromQueue,
    callNext,
    updatePosition,
    validateUserCanJoinQueue,
  };
}
