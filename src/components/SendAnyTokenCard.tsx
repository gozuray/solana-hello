"use client";

import { useMemo, useState } from "react";
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from "@solana/spl-token";
import { WalletToken } from "../hooks/useWalletTokens";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";


type TxStatus = "idle" | "validating" | "preparing" | "signing" | "sending" | "confirmed" | "error";

export default function SendAnyTokenCard({
  tokens,
}: {
  tokens: WalletToken[];
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("0.01");

  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const selected = tokens[selectedIndex];
  const disabled =
    !publicKey ||
    !selected ||
    status === "validating" ||
    status === "preparing" ||
    status === "signing" ||
    status === "sending";

  const explorerUrl = signature ? `https://solscan.io/tx/${signature}?cluster=devnet` : null;

  const parseToRaw = (value: string, decimals: number) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) throw new Error("Monto inválido.");
    const raw = Math.round(n * Math.pow(10, decimals));
    return BigInt(raw);
  };

  const onSend = async () => {
    setError(null);
    setSignature(null);

    try {
      if (!publicKey) throw new Error("Conecta tu wallet primero.");
      if (!selected) throw new Error("Selecciona un token.");
      const dest = new PublicKey(to.trim());

      setStatus("validating");

      if (selected.kind === "SOL") {
        // Transferencia de SOL
        const lamports = parseToRaw(amount, 9); // 9 decimales
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: dest,
            lamports: Number(lamports),
          })
        );
        setStatus("signing");
        const sig = await sendTransaction(tx, connection, { skipPreflight: false });
        setSignature(sig);
        setStatus("sending");
        const latest = await connection.getLatestBlockhash();
        await connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");
        setStatus("confirmed");
        return;
      }

      // SPL token
      if (!selected.mint) throw new Error("Mint inválido.");
      const mint = selected.mint;

      setStatus("preparing");

      const fromAta = await getAssociatedTokenAddress(mint, publicKey);
      const toAta = await getAssociatedTokenAddress(mint, dest);

      const tx = new Transaction();

      // Asegura ATA del destinatario
      try {
        await getAccount(connection, toAta);
      } catch {
        tx.add(createAssociatedTokenAccountInstruction(publicKey, toAta, dest, mint));
      }

      // Cantidad en unidades mínimas
      const qtyRaw = parseToRaw(amount, selected.decimals);

      tx.add(createTransferInstruction(fromAta, toAta, publicKey, qtyRaw));

      setStatus("signing");
      const sig = await sendTransaction(tx, connection, { skipPreflight: false });
      setSignature(sig);

      setStatus("sending");
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");

      setStatus("confirmed");
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      const friendly =
        msg.toLowerCase().includes("invalid public key") || msg.toLowerCase().includes("base58")
          ? "La dirección de destino no es válida."
          : msg.toLowerCase().includes("insufficient")
          ? "Fondos insuficientes."
          : msg.toLowerCase().includes("reject")
          ? "Firma rechazada en la wallet."
          : msg;
      setError(friendly);
      setStatus("error");
    }
  };

  // Opcional: proteger si no hay tokens cargados aún
  const options = useMemo(
    () =>
      tokens.map((t, idx) => ({
        idx,
        label: t.kind === "SOL" ? "SOL" : `${t.symbol}`,
      })),
    [tokens]
  );

  return (
    <div className="border rounded-2xl p-4 max-w-xl w-full shadow-sm">
      <h2 className="text-lg font-semibold mb-1">Enviar tokens</h2>
      <p className="text-xs opacity-70 mb-4">Elige el activo (SOL o SPL), destino y monto.</p>

      {/* Selector de token */}
      <label className="block text-sm mb-1">Activo</label>

<Select.Root
  value={String(selectedIndex)}
  onValueChange={(v) => setSelectedIndex(Number(v))}
  disabled={disabled || tokens.length === 0}
>
  <Select.Trigger
    className="w-full rounded-xl px-3 py-2 mb-3 bg-white/5 border border-white/10 text-neutral-100
               flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-violet-600"
  >
    <Select.Value placeholder="Elige token" />
    <Select.Icon className="ml-2 opacity-70">
      <ChevronDown size={16} />
    </Select.Icon>
  </Select.Trigger>

  <Select.Portal>
  <Select.Content
    position="popper"
    side="bottom"
    align="start"
    sideOffset={6}
    avoidCollisions={false}
    // 👇 clave: igualar ancho al trigger
    className="z-50 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md
               text-neutral-100 shadow-xl min-w-[var(--radix-select-trigger-width)]"
  >
    <Select.Viewport className="p-1 max-h-64 overflow-auto w-full">
      {options.map((o) => (
        <Select.Item
          key={o.idx}
          value={String(o.idx)}
          className="px-3 py-2 rounded-lg cursor-pointer outline-none
                     hover:bg-white/10 data-[state=checked]:bg-white/10
                     flex items-center justify-between"
        >
          <Select.ItemText>{o.label}</Select.ItemText>
          <Select.ItemIndicator>✓</Select.ItemIndicator>
        </Select.Item>
      ))}
    </Select.Viewport>
  </Select.Content>
</Select.Portal>

</Select.Root>


      {/* Destino */}
      <label className="block text-sm mb-1" htmlFor="dest">
        Destino (public key)
      </label>
      <input
        id="dest"
        className="w-full border rounded px-3 py-2 mb-3"
        placeholder="Ej: Fp6… (Devnet)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        disabled={disabled}
      />

      {/* Monto */}
      <label className="block text-sm mb-1" htmlFor="amt">
        Monto ({selected ? selected.symbol : ""})
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
        >
          0.01
        </button>
      </div>

      <button
        onClick={onSend}
        disabled={disabled || !selected}
        className="border rounded px-4 py-2 w-full"
      >
        {status === "validating"
          ? "Validando…"
          : status === "preparing"
          ? "Preparando…"
          : status === "signing"
          ? "Solicitando firma…"
          : status === "sending"
          ? "Enviando…"
          : "Enviar"}
      </button>

      <div className="mt-3 text-sm min-h-6">
        {status === "confirmed" && explorerUrl && (
          <p className="text-green-600">
            ✅ Confirmada.{" "}
            <a className="underline" href={explorerUrl} target="_blank" rel="noreferrer">
              Transaction Details
            </a>
          </p>
        )}
        {status === "error" && <p className="text-red-600">Error: {error}</p>}
      </div>
    </div>
  );
}
