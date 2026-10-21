import React, { useRef } from 'react';

export function OtpInput({ value, onChange, disabled = false, autoFocus = false }: { value: string; onChange: (value: string) => void; disabled?: boolean; autoFocus?: boolean }) {
  const fields = useRef<Array<HTMLInputElement | null>>([]);
  const enter = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const start = digits.length === 6 ? 0 : Math.min(index, value.length);
    const next = (value.slice(0, start) + digits + value.slice(start + digits.length)).slice(0, 6);
    onChange(next);
    fields.current[Math.min(start + digits.length, 5)]?.focus();
  };
  return <div role="group" aria-label="Code de vérification à six chiffres" className="flex justify-center gap-2">
    {Array.from({ length: 6 }, (_, index) => <input key={index} ref={element => { fields.current[index] = element; }} aria-label={`Chiffre ${index + 1} sur 6`} type="text" inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} autoFocus={autoFocus && index === 0} disabled={disabled} value={value[index] || ''} onFocus={event => event.currentTarget.select()} onChange={event => { if (!event.target.value) onChange(value.slice(0, index) + value.slice(index + 1)); else enter(index, event.target.value); }} onPaste={event => { event.preventDefault(); enter(index, event.clipboardData.getData('text')); }} onKeyDown={event => {
      if (event.key === 'Backspace' && !value[index] && index > 0) { event.preventDefault(); onChange(value.slice(0, index - 1)); fields.current[index - 1]?.focus(); }
      if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); fields.current[index - 1]?.focus(); }
      if (event.key === 'ArrowRight' && index < 5) { event.preventDefault(); fields.current[index + 1]?.focus(); }
    }} className="min-w-0 w-11 h-12 rounded-xl border border-slate-300 bg-slate-50 text-center text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-white disabled:opacity-50" />)}
  </div>;
}
