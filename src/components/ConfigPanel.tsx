import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Save, RotateCcw, Bell, ChevronDown, ChevronUp } from 'lucide-react';

interface QueueConfig {
  almostTherePosition: number;
  whatsAppEnabled: boolean;
  notificationDelay: number;
  isQueueOpen?: boolean;
}

interface ConfigPanelProps {
  show: boolean;
}

export function ConfigPanel({ show }: ConfigPanelProps) {
  const [config, setConfig] = useState<QueueConfig>({
    almostTherePosition: 5,
    whatsAppEnabled: true,
    notificationDelay: 30,
    isQueueOpen: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Carregar configuração atual
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const saveConfig = async (newConfig?: Partial<QueueConfig>) => {
    setIsLoading(true);
    setMessage('');
    
    const configToSave = { ...config, ...newConfig };

    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave)
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data); // Atualiza o estado com a config retornada pela API
        setMessage('Configuração salva com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(`Erro: ${error.error}`);
      }
    } catch (error) {
      setMessage('Erro ao salvar configuração');
    } finally {
      setIsLoading(false);
    }
  };

  const resetConfig = async () => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' })
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setMessage('Configuração resetada para padrão!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Erro ao resetar configuração');
    }
  };

  const handleToggleQueueStatus = () => {
    saveConfig({ isQueueOpen: !config.isQueueOpen });
  };

  // Se não estiver visível, não renderizar nada
  if (!show) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Posição "Quase Lá" */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Posição para notificação "Quase Lá"
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            max="20"
            value={config.almostTherePosition}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              almostTherePosition: parseInt(e.target.value) || 1
            }))}
            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
          <span className="text-sm text-white">
            (1-20)
          </span>
        </div>
        <p className="text-xs text-white">
          Enviar WhatsApp quando a pessoa estiver entre as {config.almostTherePosition} primeiras posições
        </p>
      </div>

      {/* Habilitar/Desabilitar WhatsApp */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.whatsAppEnabled}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              whatsAppEnabled: e.target.checked
            }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-white">
            Habilitar notificações WhatsApp
          </span>
        </label>
        <p className="text-xs text-white">
          Controla se o sistema deve enviar mensagens via WhatsApp
        </p>
      </div>

      {/* Controle da Fila */}
      <div className="space-y-2 pt-4 border-t border-gray-600">
        <h3 className="text-lg font-semibold text-white">Controle da Fila</h3>
        <p className="text-xs text-white pb-2">
          Habilite ou desabilite a entrada de novas pessoas na fila.
        </p>
        <Button
            onClick={handleToggleQueueStatus}
            disabled={isLoading}
            className={`w-full ${
              config.isQueueOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isLoading
              ? 'Atualizando...'
              : config.isQueueOpen
              ? 'Finalizar Atendimento (Fechar Fila)'
              : 'Iniciar Atendimento (Abrir Fila)'}
          </Button>
          <p className="text-center text-sm text-white pt-1">
            Status atual da fila: <strong>{config.isQueueOpen ? 'Aberta' : 'Fechada'}</strong>
          </p>
      </div>

      {/* Mensagem de Status */}
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes('Erro') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => saveConfig()}
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
        
        <Button
          onClick={resetConfig}
          variant="outline"
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar para Padrão
        </Button>
      </div>

      {/* Informações Adicionais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Como Funciona:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Posição "Quase Lá"</strong>: Envia WhatsApp quando pessoa está entre as {config.almostTherePosition} primeiras posições</li>
          <li>• <strong>É a Vez</strong>: Envia WhatsApp automaticamente quando é chamado!</li>
          <li>• <strong>Boas-vindas</strong>: Envia WhatsApp quando entra na fila</li>
          <li>• <strong>WhatsApp</strong>: {config.whatsAppEnabled ? '✅ Habilitado' : '❌ Desabilitado'}</li>
          <li>• <strong>Fila</strong>: {config.isQueueOpen ? '✅ Aberta' : '❌ Fechada'}</li>
        </ul>
      </div>
    </div>
  );
}
