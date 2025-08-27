"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { PublicKey } from "@solana/web3.js";

import { useWalletTokens } from "../hooks/useWalletTokens";
import TokensList from "../components/TokensList";
import SendAnyTokenCard from "../components/SendAnyTokenCard";

// (opcional) mapa de mints conocidos a símbolos legibles
const MYTOKEN_MINT = new PublicKey(
  "BZ5JKaVvWstSPxbzX16UYg3jQY1MnE5ttPqQHWjEUtcM"
);
const KNOWN = {
  [MYTOKEN_MINT.toBase58()]: { symbol: "MYTOKEN" },
};

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  const { publicKey } = useWallet();

  const { tokens, loading, error, refresh } = useWalletTokens(
    publicKey ?? null,
    KNOWN
  );

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-stretch gap-6">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        Hello, <span className="text-violet-400">Blockchain</span> 👋
      </h1>
      <p className="text-sm text-neutral-400">
        Devnet · Wallet & Tokens Dashboard
      </p>

      <WalletMultiButtonDynamic />

      {publicKey ? (
        <>
          <p className="font-mono text-sm break-all -mt-2">
            Address: {publicKey.toBase58()}
          </p>

          {error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : (
            <TokensList
              tokens={tokens}
              onRefresh={refresh}
              loading={loading}
              title="Activos"
            />
          )}

          <SendAnyTokenCard tokens={tokens} />
        </>
      ) : (
        <p className="text-sm opacity-70">
          Conecta tu wallet para ver tus tokens y enviar.
        </p>
      )}
    </div>
  );
}
