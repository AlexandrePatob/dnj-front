import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { User, QueueType } from "../types";

const db = getFirestore();
const COLLECTIONS = {
  QUEUE: "queue",
} as const;

export const getUserQueueStatus = onCall(async (request) => {
  const { user, queueType, docId } = request.data as {
    user: User;
    queueType: QueueType;
    docId: string;
  };

  if (!user || !queueType || !docId) {
    throw new HttpsError(
      "invalid-argument",
      "Dados do usuário, tipo de fila e ID do documento são obrigatórios."
    );
  }

  try {
    const userDocRef = db.collection(COLLECTIONS.QUEUE).doc(docId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return { status: "not_found", position: 0, totalInQueue: 0 };
    }
    const userCreatedAt = userDoc.data()?.createdAt;

    if (!userCreatedAt) {
      throw new HttpsError(
        "internal",
        "Documento do usuário não possui timestamp de criação."
      );
    }

    const positionQuery = db
      .collection(COLLECTIONS.QUEUE)
      .where("queueType", "==", queueType)
      .where("createdAt", "<", userCreatedAt);

    const positionSnapshot = await positionQuery.count().get();
    const position = positionSnapshot.data().count + 1;

    const totalQuery = db
      .collection(COLLECTIONS.QUEUE)
      .where("queueType", "==", queueType);

    const totalSnapshot = await totalQuery.count().get();
    const totalInQueue = totalSnapshot.data().count;

    return { status: "success", position, totalInQueue };
  } catch (error) {
    logger.error(
      `Erro ao obter status para ${user.name} na fila ${queueType}:`,
      error
    );
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      "internal",
      "Ocorreu um erro ao buscar o status da fila."
    );
  }
});
