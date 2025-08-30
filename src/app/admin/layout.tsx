import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DNJ - Fila de Esperança - Administração",
  description: "Administração do sistema de filas para o DNJ - Dia Nacional da Juventude",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={montserrat.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
