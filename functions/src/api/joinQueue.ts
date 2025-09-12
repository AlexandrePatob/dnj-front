import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { User, QueueType } from "../types";

const db = getFirestore();
const COLLECTIONS = {
  QUEUE: "queue",
  CALLED_PEOPLE: "calledPeople",
} as const;

export const joinQueue = onCall({ region: "southamerica-east1" }, async (request) => {
  const { user, queueType } = request.data as {
    user: User;
    queueType: QueueType;
  };

  if (!user || !user.name || !user.phone || !queueType) {
    throw new HttpsError(
      "invalid-argument",
      "Dados de usuário e tipo de fila são obrigatórios."
    );
  }

  logger.info(`Tentativa de entrada: ${user.name} na fila ${queueType}`);

  try {
    // === VALIDAÇÃO 1: Verificar se já foi chamado (qualquer status) ===
    const currentlyCalledQuery = db
      .collection(COLLECTIONS.CALLED_PEOPLE)
      .where("phone", "==", user.phone)
      .where("queueType", "==", queueType);

    const currentlyCalledSnapshot = await currentlyCalledQuery.get();
    if (!currentlyCalledSnapshot.empty) {
      const calledDoc = currentlyCalledSnapshot.docs[0];
      const calledData = calledDoc.data();
      
      // Se está aguardando confirmação, retorna que foi chamado
      if (calledData.status === "waiting") {
        logger.info(`${user.name} já foi chamado e está aguardando confirmação.`);
        return {
          status: "called",
          message: "Você já foi chamado! Dirija-se ao local de atendimento.",
          docId: calledDoc.id,
          calledAt: calledData.calledAt
        };
      }
      
      // Se já foi confirmado ou completado, bloqueia entrada
      logger.warn(`Entrada bloqueada para ${user.name}: já foi chamado e ${calledData.status}.`);
      throw new HttpsError(
        "failed-precondition",
        "Você já foi chamado nesta fila. Não é possível entrar novamente."
      );
    }

    // === VALIDAÇÃO 2: Trava de 15 minutos (sem alteração) ===
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentCallQuery = db
      .collection(COLLECTIONS.CALLED_PEOPLE)
      .where("phone", "==", user.phone)
      .where("queueType", "==", queueType)
      .where("calledAt", ">=", fifteenMinutesAgo);

    const recentCallSnapshot = await recentCallQuery.get();
    if (!recentCallSnapshot.empty) {
      logger.warn(`Entrada bloqueada para ${user.name}: chamado recentemente.`);
      throw new HttpsError(
        "failed-precondition",
        "Você já foi chamado nesta fila recentemente. Aguarde 15 minutos para entrar novamente."
      );
    }

    // === VALIDAÇÃO 3: Fila única & Recuperação de Sessão (LÓGICA CORRIGIDA) ===
    const alreadyInQueueQuery = db.collection(COLLECTIONS.QUEUE)
        .where("phone", "==", user.phone);

    const alreadyInQueueSnapshot = await alreadyInQueueQuery.get();
    if (!alreadyInQueueSnapshot.empty) {
      // Se já existe ALGUÉM com este telefone, pegamos o primeiro registro.
      // O telefone é o identificador único, não o nome.
      const userDoc = alreadyInQueueSnapshot.docs[0];
      const existingQueueType = userDoc.data().queueType;

      // CASO 1: A pessoa está na MESMA fila. Recuperar sessão.
      if (existingQueueType === queueType) {
        logger.info(`Recuperando sessão para o telefone ${user.phone} na fila ${queueType}`);
        return {
          status: "success",
          message: "Sua sessão na fila foi recuperada.",
          docId: userDoc.id,
        };
      }

      // CASO 2: A pessoa está em uma fila DIFERENTE. Bloquear.
      logger.warn(`Entrada bloqueada para o telefone ${user.phone}: já está na fila ${existingQueueType}.`);
      throw new HttpsError("failed-precondition", `Este telefone já está sendo usado na fila de ${existingQueueType}. Não é possível entrar em duas filas ao mesmo tempo.`);
    }

    // === SUCESSO: Adicionar à fila (se não caiu em nenhuma validação acima) ===
    const docRef = await db.collection(COLLECTIONS.QUEUE).add({
      name: user.name,
      phone: user.phone,
      queueType: queueType,
      createdAt: FieldValue.serverTimestamp(),
    });
    
    // --- DISPARAR NOTIFICAÇÃO DE BOAS-VINDAS ---
    const notificationUrl = 'https://fila.dnjcuritiba.com.br/api/whatsapp';
    try {
      await fetch(notificationUrl, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
              name: user.name,
              phone: user.phone,
              queueType: queueType,
              type: 'welcome'
          })
      });
      logger.info(`Notificação 'welcome' enviada para ${user.name}`);
    } catch (e) {
       logger.error("Erro ao chamar a API de notificação do WhatsApp:", e);
    }
    // --- FIM DA NOTIFICAÇÃO ---

    logger.info(
      `Sucesso: ${user.name} adicionado à fila ${queueType} com ID: ${docRef.id}`
    );
    return {
      status: "success",
      message: "Você entrou na fila!",
      docId: docRef.id,
    };
  } catch (error) {
    logger.error(`Erro ao adicionar ${user.name} à fila:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      "Ocorreu um erro interno ao tentar entrar na fila."
    );
  }
});
