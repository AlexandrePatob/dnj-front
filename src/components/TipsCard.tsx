import { useState } from "react";
import { QueueType } from "@/lib/types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TipsCardProps {
  queueType: QueueType;
  className?: string;
}

export function TipsCard({ queueType, className = "" }: TipsCardProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index) // Remove apenas este item se já estiver aberto
        : [...prev, index] // Adiciona este item aos já abertos
    );
  };

  const getTipsContent = () => {
    if (queueType === "confissoes") {
      return [
        {
          title: "1. Prepare o Coração",
          content: (
            <div className="space-y-3">
              <p>Antes de tudo, fale com Deus: peça luz e coragem.</p>
              <p className="italic text-gray-600">"Senhor, mostra-me onde preciso mudar e me dá força para recomeçar."</p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-800">
                💡 Dica: Respire fundo, fique em silêncio por alguns segundos e peça que o Espírito Santo te ilumine.
              </div>
            </div>
          )
        },
        {
          title: "2. Exame de Consciência",
          content: (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-800 mb-2">Com Deus:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Tenho rezado todos os dias?</li>
                  <li>Participei da Missa ou faltei sem motivo?</li>
                  <li>Usei o nome de Deus em vão?</li>
                  <li>Acreditei em horóscopos, simpatias ou coisas do oculto?</li>
                  <li>Recebi a Comunhão sem estar preparado?</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold text-gray-800 mb-2">Com os outros:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Tratei meus pais, irmãos e professores com respeito?</li>
                  <li>Falei mal de alguém, contei mentiras ou guardei mágoa?</li>
                  <li>Desejei o mal ou incentivei alguém a errar?</li>
                  <li>Briguei, fui violento ou desrespeitoso?</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-2">Comigo mesmo:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Tive pensamentos ou atitudes impuras?</li>
                  <li>Vi pornografia ou coisas que me afastam de Deus?</li>
                  <li>Fui preguiçoso, negligenciei estudos ou deveres?</li>
                  <li>Usei drogas ou bebi em excesso?</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-800">
                💡 Dica: Seja honesto. Confissão não é sobre se culpar, é sobre se libertar!
              </div>
            </div>
          )
        },
        {
          title: "3. Procure o Sacerdote",
          content: (
            <div className="space-y-3">
              <p>Quando chegar sua vez, faça o sinal da cruz e diga:</p>
              <p className="italic text-gray-600">"Em nome do Pai, e do Filho e do Espírito Santo. Amém."</p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-800">
                💡 Dica: Não tenha medo! O padre está ali para te ajudar, não para te julgar.
              </div>
            </div>
          )
        },
        {
          title: "4. Confesse-se com sinceridade",
          content: (
            <div className="space-y-3">
              <p>Pode começar assim: <span className="italic text-gray-600">"Padre, faz tanto tempo desde minha última confissão..."</span></p>
              <p>Depois, conte seus pecados <strong>e a quantidade aproximada que os cometeu</strong>.</p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-800">
                💡 Dica: Não precisa contar a história, apenas dizer o pecado e a quantidade. Seja claro e simples.
              </div>
            </div>
          )
        },
        {
          title: "5. Ato de Contrição",
          content: (
            <div className="space-y-3">
              <p>Você pode dizer algum que conheça ou:</p>
              <p className="italic text-gray-600">"Senhor Jesus, Filho de, tem piedade de mim que sou pecador."</p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-800">
                💡 Dica: O importante é você estar verdadeiramente arrependido e, mesmo consciente da sua fraqueza, estar disposto a nunca mais pecar.
              </div>
            </div>
          )
        },
        {
          title: "6. Absolvição e Penitência",
          content: (
            <div className="space-y-3">
              <p>O padre vai dizer a fórmula da absolvição e você será perdoado:</p>
              <p className="italic text-gray-600">"… Eu te absolvo dos teus pecados, em nome do Pai, e do Filho e do Espírito Santo."</p>
              <p>Depois, cumpra a penitência que ele indicar.</p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-800">
                💡 Dica: Não saia sem fazer a penitência. Ela é necessária e ajuda a reforçar sua decisão de mudança.
              </div>
            </div>
          )
        }
      ];
    } else {
      return [
        {
          title: "1. Prepare-se mentalmente",
          content: (
            <div className="space-y-3 text-black">
              <p>Pense nas questões que gostaria de abordar durante a orientação.</p>
              <div className="bg-green-50 border-l-4 border-green-400 p-3 text-sm text-green-800">
                💡 Dica: Anote suas dúvidas para não esquecer nada importante.
              </div>
            </div>
          )
        },
        {
          title: "2. Esteja aberto",
          content: (
            <div className="space-y-3">
              <p>Esteja aberto para receber orientações e conselhos.</p>
              <div className="bg-green-50 border-l-4 border-green-400 p-3 text-sm text-green-800">
                💡 Dica: A humildade é essencial para o crescimento espiritual.
              </div>
            </div>
          )
        },
        {
          title: "3. Momento de reflexão",
          content: (
            <div className="space-y-3">
              <p>Prepare-se para um momento de reflexão e oração.</p>
              <div className="bg-green-50 border-l-4 border-green-400 p-3 text-sm text-green-800">
                💡 Dica: Reserve um tempo para meditar sobre o que foi conversado.
              </div>
            </div>
          )
        }
      ];
    }
  };

  const tips = getTipsContent();

  return (
    <div className={`sm:max-w-lg md:max-w-2xl lg:max-w-4xl ${className}`}>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-white p-6">
          <h3 className="text-xl font-bold text-black text-center">
            {queueType === "confissoes" ? "Como se Confessar no DNJ" : "Dicas Importantes"}
          </h3>
        </div>

        <div className="p-2 md:p-4 lg:p-6">
          {tips.map((tip, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className={`w-full px-4 py-4 text-left transition-colors duration-200 flex justify-between items-center ${
                  queueType === "confissoes" 
                    ? "text-white bg-[#5446fe] hover:bg-[#5446fe]/80" 
                    : "text-black bg-[#b9ff89] hover:bg-[#b9ff89]/80"
                }`}
              >
                <span className="font-semibold">{tip.title}</span>
                {openItems.includes(index) ? (
                  <ChevronUp className={`w-5 h-5 ${
                    queueType === "confissoes" ? "text-white" : "text-black"
                  }`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${
                    queueType === "confissoes" ? "text-white" : "text-black"
                  }`} />
                )}
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openItems.includes(index) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-4 py-4 bg-white border-t border-gray-200 text-black">
                  {tip.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
