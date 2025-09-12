"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, Heart } from "lucide-react";
import { Header, StatusCard, BackButton } from "../../components";

export default function ThankYouPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    localStorage.removeItem("calledData")
    // Contagem regressiva de 1 minuto (60 segundos)
    const countdownTime = 60; // 1 minuto
    setTimeLeft(countdownTime);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen p-4 bg-[#181818] text-white">
      <Header showLogo={true} queueType="confissoes" />

      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Obrigado pela sua presença!
              </h1>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <span className="text-lg font-semibold text-green-600">
                  Continue aproveitando o DNJ!
                </span>
              </div>

              {timeLeft !== null && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    Esta página será redirecionada em {formatTime(timeLeft)}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Graça e Paz
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Que este momento seja repleto de graça e paz em sua vida.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <BackButton
            href="/select-queue"
            text="Voltar ao início"
            className="text-white"
          />
        </div>
      </div>
    </div>
  );
}
