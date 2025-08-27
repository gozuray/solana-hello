"use client";

import { useState } from "react";
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export default function SendSolCard() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("0.01"); // SOL
  const [status, setStatus] = useState<"idle"|"signing"|"sending"|"confirmed"|"error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const onSend = async () => {
    setError(null);
    setSignature(null);

    try {
      if (!publicKey) throw new Error("Conecta tu wallet primero");
      const toPk = new PublicKey(to);
      const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
      if (!Number.isFinite(lamports) || lamports <= 0) throw new Error("Monto inválido");

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: toPk,
          lamports,
        })
      );

      setStatus("signing");
      const sig = await sendTransaction(tx, connection, { skipPreflight: false });
      setSignature(sig);

      setStatus("sending");
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");

      setStatus("confirmed");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? "Transacción fallida");
    }
  };

  const explorerUrl = signature
    ? `https://solscan.io/tx/${signature}?cluster=devnet`
    : null;

  return (
    <div className="border rounded p-4 max-w-md w-full">
      <h2 className="text-lg font-semibold mb-2">Enviar SOL (Devnet)</h2>

      <label className="block text-sm mb-1">Destino (public key)</label>
      <input
        className="w-full border rounded px-3 py-2 mb-3"
        placeholder="Ej: Fp6... (devnet)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />

      <label className="block text-sm mb-1">Monto (SOL)</label>
      <input
        className="w-full border rounded px-3 py-2 mb-3"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={onSend}
        disabled={!publicKey || status === "signing" || status === "sending"}
        className="border rounded px-4 py-2"
      >
        {status === "signing" ? "Solicitando firma…" :
         status === "sending" ? "Enviando…" :
         "Enviar"}
      </button>

      <div className="mt-3 text-sm">
        {status === "confirmed" && signature && (
          <p className="text-green-600">
            ✅ Confirmada. Firma: <a className="underline" href={explorerUrl!} target="_blank" rel="noreferrer">{signature.slice(0,16)}…</a>
          </p>
        )}
        {status === "error" && <p className="text-red-600">Error: {error}</p>}
      </div>
    </div>
  );
}
