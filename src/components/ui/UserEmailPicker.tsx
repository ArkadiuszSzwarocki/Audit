'use client';

import React, { useState } from 'react';

export interface UserEmailOption {
  id: string;
  name: string;
  email: string | null;
  role?: string;
  responsibleAreaId?: string | null;
  responsibleArea?: { id: string; name: string } | null;
  notifyBhp?: boolean;
  notifyQuality?: boolean;
  notifyFaults?: boolean;
  notifyKaizen?: boolean;
  notifyAudits?: boolean;
}

interface UserEmailPickerProps {
  value: string;
  onChange: (newValue: string) => void;
  users: UserEmailOption[];
  label?: string;
  placeholder?: string;
  selectedAreaId?: string;
  moduleType?: 'BHP' | 'QUALITY' | 'FAULTS' | 'KAIZEN' | 'AUDITS';
}

export function UserEmailPicker({
  value,
  onChange,
  users: propUsers = [],
  label = '✉️ Powiadomienie E-mail Użytkownika',
  placeholder = 'Wpisz inny adres e-mail (np. kierownik@allspice.pl)...',
  selectedAreaId,
  moduleType,
}: UserEmailPickerProps) {
  const [selectedUserIndex, setSelectedUserIndex] = useState<string>('');
  const [internalUsers, setInternalUsers] = useState<UserEmailOption[]>([]);

  // Fetch users from DB if not provided or empty
  React.useEffect(() => {
    if (!propUsers || propUsers.length === 0) {
      fetch('/api/users')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setInternalUsers(data);
        })
        .catch(console.error);
    }
  }, [propUsers]);

  const activeUsers = propUsers && propUsers.length > 0 ? propUsers : internalUsers;

  // Auto pre-select responsible user for this Area & Module if value is empty
  React.useEffect(() => {
    if (selectedAreaId && moduleType && activeUsers.length > 0 && !value) {
      const responsibleUser = activeUsers.find((u) => {
        if (u.responsibleAreaId !== selectedAreaId) return false;
        if (moduleType === 'BHP') return u.notifyBhp;
        if (moduleType === 'QUALITY') return u.notifyQuality;
        if (moduleType === 'FAULTS') return u.notifyFaults;
        if (moduleType === 'KAIZEN') return u.notifyKaizen;
        if (moduleType === 'AUDITS') return u.notifyAudits;
        return true;
      });

      if (responsibleUser) {
        const cleanName = responsibleUser.name
          ? responsibleUser.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\s+/g, '.')
          : 'uzytkownik';
        const targetEmail = responsibleUser.email?.trim() || `${cleanName}@allspice.pl`;
        onChange(targetEmail);
      }
    }
  }, [selectedAreaId, moduleType, activeUsers, value]);

  // Parse existing emails
  const currentEmailList = value
    ? value
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
    : [];

  const formattedUsers = activeUsers.map((u) => {
    let email = u.email?.trim();
    if (!email || !email.includes('@')) {
      const cleanName = u.name
        ? u.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '.')
        : 'uzytkownik';
      email = `${cleanName}@allspice.pl`;
    }

    const isAreaMatch = Boolean(selectedAreaId && u.responsibleAreaId === selectedAreaId);
    let isModuleMatch = false;
    if (moduleType === 'BHP') isModuleMatch = Boolean(u.notifyBhp);
    if (moduleType === 'QUALITY') isModuleMatch = Boolean(u.notifyQuality);
    if (moduleType === 'FAULTS') isModuleMatch = Boolean(u.notifyFaults);
    if (moduleType === 'KAIZEN') isModuleMatch = Boolean(u.notifyKaizen);
    if (moduleType === 'AUDITS') isModuleMatch = Boolean(u.notifyAudits);

    const isDesignatedResponsible = isAreaMatch && isModuleMatch;

    return {
      ...u,
      displayEmail: email,
      isDesignatedResponsible,
    };
  });

  const handleSelectUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmail = e.target.value;
    if (!selectedEmail) return;

    if (!currentEmailList.includes(selectedEmail)) {
      const updated = [...currentEmailList, selectedEmail].join(', ');
      onChange(updated);
    }
    setSelectedUserIndex('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const updated = currentEmailList.filter((e) => e !== emailToRemove).join(', ');
    onChange(updated);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
        {label}
      </label>

      {/* 1. Select Dropdown connected to DB users */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
          Wybierz użytkownika z listy bazy pracowników:
        </span>
        <select
          value={selectedUserIndex}
          onChange={handleSelectUser}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
        >
          <option value="">
            {formattedUsers.length === 0
              ? '-- Ładowanie listy pracowników... --'
              : '-- Wybierz pracownika z bazy zakładu... --'}
          </option>
          {formattedUsers.map((u) => (
            <option key={u.id} value={u.displayEmail}>
              {u.isDesignatedResponsible ? '⭐ ' : '👤 '}
              {u.name} ({u.displayEmail})
              {u.isDesignatedResponsible ? ` • [ODPOWIEDZIALNY ZA REJON ${moduleType || ''}]` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Custom manual email entry */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
          Lub wpisz własny / inny adres e-mail:
        </span>
        <input
          type="text"
          value={value}
          onChange={handleManualInput}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* 3. Selected Email Chips / Badges */}
      {currentEmailList.length > 0 && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>Wybrani odbiorcy powiadomienia ({currentEmailList.length}):</span>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-red-500 hover:underline cursor-pointer text-[10px]"
            >
              Wyczyść adresy
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentEmailList.map((email) => {
              const matchedUser = activeUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase());
              return (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-100 dark:bg-brand-950/80 text-brand-900 dark:text-brand-200 border border-brand-300 dark:border-brand-800 rounded-xl text-xs font-bold shadow-2xs"
                >
                  <span>✉️ {matchedUser ? `${matchedUser.name} <${email}>` : email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="hover:bg-brand-200 dark:hover:bg-brand-900 rounded-full w-4 h-4 flex items-center justify-center text-xs text-brand-700 dark:text-brand-300 cursor-pointer"
                    title="Usuń ten e-mail"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
