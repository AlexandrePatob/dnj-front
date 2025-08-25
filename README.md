# 🚀 Sistema de Fila Digital DNJ - Espaço Esperança

Sistema moderno de gerenciamento de filas digitais para eventos religiosos, desenvolvido com Next.js, Firebase e TypeScript.

## ✨ Funcionalidades Principais

### 🎯 Para Usuários
- **Cadastro Simplificado**: Nome completo e telefone WhatsApp
- **Validação Inteligente**: Verificação automática de dados
- **Seleção de Fila**: Escolha entre Confissões ou Direção Espiritual
- **Posição em Tempo Real**: Acompanhe sua posição na fila
- **Notificações WhatsApp**: Receba alertas automáticos
- **Interface Responsiva**: Funciona perfeitamente em mobile e desktop

### 🛠️ Para Administradores
- **Painel Administrativo**: Controle total do sistema
- **Gerenciamento de Filas**: Visualize e gerencie ambas as filas
- **Chamada de Pessoas**: Sistema de chamada automática
- **Confirmação de Presença**: Controle de comparecimento
- **Configurações Flexíveis**: Personalize notificações e comportamentos
- **Histórico Completo**: Acompanhe todas as atividades

### 🔔 Sistema de Notificações
- **WhatsApp Automático**: Integração com webhook
- **Notificação "Quase Lá"**: Alerta quando próximo da vez
- **Notificação "É a Vez"**: Alerta quando chamado
- **Configurável**: Posição personalizável para alertas

## 🏗️ Arquitetura Técnica

### Frontend
- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática para maior confiabilidade
- **Tailwind CSS**: Estilização moderna e responsiva
- **Radix UI**: Componentes acessíveis e customizáveis

### Backend & Banco
- **Firebase Firestore**: Banco de dados em tempo real
- **APIs Next.js**: Endpoints para configuração e WhatsApp
- **Webhooks**: Integração com serviços externos

### Estado & Dados
- **Hooks Customizados**: Lógica de negócio reutilizável
- **Firebase Realtime**: Sincronização automática de dados
- **Local Storage**: Persistência local de dados do usuário

## 🚀 Como Usar

### Para Usuários
1. Acesse o sistema
2. Preencha nome completo e telefone
3. Escolha o tipo de atendimento
4. Aguarde sua vez na fila
5. Receba notificações via WhatsApp

### Para Administradores
1. Acesse `/admin`
2. Faça login com credenciais
3. Gerencie as filas em tempo real
4. Configure notificações
5. Monitore o sistema

## ⚙️ Configurações

### Sistema de Notificações
- **Posição "Quase Lá"**: Configurável (padrão: posição 5)
- **WhatsApp**: Habilitado/desabilitado
- **Delay**: Tempo entre notificações

### Filas Disponíveis
- **Confissões**: Sacramentos de reconciliação
- **Direção Espiritual**: Orientação espiritual personalizada

## 🔧 Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Firebase

### Setup
```bash
# Clone o repositório
git clone [url-do-repositorio]

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env.local

# Execute em desenvolvimento
npm run dev
```

### Variáveis de Ambiente
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## 📱 Funcionalidades Mobile

- **Design Responsivo**: Adapta-se a qualquer dispositivo
- **Touch-Friendly**: Interface otimizada para toque
- **PWA Ready**: Funciona offline quando possível
- **Notificações Push**: Suporte a notificações do navegador

## 🔒 Segurança

- **Validação de Dados**: Verificação rigorosa de entrada
- **Autenticação Admin**: Sistema de login seguro
- **Sanitização**: Proteção contra injeção de dados
- **HTTPS**: Comunicação criptografada

## 📊 Monitoramento

- **Logs em Tempo Real**: Acompanhe todas as operações
- **Métricas de Uso**: Estatísticas de filas
- **Alertas Automáticos**: Notificações de problemas
- **Backup Automático**: Dados sempre seguros

## 🚀 Deploy

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Vercel
```bash
npm run build
vercel --prod
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🙏 Agradecimentos

- Comunidade DNJ Curitiba
- Espaço Esperança
- Contribuidores do projeto

---

**Desenvolvido com ❤️ para a comunidade DNJ**

