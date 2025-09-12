import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface QueueConfig {
  almostTherePosition: number;
  whatsAppEnabled: boolean;
  notificationDelay: number; // em segundos
  isQueueOpen?: boolean;
}

// Configuração padrão
const DEFAULT_CONFIG: QueueConfig = {
  almostTherePosition: 5,
  whatsAppEnabled: true,
  notificationDelay: 10,
  isQueueOpen: true,
};

// Referência para o documento de configuração no Firebase
const CONFIG_DOC_REF = doc(db, 'config', 'default');

// Função para buscar configuração do Firebase
async function getConfigFromFirebase(): Promise<QueueConfig> {
  try {
    const docSnap = await getDoc(CONFIG_DOC_REF);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        almostTherePosition: data.almostTherePosition || DEFAULT_CONFIG.almostTherePosition,
        whatsAppEnabled: data.whatsAppEnabled !== undefined ? data.whatsAppEnabled : DEFAULT_CONFIG.whatsAppEnabled,
        notificationDelay: data.notificationDelay || DEFAULT_CONFIG.notificationDelay,
        isQueueOpen: data.isQueueOpen !== undefined ? data.isQueueOpen : DEFAULT_CONFIG.isQueueOpen,
      };
    } else {
      // Se não existir, criar com configuração padrão
      await setDoc(CONFIG_DOC_REF, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error('Error getting config from Firebase:', error);
    return DEFAULT_CONFIG;
  }
}

export async function GET() {
  try {
    const config = await getConfigFromFirebase();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error getting config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { almostTherePosition, whatsAppEnabled, notificationDelay, isQueueOpen } = body;

    // Validações
    if (almostTherePosition !== undefined && (almostTherePosition < 1 || almostTherePosition > 20)) {
      return NextResponse.json(
        { error: 'almostTherePosition must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (notificationDelay !== undefined && (notificationDelay < 0 || notificationDelay > 300)) {
      return NextResponse.json(
        { error: 'notificationDelay must be between 0 and 300 seconds' },
        { status: 400 }
      );
    }

    // Buscar configuração atual
    const currentConfig = await getConfigFromFirebase();
    
    // Preparar dados para atualização
    const updateData: Partial<QueueConfig> = {};
    if (almostTherePosition !== undefined) updateData.almostTherePosition = almostTherePosition;
    if (whatsAppEnabled !== undefined) updateData.whatsAppEnabled = whatsAppEnabled;
    if (notificationDelay !== undefined) updateData.notificationDelay = notificationDelay;
    if (isQueueOpen !== undefined) updateData.isQueueOpen = isQueueOpen;

    // Atualizar no Firebase
    await updateDoc(CONFIG_DOC_REF, updateData);

    // Buscar configuração atualizada
    const updatedConfig = await getConfigFromFirebase();
    console.log('Configuration updated in Firebase:', updatedConfig);

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reset') {
      // Reset para configuração padrão no Firebase
      await setDoc(CONFIG_DOC_REF, DEFAULT_CONFIG);
      console.log('Configuration reset to default in Firebase');
      return NextResponse.json(DEFAULT_CONFIG);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in config action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
