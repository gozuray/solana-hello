"use client";

import { ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";

// Importa estilos por única vez
import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProvider({ children }: { children: ReactNode }) {
  // Endpoint a Devnet
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);

  // Lista de wallets soportadas
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
