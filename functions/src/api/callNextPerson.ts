import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { QueueType } from "../types";
import fetch from "node-fetch";

const db = getFirestore();
const COLLECTIONS = {
  QUEUE: "queue",
  CALLED_PEOPLE: "calledPeople",
} as const;

export const callNextPerson = onCall({ region: "southamerica-east1" }, async (request) => {
  const { queueType } = request.data as { queueType: QueueType };

  if (!queueType) {
    throw new HttpsError("invalid-argument", "O tipo de fila é obrigatório.");
  }

  logger.info(`Chamando próximo da fila: ${queueType}`);

  try {
    const calledPersonData = await db.runTransaction(async (transaction) => {
      const queueQuery = db
        .collection(COLLECTIONS.QUEUE)
        .where("queueType", "==", queueType)
        .orderBy("createdAt", "asc")
        .limit(1);

      const queueSnapshot = await transaction.get(queueQuery);
      if (queueSnapshot.empty) {
        logger.warn(`Fila ${queueType} está vazia. Ninguém para chamar.`);
        return null;
      }

      const nextPersonDoc = queueSnapshot.docs[0];
      const nextPersonData = nextPersonDoc.data();

      transaction.delete(nextPersonDoc.ref);

      const calledPersonRef = db.collection(COLLECTIONS.CALLED_PEOPLE).doc();
      transaction.set(calledPersonRef, {
        ...nextPersonData,
        calledAt: FieldValue.serverTimestamp(),
        status: 'waiting',
      });

      // --- DISPARAR NOTIFICAÇÃO DO WHATSAPP ---
      const notificationUrl = 'https://fila.dnjcuritiba.com.br/api/whatsapp';
      
      try {
        await fetch(notificationUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: nextPersonData.name,
                phone: nextPersonData.phone,
                queueType: nextPersonData.queueType,
                type: 'turn' // Indica que é a notificação de "Sua Vez"
            })
        });
        logger.info(`Notificação 'turn' enviada para ${nextPersonData.name}`);
      } catch (e) {
         logger.error("Erro ao chamar a API de notificação do WhatsApp:", e);
         // Não bloqueamos a chamada principal se a notificação falhar
      }
      // --- FIM DA NOTIFICAÇÃO ---


      logger.info(
        `Sucesso: ${nextPersonData.name} foi chamado(a) da fila ${queueType}.`
      );

      return {
        id: calledPersonRef.id,
        ...nextPersonData,
      };
    });

    if (calledPersonData === null) {
      return { status: "empty", message: "A fila está vazia." };
    }

    return { status: "success", calledPerson: calledPersonData };
  } catch (error) {
    logger.error(`Erro ao chamar próximo da fila ${queueType}:`, error);
    throw new HttpsError(
      "internal",
      "Ocorreu um erro interno ao chamar o próximo da fila."
    );
  }
});
