"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Users,
  Bell,
  Wifi,
  WifiOff,
  Lock,
  Mail,
  Trash2,
  Settings,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { QueueItem, QueueType } from "../../lib/types";
import { useFirebaseQueue } from "../../lib/useFirebaseQueue"; // Hook refatorado
import { useFirebaseCalledPeople } from "../../lib/useFirebaseCalledPeople";
import { Header, CalledPeopleList } from "@/components";
import { ConfigPanel } from "@/components/ConfigPanel";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verificar se já está logado (persistência simples)
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_authenticated") === "true";
    }
    return false;
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  // --- HOOKS REATORADOS ---
  const { queue, totalInQueue, isLoading, error, callNextPerson } = useFirebaseQueue(); // Novo hook!
  const {
    calledPeople,
    counters,
    confirmPresence,
    markAsNoShow,
    requestNotificationPermission,
  } = useFirebaseCalledPeople();

  useEffect(() => {
    if (isAuthenticated) {
      requestNotificationPermission();
    }
  }, [isAuthenticated, requestNotificationPermission]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (
      email === "fila-esperanca@admin.com.br" &&
      password === "buscaiascoisasdoalto"
    ) {
      setIsAuthenticated(true);
      localStorage.setItem("admin_authenticated", "true");
      setLoginError("");
    } else {
      setLoginError("Email ou senha incorretos");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_authenticated");
    setEmail("");
    setPassword("");
  };

  // --- NOVA FUNÇÃO PARA CHAMAR O PRÓXIMO ---
  const handleCallNext = async (queueType: QueueType) => {
    try {
      await callNextPerson(queueType);
      // O listener do useFirebaseCalledPeople irá atualizar a UI automaticamente
    } catch (error) {
      console.error("Erro ao chamar próximo via Cloud Function:", error);
      // O hook já seta o estado de erro, que será exibido na UI
    }
  };

  // Filtra a lista limitada (top 5 de cada) para exibição
  const confissoesQueue = queue.filter((item) => item.queueType === "confissoes");
  const direcaoEspiritualQueue = queue.filter((item) => item.queueType === "direcao-espiritual");
  const confissoesQueueCalled = calledPeople.filter((item) => item.queueType === "confissoes");
  const direcaoEspiritualQueueCalled = calledPeople.filter((item) => item.queueType === "direcao-espiritual");

  // Calcula o total por fila com base no total global e na contagem de uma das filas
  // NOTA: Isso é uma aproximação. O ideal seria o hook retornar totais separados.
  // Mas para o evento, essa lógica é suficiente e evita mais leituras.
  const totalConfissoes = totalInQueue - direcaoEspiritualQueue.length;
  const totalDirecao = totalInQueue - confissoesQueue.length;

  // Usar contadores otimizados do hook (muito mais eficiente!)
  const confissoesConfirmed = counters.confissoesConfirmed;
  const direcaoEspiritualConfirmed = counters.direcaoEspiritualConfirmed;

  // Componente para renderizar a fila (agora usa o índice do array como posição)
  const QueueContent = ({
    queue,
    colorClass,
    bgClass,
  }: {
    queue: QueueItem[];
    colorClass: string;
    bgClass: string;
  }) => (
    <>
      {queue.length > 0 ? (
        <div className="h-full overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {queue.map((person, index) => (
            <div
              key={person.id}
              className={`flex items-center justify-between p-3 rounded-lg ${bgClass} hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-lg truncate font-sans text-black">
                  {person.name}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`${colorClass} text-white text-sm px-3 py-1 ml-3 flex-shrink-0`}
              >
                {index + 1}º
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-4 font-sans text-black">
          Ninguém na fila
        </p>
      )}
    </>
  );

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return (
      <main
        className="min-h-screen w-full flex items-center justify-center bg-[#181818] text-white"
      >
        <Card className="w-full max-w-lg mx-4">
          <Header
            subtitle="Painel Administrativo"
            showLogo={true}
          />
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>
              </div>

              {loginError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <span>Entrar</span>
              </button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#181818] text-white">
      {/* Header fixo */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-[#181818] text-white"
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Lado esquerdo - Configurações */}
            <div className="w-auto flex items-center gap-3">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-600" />
                {/* Texto responsivo: mobile só ícone, desktop com texto */}
                <span className="hidden sm:inline text-gray-700">Configuração</span>
                {showConfig ? (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>

            {/* Centro - Título Admin */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white font-sans">
                Admin
              </h1>
            </div>

            {/* Lado direito - Status de conexão e Logout */}
            <div className="w-auto flex items-center gap-3">
              <div className="inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium bg-gray-100">
                {!isLoading && !error ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-700"></span>
                  </>
                ) : isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-700"></span>                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-700"></span>
                  </>
                )}
              </div>

              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 bg-white"
              >
                <Lock className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com padding-top para o header fixo */}
      <div className="m-2 mt-10 pt-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              <p className="font-medium">Erro:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Painel de Configurações */}
          <ConfigPanel show={showConfig} />

          {/* Pessoas Chamadas - Separadas por fila */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-6">
            <CalledPeopleList
              calledPeople={calledPeople}
              queueType="confissoes"
              onConfirm={(id: string) => confirmPresence(id)}
              onNoShow={(id: string) => markAsNoShow(id)}
              onRemove={(id: string) => {}} // Não usado mais
              onCallNext={() => handleCallNext("confissoes")}
              isLoading={isLoading}
              queueLength={confissoesQueue.length}
              queueLengthCalled={confissoesQueueCalled.length}
            />
            <CalledPeopleList
              calledPeople={calledPeople}
              queueType="direcao-espiritual"
              onConfirm={(id: string) => confirmPresence(id)}
              onNoShow={(id: string) => markAsNoShow(id)}
              onRemove={(id: string) => {}} // Não usado mais
              onCallNext={() => handleCallNext("direcao-espiritual")}
              isLoading={isLoading}
              queueLength={direcaoEspiritualQueue.length}
              queueLengthCalled={direcaoEspiritualQueueCalled.length}
            />
          </div>

          {/* Mobile: Lista de Chamados com Tabs */}
          <div className="lg:hidden">
            <Tabs defaultValue="confissoes" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger
                  value="confissoes"
                  className="flex items-center space-x-2 data-[state=active]:bg-christblue data-[state=active]:text-white text-black data-[state=active]:shadow-md transition-all duration-200 rounded-md"
                >
                  <Heart className="w-4 h-4" />
                  <span>Confissões</span>
                  <Badge 
                    variant="secondary" 
                    className="ml-1 data-[state=active]:bg-white data-[state=active]:text-christblue"
                  >
                    {confissoesQueue.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="direcao-espiritual"
                  className="flex items-center space-x-2 data-[state=active]:bg-christgreen data-[state=active]:text-white text-black data-[state=active]:shadow-md transition-all duration-200 rounded-md"
                >
                  <Users className="w-4 h-4" />
                  <span>Direção Espiritual</span>
                  <Badge 
                    variant="secondary" 
                    className="ml-1 data-[state=active]:bg-white data-[state=active]:text-christgreen"
                  >
                    {direcaoEspiritualQueue.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="confissoes" className="mt-6">
                {/* Chamados */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-christblue-dark mb-3 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Chamados - Confissões
                  </h3>
                  <CalledPeopleList
                    calledPeople={calledPeople.filter(p => p.queueType === "confissoes")}
                    queueType="confissoes"
                    onConfirm={(id: string) => confirmPresence(id)}
                    onNoShow={(id: string) => markAsNoShow(id)}
                    onRemove={(id: string) => {}} // Não usado mais
                    onCallNext={() => handleCallNext("confissoes")}
                    isLoading={isLoading}
                    queueLength={confissoesQueue.length}
                  />
                </div>

                {/* Fila */}
                <div>
                  <h3 className="text-lg font-semibold text-christblue-dark mb-3 flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    Fila - Confissões
                  </h3>
                  <Card className="border-2 border-christblue-light bg-white backdrop-blur-sm h-[400px] flex flex-col">
                    <CardHeader className="space-y-2 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-sans text-christblue-dark">
                          Confissões
                        </CardTitle>
                        <Heart className="w-6 h-6 text-christblue" />
                      </div>
                      <CardDescription className="text-muted-foreground">
                        <div className="flex justify-between text-sm text-black">
                          <span>Na fila: {confissoesQueue.length}</span>
                          <span className="text-green-600 font-medium">Atendidos: {confissoesConfirmed}</span>
                        </div>
                      </CardDescription>
                      {/* Botão movido para a seção "Chamados" */}
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                      <QueueContent
                        queue={confissoesQueue}
                        colorClass="bg-christblue"
                        bgClass="bg-christblue-light/50"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="direcao-espiritual" className="mt-6">
                {/* Chamados */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-christgreen-dark mb-3 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Chamados - Direção Espiritual
                  </h3>
                  <CalledPeopleList
                    calledPeople={calledPeople.filter(p => p.queueType === "direcao-espiritual")}
                    queueType="direcao-espiritual"
                    onConfirm={(id: string) => confirmPresence(id)}
                    onNoShow={(id: string) => markAsNoShow(id)}
                    onRemove={(id: string) => {}} // Não usado mais
                    onCallNext={() => handleCallNext("direcao-espiritual")}
                    isLoading={isLoading}
                    queueLength={direcaoEspiritualQueue.length}
                  />
                </div>

                {/* Fila */}
                <div>
                  <h3 className="text-lg font-semibold text-christgreen-dark mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Fila - Direção Espiritual
                  </h3>
                  <Card className="border-2 border-christgreen-light bg-white backdrop-blur-sm h-[400px] flex flex-col">
                    <CardHeader className="space-y-2 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-sans text-christgreen-dark">
                          Direção Espiritual
                        </CardTitle>
                        <Users className="w-6 h-6 text-christgreen" />
                      </div>
                      <CardDescription className="text-muted-foreground">
                        <div className="flex justify-between text-sm text-black">
                          <span>Na fila: {direcaoEspiritualQueue.length}</span>
                          <span className="text-green-600 font-medium">Atendidos: {direcaoEspiritualConfirmed}</span>
                        </div>
                      </CardDescription>
                      {/* Botão movido para a seção "Chamados" */}
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                      <QueueContent
                        queue={direcaoEspiritualQueue}
                        colorClass="bg-christgreen"
                        bgClass="bg-christgreen-light/50"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop: Grid de Filas */}
          <div className="hidden md:grid md:grid-cols-2 gap-6">
            {/* Fila de Confissões */}
            <Card className="border-2 border-christblue-light bg-white backdrop-blur-sm h-[500px] flex flex-col">
              <CardHeader className="space-y-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-sans text-christblue-dark">
                    Confissões
                  </CardTitle>
                  <Heart className="w-8 h-8 text-christblue" />
                </div>
                <CardDescription className="text-muted-foreground">
                  <div className="flex justify-between text-sm text-black">
                    <span>Na fila: {totalConfissoes}</span>
                    <span className="text-green-600 font-medium">Atendidos: {confissoesConfirmed}</span>
                  </div>
                </CardDescription>
                {/* Botão movido para a seção "Chamados" */}
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <QueueContent
                  queue={confissoesQueue}
                  colorClass="bg-christblue"
                  bgClass="bg-christblue-light/50"
                />
              </CardContent>
            </Card>

            {/* Fila de Direção Espiritual */}
            <Card className="border-2 border-christgreen-light bg-white backdrop-blur-sm h-[500px] flex flex-col">
              <CardHeader className="space-y-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-sans text-christgreen-dark">
                    Direção Espiritual
                  </CardTitle>
                  <Users className="w-8 h-8 text-christgreen" />
                </div>
                <CardDescription className="text-muted-foreground">
                  <div className="flex justify-between text-sm text-black">
                    <span>Na fila: {totalDirecao}</span>
                    <span className="text-green-600 font-medium">Atendidos: {direcaoEspiritualConfirmed}</span>
                  </div>
                </CardDescription>
                {/* Botão movido para a seção "Chamados" */}
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <QueueContent
                  queue={direcaoEspiritualQueue}
                  colorClass="bg-christgreen"
                  bgClass="bg-christgreen-light/50"
                />
              </CardContent>
            </Card>
          </div>


          {/* Mensagem de fé */}
          <p className="text-center text-sm text-muted-foreground italic font-sans">
            "Porque onde estiverem dois ou três reunidos em meu nome, ali estou
            eu no meio deles." - Mateus 18:20
          </p>
        </div>
      </div>
    </main>
  );
}
