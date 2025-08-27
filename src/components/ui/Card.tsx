"use client";
import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,.04)] ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}
