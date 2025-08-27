import { NextRequest, NextResponse } from "next/server";

interface WhatsAppRequest {
  name: string;
  phone: string;
  queueType: "confissoes" | "direcao-espiritual";
  position?: number;
  type: "turn" | "almost-there" | "welcome";
}

async function sendWhatsAppNotification(
  name: string,
  phone: string,
  queueType: "confissoes" | "direcao-espiritual",
  type: "turn" | "almost-there" | "welcome",
  position?: number
) {
  try {
    let message: string;
    const queueName =
      queueType === "confissoes" ? "Confissões" : "Direção Espiritual";

    if (type === "turn") {
      message = `Agora sim! Você foi *_Chamado à Eternidade!_* Chegou sua vez ${name}! :)\n\nFaça uma ótima ${queueName}! Se quiser pode fazer sua oração de penitência ou ação de graças na Paróquia ao lado do Espaço Esperança.\n\nDeus abençoe e Salve Maria!\n_______\n*Esta é uma mensagem automática, não precisa responder :)*`;
    } else if (type === "almost-there") {
      message = `Oba! Está chegando sua vez ${name}! :D\n\n_*Você está na posição ${position}!*_\n\nVá se direcionando para o Espaço Esperança para poder desfrutar da sua ${queueName}!\n_______\n*Esta é uma mensagem automática, não precisa responder :)`;
    } else if (type === "welcome") {
      message = `Oi ${name}! Você já está na fila para ${queueName}! :D\n\n* Primeiro, fique atento(a) ao número de pessoas na sua frente no web-app!\n* Você pode curtir o DNJ enquanto espera, mas evite ficar muito longe pois pode demorar pra se deslocar.\n* Não deixe de acompanhar a todo momento no site para não perder sua vez!\n* Aqui no whats também iremos tentar te avisar quando estiver chegando próximo da sua vez, ok?\n\nAh, aproveite pra ler algumas dicas que deixamos pra você lá no web-app (onde você se inscreveu pra fila) pra você poder estar preparado para este momento! :)\n\nDesejamos que você tenha uma ${queueName} abençoada!\n\n_*Se, portanto, ressuscitastes com Cristo, buscai as coisas lá do alto, onde Cristo está sentado à direita de Deus. (Col 3,1)*_\n_____________________\n_*Esta é uma mensagem automática, não precisa responder :)_*`;
    } else {
      throw new Error("Tipo de mensagem inválido");
    }

    const response = await fetch(
      "https://webhook.automacaotechs.com.br/webhook/ws-dnj",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          message,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send WhatsApp notification: ${response.status}`);
    }

    return { success: true, message: "WhatsApp notification sent successfully" };
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
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
        { error: "Missing required fields: name, phone, queueType, type" },
        { status: 400 }
      );
    }

    // Validação do tipo
    if (!["turn", "almost-there", "welcome"].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "turn", "almost-there" or "welcome"' },
        { status: 400 }
      );
    }

    // Validação da posição para tipos que precisam
    if (
      (type === "almost-there" || type === "welcome") &&
      position === undefined
    ) {
      return NextResponse.json(
        {
          error: 'Position is required for "almost-there" and "welcome" types',
        },
        { status: 400 }
      );
    }

    // Enviar notificação
    const result = await sendWhatsAppNotification(
      name,
      phone,
      queueType,
      type,
      position
    );

    // Log simples da execução
    console.log(`📱 WhatsApp: ${type} for ${name} (${phone}) in ${queueType} queue`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in WhatsApp API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
