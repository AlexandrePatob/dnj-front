import { useState, useEffect } from 'react';
import { useFirebaseQueue } from './useFirebaseQueue';
import { useFirebaseCalledPeople } from './useFirebaseCalledPeople';
import { User, QueueType } from './types';

export function useWaitingStatus(user: User | null, queueType: QueueType) {
  const [userPosition, setUserPosition] = useState(0);
  const [totalInQueue, setTotalInQueue] = useState(0);
  const [isCalled, setIsCalled] = useState(false);
  const [hasProcessedQueueUpdate, setHasProcessedQueueUpdate] = useState(false);

  // USAR OS MESMOS HOOKS QUE O ADMIN USA!
  const { queue, isLoading, error } = useFirebaseQueue();
  const { calledPeople } = useFirebaseCalledPeople();

  // Atualizar posição do usuário quando a fila mudar (IGUAL AO ADMIN)
  useEffect(() => {
    if (queue.length > 0 && user) {
      // Filtrar apenas a fila do tipo atual
      const currentQueue = queue.filter(
        (person) => person.queueType === queueType
      );

      // Encontrar posição do usuário
      const userInQueue = currentQueue.find(
        (person) =>
          person.name === user.name &&
          person.phone === user.phone
      );

      if (userInQueue) {
        // Usuário encontrado na fila
        setUserPosition(userInQueue.position);
        setTotalInQueue(currentQueue.length);
        setHasProcessedQueueUpdate(true);
      } else {
        // Usuário não está mais na fila
        if (hasProcessedQueueUpdate && userPosition > 0) {
          // Usuário saiu da fila
        }
      }
    }
  }, [queue, user, queueType, hasProcessedQueueUpdate, userPosition]);

  // Verificar se foi chamado quando calledPeople mudar (IGUAL AO ADMIN)
  useEffect(() => {
    if (!user || !hasProcessedQueueUpdate) return;

    // Filtrar pessoas chamadas para este usuário específico
    const userCalled = calledPeople.find(
      (person) =>
        person.name === user.name &&
        person.phone === user.phone &&
        person.queueType === queueType &&
        person.status === 'waiting'
    );

    if (userCalled) {
      setIsCalled(true);
    }
  }, [calledPeople, user, queueType, hasProcessedQueueUpdate]);

  return {
    userPosition,
    totalInQueue,
    isCalled,
    hasProcessedQueueUpdate,
    isLoading,
    error
  };
}
