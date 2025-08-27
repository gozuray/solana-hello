"use client";

import { useMemo, useState } from "react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

type TxStatus = "idle" | "validating" | "signing" | "sending" | "confirmed" | "error";

export default function SendSolCard() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("0.01"); // SOL
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const disabled = useMemo(
    () => !publicKey || status === "validating" || status === "signing" || status === "sending",
    [publicKey, status]
  );

  const explorerUrl = signature
    ? `https://solscan.io/tx/${signature}?cluster=devnet`
    : null;

  const validate = () => {
    try {
      if (!publicKey) throw new Error("Conecta tu wallet primero.");
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Monto inválido.");
      // validate address shape
      // (si falla, PublicKey lanzará su propio error más abajo)
      // eslint-disable-next-line no-new
      new PublicKey(to);
      return { amtLamports: Math.round(amt * LAMPORTS_PER_SOL) };
    } catch (e: any) {
      throw new Error(e?.message ?? "Validación fallida.");
    }
  };

  const onSend = async () => {
    setError(null);
    setSignature(null);

    try {
      setStatus("validating");
      const { amtLamports } = validate();

      const toPk = new PublicKey(to);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey!, // validated arriba
          toPubkey: toPk,
          lamports: amtLamports,
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
      // mensajes más amables
      const msg = String(e?.message ?? e);
      const friendly =
        msg.includes("User rejected") || msg.toLowerCase().includes("reject")
          ? "Firma rechazada en la wallet."
          : msg.includes("insufficient")
          ? "Fondos insuficientes para esta transferencia."
          : msg.includes("invalid public key") || msg.includes("base58")
          ? "La dirección de destino no es válida."
          : msg;
      setError(friendly);
      setStatus("error");
    }
  };

  return (
    <div className="border rounded-2xl p-4 max-w-md w-full shadow-sm">
      <h2 className="text-lg font-semibold mb-1">Enviar SOL (Devnet)</h2>
      <p className="text-xs opacity-70 mb-4">Estados: Validando → Solicitando firma → Enviando → Confirmada</p>

      <label className="block text-sm mb-1" htmlFor="dest">
        Destino (public key)
      </label>
      <input
        id="dest"
        className="w-full border rounded px-3 py-2 mb-3"
        placeholder="Ej: Fp6… (Devnet)"
        value={to}
        onChange={(e) => setTo(e.target.value.trim())}
        disabled={disabled}
      />

      <label className="block text-sm mb-1" htmlFor="amt">
        Monto (SOL)
      </label>
      <div className="flex gap-2 mb-3">
        <input
          id="amt"
          className="w-full border rounded px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={disabled}
          inputMode="decimal"
        />
        <button
          type="button"
          className="border rounded px-3 py-2 text-sm"
          onClick={() => setAmount("0.01")}
          disabled={disabled}
          aria-label="Rellenar 0.01 SOL"
        >
          0.01
        </button>
      </div>

      <button
        onClick={onSend}
        disabled={disabled}
        className="border rounded px-4 py-2 w-full"
        aria-live="polite"
      >
        {status === "validating"
          ? "Validando…"
          : status === "signing"
          ? "Solicitando firma…"
          : status === "sending"
          ? "Enviando…"
          : "Enviar"}
      </button>

      {/* estado y feedback */}
      <div className="mt-3 text-sm min-h-6">
        {status === "confirmed" && explorerUrl && (
          <p className="text-green-600">
            ✅ Confirmada.{" "}
            <a
              className="underline"
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              Transaction Details
            </a>
          </p>
        )}
        {status === "error" && <p className="text-red-600">Error: {error}</p>}
        {status === "signing" && <p className="opacity-70">Revisa Phantom para firmar.</p>}
        {status === "sending" && <p className="opacity-70">Transmitiendo a la red…</p>}
      </div>
    </div>
  );
}
