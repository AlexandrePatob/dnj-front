"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, ArrowRight } from "lucide-react";
import { User as UserType } from "@/lib/types";
import { Header } from "@/components";

export default function Home() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const router = useRouter();

  // Aplicar máscara de telefone
  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, "");

    // Aplica a máscara (41) 9 9978-6268
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(
        3
      )}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(
        3,
        7
      )}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhone(value);
    setPhone(formatted);

    // Validação do telefone
    const numbers = value.replace(/\D/g, "");
    if (numbers.length < 10) {
      setPhoneError("Telefone deve ter pelo menos 10 dígitos");
    } else if (numbers.length > 11) {
      setPhoneError("Telefone deve ter no máximo 11 dígitos");
    } else {
      setPhoneError("");
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    // Validação do nome
    if (value.trim().length < 2) {
      setNameError("Nome deve ter pelo menos 2 caracteres");
    } else if (value.trim().split(" ").length < 2) {
      setNameError("Digite seu nome completo");
    } else {
      setNameError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações finais
    if (name.trim().length < 2) {
      setNameError("Nome deve ter pelo menos 2 caracteres");
      return;
    }

    if (name.trim().split(" ").length < 2) {
      setNameError("Digite seu nome completo");
      return;
    }

    const phoneNumbers = phone.replace(/\D/g, "");
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      setPhoneError("Telefone inválido");
      return;
    }

    if (name.trim() && phone.trim() && !nameError && !phoneError) {
      // Salvar no localStorage
      const userData: UserType = { name: name.trim(), phone: phone.trim() };
      localStorage.setItem("userData", JSON.stringify(userData));
      // Redirecionar para seleção de fila
      router.push("/select-queue");
    }
  };

  const isFormValid = () => {
    return (
      name.trim().length >= 2 &&
      name.trim().split(" ").length >= 2 &&
      phone.replace(/\D/g, "").length >= 10 &&
      phone.replace(/\D/g, "").length <= 11 &&
      !nameError &&
      !phoneError
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <Header title="DNJ" subtitle="Espaço Esperança" showLogo={true} />

      {/* Formulário de Cadastro */}
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Crie seu cadastro
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    nameError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Digite seu nome completo"
                  autoComplete="name"
                  required
                />
              </div>
              {nameError && (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              )}
            </div>

            {/* Campo Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone (WhatsApp)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    phoneError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="(41) 9 9999-9999"
                  autoComplete="tel"
                  required
                />
              </div>
              {phoneError && (
                <p className="text-red-500 text-xs mt-1">{phoneError}</p>
              )}
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={!isFormValid()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>Continuar</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            Seus dados serão usados apenas para gerenciar sua posição na fila
          </p>
        </div>
      </div>
    </div>
  );
}
