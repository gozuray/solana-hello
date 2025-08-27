"use client";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSolBalance } from "../hooks/useSolBalance";
import SendSolCard from "../components/SendSolCard"; // 👈 nuevo

export default function Home() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { sol, loading, error, refresh } = useSolBalance(publicKey);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Hola Blockchain 👋</h1>
      <p>Conectado a: {connection.rpcEndpoint}</p>

      <WalletMultiButton />

      {publicKey ? (
        <div className="mt-2 text-center">
          <p className="font-mono text-sm break-all">
            Address: {publicKey.toBase58()}
          </p>

          <div className="mt-3">
            {loading ? (
              <p className="opacity-70">Consultando balance…</p>
            ) : error ? (
              <p className="text-red-600">Error: {error}</p>
            ) : sol !== null ? (
              <p className="text-lg">Balance: {sol.toFixed(4)} SOL</p>
            ) : (
              <p className="opacity-70">Sin datos de balance</p>
            )}
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="mt-2 rounded px-4 py-2 border"
          >
            {loading ? "Actualizando…" : "Refrescar balance"}
          </button>
        </div>
      ) : (
        <p className="text-sm opacity-70">
          Conecta tu wallet para ver la address y el balance
        </p>
      )}

      {/* 👇 tarjeta para enviar SOL en devnet */}
      <SendSolCard />
    </main>
  );
}
