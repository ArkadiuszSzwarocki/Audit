'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

interface HelpDeskConfig {
  id: string;
  helpDeskEmail: string;
  replyToEmail: string;
  notifyOnNewTicket: boolean;
  notifyOnStatusChange: boolean;
  notifyOnAssignment: boolean;
  isEmailEnabled: boolean;
  updatedAt: string;
}

export default function HelpDeskSettings() {
  const { showToast } = useToast();
  const [config, setConfig] = useState<HelpDeskConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/helpdesk/config');
      if (!response.ok) throw new Error('Failed to fetch config');
      const data = await response.json();
      // Ensure replyToEmail has a default value if undefined
      const configData: HelpDeskConfig = {
        ...data,
        replyToEmail: data.replyToEmail || ''
      };
      setConfig(configData);
    } catch (error) {
      showToast('Nie udało się załadować konfiguracji', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const response = await fetch('/api/helpdesk/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to save config');
      const updated = await response.json();
      setConfig(updated);
      showToast('Konfiguracja zapisana', 'success');
    } catch (error) {
      showToast('Nie udało się zapisać konfiguracji', 'error');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!config || !config.isEmailEnabled) {
      showToast('Najpierw włącz powiadomienia e-mail', 'info');
      return;
    }

    try {
      setTestEmailLoading(true);
      const response = await fetch('/api/helpdesk/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: config.helpDeskEmail })
      });

      if (!response.ok) throw new Error('Failed to send test email');
      showToast(`Email testowy wysłany na ${config.helpDeskEmail}`, 'success');
    } catch (error) {
      showToast('Nie udało się wysłać maila testowego', 'error');
      console.error('Error:', error);
    } finally {
      setTestEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Ładowanie konfiguracji...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Nie udało się załadować konfiguracji</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">⚙️ Ustawienia Help Desk</h1>
          <p className="text-gray-600">Konfiguracja powiadomień e-mail i adresów odbiorców</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Email Configuration Section */}
          <div className="border-b pb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📧 Konfiguracja E-mail</h2>
            
            <div className="space-y-4">
              {/* Help Desk Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Help Desk (Odbiorca powiadomień)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={config.helpDeskEmail}
                    onChange={(e) => setConfig({ ...config, helpDeskEmail: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="arkadiusz.szwarocki@wp.pl"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(config.helpDeskEmail);
                      showToast('Email skopiowany', 'success');
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                    title="Kopiuj email"
                  >
                    📋
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Na ten adres będą wysyłane powiadomienia. Powiadomienia wysyłane zawsze z: dacklowicz@wp.pl</p>
              </div>

              {/* Reply-To Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Reply-To (Gdzie będą odpowiadać)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={config.replyToEmail}
                    onChange={(e) => setConfig({ ...config, replyToEmail: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="support@example.com"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(config.replyToEmail);
                      showToast('Email skopiowany', 'success');
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                    title="Kopiuj email"
                  >
                    📋
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Na ten email będą wysyłane odpowiedzi z systemów odbiorczych</p>
              </div>

              {/* Test Email Button */}
              <div className="pt-4">
                <button
                  onClick={handleTestEmail}
                  disabled={testEmailLoading || !config.isEmailEnabled}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
                >
                  {testEmailLoading ? '📤 Wysyłanie...' : '🧪 Wyślij email testowy'}
                </button>
                <p className="text-sm text-gray-600 mt-2">Wyślij testowy email aby sprawdzić połączenie SMTP</p>
              </div>
            </div>
          </div>

          {/* Notification Triggers Section */}
          <div className="border-b pb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔔 Kiedy wysyłać powiadomienia?</h2>
            
            <div className="space-y-3">
              {/* Master Toggle */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.isEmailEnabled}
                    onChange={(e) => setConfig({ ...config, isEmailEnabled: e.target.checked })}
                    className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">🚀 Włącz powiadomienia e-mail</div>
                    <div className="text-sm text-gray-600">
                      {config.isEmailEnabled ? '✅ Powiadomienia włączone' : '❌ Powiadomienia wyłączone'}
                    </div>
                  </div>
                </label>
              </div>

              {/* Individual Notification Triggers */}
              {config.isEmailEnabled && (
                <div className="space-y-3 mt-4 pl-4 border-l-4 border-blue-300">
                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={config.notifyOnNewTicket}
                      onChange={(e) => setConfig({ ...config, notifyOnNewTicket: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">✨ Nowy ticket</div>
                      <div className="text-sm text-gray-600">Powiadom gdy użytkownik zgłosi nowy problem</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={config.notifyOnStatusChange}
                      onChange={(e) => setConfig({ ...config, notifyOnStatusChange: e.target.checked })}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">🔄 Zmiana statusu</div>
                      <div className="text-sm text-gray-600">Powiadom gdy zmieni się status ticketu</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={config.notifyOnAssignment}
                      onChange={(e) => setConfig({ ...config, notifyOnAssignment: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">👤 Przypisanie</div>
                      <div className="text-sm text-gray-600">Powiadom gdy ticket zostanie przypisany</div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">ℹ️ Informacje systemowe</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • Status: {config.isEmailEnabled ? (
                  <span className="text-green-600 font-semibold">✅ Powiadomienia aktywne</span>
                ) : (
                  <span className="text-red-600 font-semibold">❌ Powiadomienia nieaktywne</span>
                )}
              </li>
              <li>• Ostatnia aktualizacja: {new Date(config.updatedAt).toLocaleString('pl-PL')}</li>
              <li>• Aktywnych powiadomień: {[config.notifyOnNewTicket, config.notifyOnStatusChange, config.notifyOnAssignment].filter(Boolean).length}/3</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
            >
              {saving ? '💾 Zapisywanie...' : '💾 Zapisz ustawienia'}
            </button>
            <button
              onClick={fetchConfig}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
            >
              🔄 Odśwież
            </button>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Jak to działa?</h3>
          <ol className="text-blue-800 space-y-2 list-decimal list-inside">
            <li>Help Desk Email - adres odbiorcy powiadomień (arkadiusz.szwarocki@wp.pl)</li>
            <li>Email nadawcy - skonfigurowany w zmiennych środowiskowych (dacklowicz@wp.pl)</li>
            <li>Włącz powiadomienia e-mail aby aktywować automatyczne wysyłanie maili</li>
            <li>Zaznacz kiedy system ma wysyłać powiadomienia (nowy ticket, zmiana statusu, przypisanie)</li>
            <li>Użyj przycisku "Wyślij email testowy" aby sprawdzić połączenie</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
