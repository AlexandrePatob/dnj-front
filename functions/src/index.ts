/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions/v2";

// Define a região para todas as funções neste arquivo.
setGlobalOptions({region: "southamerica-east1"});

// Inicializa o Firebase Admin SDK.
initializeApp();

// Importa e re-exporta as funções de seus módulos individuais.
export {joinQueue} from "./api/joinQueue";
export {callNextPerson} from "./api/callNextPerson";
export {getUserQueueStatus} from "./api/getUserQueueStatus";
