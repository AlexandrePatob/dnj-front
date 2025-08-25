import { NextRequest, NextResponse } from 'next/server';

interface WhatsAppRequest {
  name: string;
  phone: string;
  queueType: 'confissoes' | 'direcao-espiritual';
  position?: number;
  type: 'turn' | 'almost-there';
}

async function sendWhatsAppNotification(
  name: string, 
  phone: string, 
  queueType: 'confissoes' | 'direcao-espiritual',
  type: 'turn' | 'almost-there',
  position?: number
) {
  try {
    let message: string;
    
    if (type === 'turn') {
      message = `Olá ${name}, é sua vez na fila de ${queueType === 'confissoes' ? 'Confissões' : 'Direção Espiritual'}! \n\nPor favor, dirija-se ao Espaco Esperança.`;
    } else {
      message = `Olá ${name}, você está na posição ${position} da fila de ${queueType === 'confissoes' ? 'Confissões' : 'Direção Espiritual'}.\n\nFique atento, sua vez está chegando!`;
    }

    const response = await fetch('https://webhook.automacaotechs.com.br/webhook/ws-dnj', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        phone,
        message
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send WhatsApp notification: ${response.status}`);
    }

    return { success: true, message: 'WhatsApp notification sent successfully' };
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppRequest = await request.json();
    const { name, phone, queueType, type, position } = body;

    // Validação dos campos obrigatórios
    if (!name || !phone || !queueType || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, phone, queueType, type' },
        { status: 400 }
      );
    }

    // Validação do tipo
    if (!['turn', 'almost-there'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "turn" or "almost-there"' },
        { status: 400 }
      );
    }

    // Validação da posição para tipo "almost-there"
    if (type === 'almost-there' && position === undefined) {
      return NextResponse.json(
        { error: 'Position is required for "almost-there" type' },
        { status: 400 }
      );
    }

    // Enviar notificação
    const result = await sendWhatsAppNotification(name, phone, queueType, type, position);

    // Log da execução
    console.log(`WhatsApp notification sent: ${type} for ${name} (${phone}) in ${queueType} queue`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in WhatsApp API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
