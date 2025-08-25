import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Save, RotateCcw, Bell, ChevronDown, ChevronUp } from 'lucide-react';

interface QueueConfig {
  almostTherePosition: number;
  whatsAppEnabled: boolean;
  notificationDelay: number;
}

export function ConfigPanel() {
  const [config, setConfig] = useState<QueueConfig>({
    almostTherePosition: 5,
    whatsAppEnabled: true,
    notificationDelay: 30
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

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

  const saveConfig = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
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

  return (
    <Card className="border border-gray-200 bg-white/60 backdrop-blur-sm">
      <CardHeader 
        className="space-y-2 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <CardTitle className="text-lg font-medium text-gray-700">
              Configurações
            </CardTitle>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {isExpanded ? 'Configure as notificações e comportamentos do sistema' : 'Clique para expandir'}
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6 pt-0">
          {/* Posição "Quase Lá" */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
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
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">
                (1-20)
              </span>
            </div>
            <p className="text-xs text-gray-500">
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
              <span className="text-sm font-medium text-gray-700">
                Habilitar notificações WhatsApp
              </span>
            </label>
            <p className="text-xs text-gray-500">
              Controla se o sistema deve enviar mensagens via WhatsApp
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
              onClick={saveConfig}
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
              <li>• <strong>WhatsApp</strong>: {config.whatsAppEnabled ? '✅ Habilitado' : '❌ Desabilitado'}</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
