import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { CalledPerson } from './types';

const COLLECTION_NAME = 'calledPeople';
const TIMER_DURATION = 5 * 60 * 1000; // 5 minutos

export function useFirebaseCalledPeople() {
  const [calledPeople, setCalledPeople] = useState<CalledPerson[]>([]);
  const [expiredPeople, setExpiredPeople] = useState<CalledPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listener em tempo real para pessoas chamadas
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, COLLECTION_NAME),
        orderBy('calledAt', 'desc')
      ),
      (snapshot) => {
        const calledData: CalledPerson[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          calledData.push({
            id: doc.id,
            name: data.name,
            phone: data.phone,
            queueType: data.queueType,
            calledAt: data.calledAt?.toDate?.()?.getTime() || Date.now(),
            expiresAt: data.expiresAt?.toDate?.()?.getTime() || Date.now() + TIMER_DURATION,
            status: data.status || 'waiting',
            updatedAt: data.updatedAt?.toDate?.()?.getTime() || data.calledAt?.toDate?.()?.getTime() || Date.now()
          });
        });
        
        setCalledPeople(calledData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Erro no listener de pessoas chamadas:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Verificar pessoas expiradas a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const expired = calledPeople.filter(person => 
        person.status === 'waiting' && person.expiresAt <= now
      );
      
      if (expired.length > 0) {
        // Marcar como não compareceu
        expired.forEach(async (person) => {
          try {
            await updateDoc(doc(db, COLLECTION_NAME, person.id), {
              status: 'no-show',
              updatedAt: serverTimestamp()
            });

            // O filtro por tempo vai remover automaticamente após 1 minuto
          } catch (error) {
            console.error('Erro ao marcar como no-show:', error);
          }
        });
        
        // Notificar admin sobre pessoas expiradas
        expired.forEach(person => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Tempo Expirado', {
              body: `${person.name} não confirmou presença em 5 minutos.`,
              icon: '/favicon.ico'
            });
          }
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calledPeople]);

  // Confirmar presença
  const confirmPresence = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: 'confirmed',
        updatedAt: serverTimestamp()
      });
      // O filtro por tempo vai remover automaticamente após 1 minuto
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
    }
  }, []);

  // Marcar como não compareceu
  const markAsNoShow = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: 'no-show',
        updatedAt: serverTimestamp()
      });
      // O filtro por tempo vai remover automaticamente após 1 minuto
    } catch (error) {
      console.error('Erro ao marcar como no-show:', error);
    }
  }, []);

  // Remover pessoa da lista
  const removePerson = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Erro ao remover pessoa:', error);
    }
  }, []);

  // Limpar histórico
  const clearHistory = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      calledPeople.forEach(person => {
        batch.delete(doc(db, COLLECTION_NAME, person.id));
      });
      await batch.commit();
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  }, [calledPeople]);

  // Solicitar permissão para notificações
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    calledPeople,
    expiredPeople,
    isLoading,
    confirmPresence,
    markAsNoShow,
    removePerson,
    clearHistory,
    requestNotificationPermission
  };
}

