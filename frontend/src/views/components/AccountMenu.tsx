import { useId, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../viewmodels/useAuth';

/**
 * Menu da conta no cabeçalho público, só para quem já entrou (Meus dados e Sair).
 * Visitantes não veem botão de entrar aqui: o login acontece na etapa de reserva.
 */
export function AccountMenu() {
  const auth = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  // Enquanto confere a sessão ou para visitantes, o cabeçalho fica só com a navegação
  if (auth.status !== 'authenticated') return null;
  const firstName = auth.account.name.trim().split(/\s+/)[0];
  return (
    <div
      ref={root}
      className="relative shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={`Conta de ${firstName}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((previous) => !previous)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-white hover:bg-white/10"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/20">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="max-w-24 truncate">Olá, {firstName}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={id}
          className="absolute right-0 top-full z-60 mt-2 w-48 overflow-hidden rounded-xl bg-white py-1.5 text-semispe-blue-dark shadow-xl ring-1 ring-semispe-blue-dark/10"
        >
          <Link
            to="/meus-dados"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-semispe-surface"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            Meus dados
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              auth.logout();
              void client.cancelQueries();
              client.clear();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-semispe-surface"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
