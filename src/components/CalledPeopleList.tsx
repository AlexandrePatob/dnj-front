import { useState, useEffect } from "react";
import { CalledPerson, QueueType } from "../lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Heart,
  Users,
  Bell,
  Loader2,
} from "lucide-react";

interface CalledPeopleListProps {
  calledPeople: CalledPerson[];
  onConfirm: (id: string) => void;
  onNoShow: (id: string) => void;
  onRemove: (id: string) => void;
  queueType?: QueueType; // Opcional para filtrar por tipo
  title?: string; // Título personalizado
  onCallNext?: () => void; // Função para chamar próximo
  isLoading?: boolean; // Loading individual para cada fila
  queueLength?: number; // Quantidade de pessoas na fila
  queueLengthCalled?: number; // Quantidade de pessoas na fila chamadas
}

export function CalledPeopleList({
  calledPeople,
  onConfirm,
  onNoShow,
  onRemove,
  queueType,
  title,
  onCallNext,
  isLoading = false,
  queueLength = 0,
  queueLengthCalled = 0,
}: CalledPeopleListProps) {
  // Remover estado centralizado de timer

  // Filtrar pessoas por tipo de fila e por tempo
  const filteredCalledPeople = (
    queueType
      ? calledPeople.filter((person) => person.queueType === queueType)
      : calledPeople
  ).filter((person) => {
    // Sempre mostrar pessoas aguardando
    if (person.status === "waiting") return true;

    // Para confirmed e no-show, só mostrar se foi atualizado recentemente (1 minuto)
    if (person.status === "confirmed" || person.status === "no-show") {
      if(!person.updatedAt) return false;
      const now = Date.now();
      const updatedAt = person.updatedAt
      const oneMinuteAgo = now - 60 * 1000; // 1 minuto em ms

      return updatedAt > oneMinuteAgo;
    }

    return false;
  });

  // Filtrar pessoas por tipo específico para as tabs
  const confissoesCalledPeople = calledPeople
    .filter((person) => person.queueType === "confissoes")
    .filter((person) => {
      if (person.status === "waiting") return true;
      if (person.status === "confirmed" || person.status === "no-show") {
        if(!person.updatedAt) return false;
        const now = Date.now();
        const updatedAt = person.updatedAt || person.calledAt;
        const oneMinuteAgo = now - 60 * 1000;
        return updatedAt > oneMinuteAgo;
      }
      return false;
    });

  const direcaoEspiritualCalledPeople = calledPeople
    .filter((person) => person.queueType === "direcao-espiritual")
    .filter((person) => {
      if (person.status === "waiting") return true;
      if (person.status === "confirmed" || person.status === "no-show") {
        const now = Date.now();
        const updatedAt = person.updatedAt || person.calledAt;
        const oneMinuteAgo = now - 60 * 1000;
        return updatedAt > oneMinuteAgo;
      }
      return false;
    });

  // Verificar se há pessoas que estão em ambas as filas (para mostrar alerta)
  const checkDuplicatePersons = (people: CalledPerson[]) => {
    const personMap = new Map<string, CalledPerson[]>();

    people.forEach((person) => {
      const key = `${person.name}_${person.phone}`;
      if (!personMap.has(key)) {
        personMap.set(key, []);
      }
      personMap.get(key)!.push(person);
    });

    return personMap;
  };

  // Remover lógica de timer centralizado - cada pessoa gerencia o seu

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: CalledPerson["status"]) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "no-show":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: CalledPerson["status"]) => {
    switch (status) {
      case "waiting":
        return <Clock className="w-4 h-4" />;
      case "confirmed":
        return <UserCheck className="w-4 h-4" />;
      case "no-show":
        return <UserX className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: CalledPerson["status"]) => {
    switch (status) {
      case "waiting":
        return "Aguardando";
      case "confirmed":
        return "Confirmado";
      case "no-show":
        return "Não Compareceu";
      default:
        return "Desconhecido";
    }
  };

  // Definir título e ícone baseado no tipo
  const getQueueTitle = () => {
    return "Chamados";
  };

  const getQueueIcon = () => {
    if (queueType === "confissoes")
      return <Heart className="w-5 h-5 text-blue-600" />;
    if (queueType === "direcao-espiritual")
      return <Users className="w-5 h-5 text-green-600" />;
    return null;
  };

  // Componente para renderizar uma pessoa chamada - COM TIMER PRÓPRIO
  const CalledPersonItem = ({ person }: { person: CalledPerson }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    // Timer individual para cada pessoa
    useEffect(() => {
      if (person.status !== "waiting") return;

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, person.expiresAt - now);
        setTimeLeft(remaining);
      };

      // Atualizar imediatamente
      updateTimer();

      // Atualizar a cada segundo
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }, [person.id, person.status, person.expiresAt]);

    return (
      <div
        key={person.id}
        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
          person.status === "waiting"
            ? "border-yellow-200 bg-yellow-50"
            : person.status === "confirmed"
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex flex-col space-y-2">
          {/* Header com nome e status */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-gray-800 truncate">
                {person.name}
              </h3>
              <div className="flex flex-col space-y-1 text-xs text-gray-600 mt-1">
                <span>
                  {person.queueType === "confissoes"
                    ? "Confissões"
                    : "Direção Espiritual"}
                </span>
                <span className="text-gray-400">
                  Chamado às{" "}
                  {new Date(person.calledAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2 ml-3 flex-shrink-0">
              <Badge className={getStatusColor(person.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(person.status)}
                  <span className="text-xs">
                    {getStatusText(person.status)}
                  </span>
                </div>
              </Badge>

              {person.status === "waiting" && timeLeft > 0 && (
                <Badge
                  variant="outline"
                  className="font-mono text-xs text-black"
                >
                  {formatTime(timeLeft)}
                </Badge>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          {person.status === "waiting" && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={() => onConfirm(person.id)}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Sim (Compareceu)
              </Button>
              <Button
                onClick={() => onNoShow(person.id)}
                size="sm"
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 text-sm py-2"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Não (Não Compareceu)
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Se não há pessoas chamadas, mostrar mensagem vazia COM BOTÃO
  if (calledPeople.length === 0) {
    return (
      <Card className="border-2 border-gray-200 bg-white backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-md text-black flex items-center gap-2">
              {getQueueTitle()}
              <Badge variant="secondary" className="ml-2">
                {queueLengthCalled}
              </Badge>
            </CardTitle>
            {onCallNext && (
              <Button
                onClick={onCallNext}
                disabled={queueLength === 0 || isLoading}
                className={`${
                  queueType === "confissoes"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
                size="sm"
              >
                <Bell className="w-4 h-4 mr-2" />
                Chamar Próximo
                {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8 text-black">
            Ninguém chamado no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  // Se há um tipo específico definido, mostrar apenas essa lista (para desktop)
  if (queueType) {
    if (filteredCalledPeople.length === 0) {
      return (
        <Card className="border-2 border-gray-200 bg-white backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-md text-black flex items-center gap-2">
                {getQueueTitle()}
                <Badge variant="secondary" className="ml-2">
                  {queueLengthCalled}
                </Badge>
              </CardTitle>
              {onCallNext && (
                <Button
                  onClick={onCallNext}
                  disabled={queueLength === 0 || isLoading}
                  className={`${
                    queueType === "confissoes"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                  size="sm"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Chamar Próximo
                  {isLoading && (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8 text-black">
              Ninguém chamado no momento
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-2 border-gray-200 bg-white backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-md text-black flex items-center gap-2">
              {getQueueTitle()}
              <Badge variant="secondary" className="ml-2">
                {filteredCalledPeople.length}
              </Badge>
            </CardTitle>
            {onCallNext && (
              <Button
                onClick={onCallNext}
                disabled={queueLength === 0 || isLoading}
                className={`${
                  queueType === "confissoes"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
                size="sm"
              >
                <Bell className="w-4 h-4 mr-2" />
                Chamar Próximo
                {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {filteredCalledPeople.map((person) => (
              <CalledPersonItem key={person.id} person={person} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Para mobile: mostrar tabs separando as duas filas
  return (
    <div className="md:hidden">
      <Tabs defaultValue="confissoes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="confissoes"
            className="flex items-center space-x-2 data-[state=active]:bg-christblue data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
          >
            <Heart className="w-4 h-4" />
            <span>Confissões</span>
            <Badge
              variant="secondary"
              className="ml-1 data-[state=active]:bg-white data-[state=active]:text-christblue"
            >
              {confissoesCalledPeople.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="direcao-espiritual"
            className="flex items-center space-x-2 data-[state=active]:bg-christgreen data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-md"
          >
            <Users className="w-4 h-4" />
            <span>Direção Espiritual</span>
            <Badge
              variant="secondary"
              className="ml-1 data-[state=active]:bg-white data-[state=active]:text-white data-[state=active]:text-christgreen"
            >
              {direcaoEspiritualCalledPeople.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="confissoes" className="mt-6">
          <Card className="border-2 border-christblue-light bg-white backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-christblue-dark flex items-center gap-2">
                  <Heart className="w-6 h-6 text-christblue" />
                  Confissões - Chamados
                  <Badge variant="secondary" className="ml-2">
                    {confissoesCalledPeople.length}
                  </Badge>
                </CardTitle>
                {onCallNext && (
                  <Button
                    onClick={onCallNext}
                    disabled={queueLength === 0 || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Chamar Próximo
                    {isLoading && (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {confissoesCalledPeople.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {confissoesCalledPeople.map((person) => (
                    <CalledPersonItem key={person.id} person={person} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Ninguém chamado no momento
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="direcao-espiritual" className="mt-6">
          <Card className="border-2 border-christgreen-light bg-white backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-christgreen-dark flex items-center gap-2">
                  <Users className="w-6 h-6 text-christgreen" />
                  Direção Espiritual - Chamados
                  <Badge variant="secondary" className="ml-2">
                    {direcaoEspiritualCalledPeople.length}
                  </Badge>
                </CardTitle>
                {onCallNext && (
                  <Button
                    onClick={onCallNext}
                    disabled={queueLength === 0 || isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Chamar Próximo
                    {isLoading && (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {direcaoEspiritualCalledPeople.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {direcaoEspiritualCalledPeople.map((person) => (
                    <CalledPersonItem key={person.id} person={person} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Ninguém chamado no momento
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
