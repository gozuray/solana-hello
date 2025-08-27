"use client";
import { useCallback, useEffect, useState } from "react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";

export function lamportsToSol(lamports: number) {
  return lamports / LAMPORTS_PER_SOL;
}

export function useSolBalance(publicKey: PublicKey | null) {
  const { connection } = useConnection();
  const [lamports, setLamports] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const value = await connection.getBalance(publicKey, { commitment: "processed" });
      setLamports(value);
    } catch (e: any) {
      setError(e?.message ?? "Error fetching balance");
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  // 👇 este ya estaba: se ejecuta cuando cambia la wallet
  useEffect(() => {
    if (publicKey) fetchBalance();
    else {
      setLamports(null);
      setError(null);
    }
  }, [publicKey, fetchBalance]);

  // 👇 NUEVO: efecto de polling cada 5 segundos
  useEffect(() => {
    if (!publicKey) return;

    // primer fetch inmediato
    fetchBalance();

    const interval = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        fetchBalance();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [publicKey, fetchBalance]);

  return {
    lamports,
    sol: lamports !== null ? lamportsToSol(lamports) : null,
    loading,
    error,
    refresh: fetchBalance,
  };
}
