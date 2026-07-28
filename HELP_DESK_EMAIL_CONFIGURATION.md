# 📧 Powiadomienia E-mail Help Desk - Instrukcja Konfiguracji

## Przegląd

System Help Desk ma teraz automatyczne powiadomienia e-mail! Administrator może skonfigurować:
- ✉️ Email Help Desk (odbiorcy powiadomień)
- 📤 Email nadawcy (wysyłający powiadomienia)
- 🔔 Kiedy wysyłać powiadomienia (nowy ticket, zmiana statusu, przypisanie)

## 🚀 Szybki Start

### 1. Zmienne Środowiskowe (.env.local)
Plik `.env.local` już zawiera zmienne SMTP dla WP.pl:

```env
# Konfiguracja SMTP
EMAIL_SERVER_HOST=smtp.wp.pl
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=dacklowicz@wp.pl
EMAIL_SERVER_PASSWORD=Filipinka2025
EMAIL_FROM=dacklowicz@wp.pl

# Email Help Desk
HELPDESK_EMAIL=arkadiusz.szwarocki@wp.pl
```

**Ważne:** `.env.local` nie jest commitowany do repozytorium (w .gitignore), więc hasło jest bezpieczne.

### 2. Dostęp do Ustawień Help Desk

1. Zaloguj się jako **ADMIN**
2. Przejdź do **Help Desk → Ustawienia** (przycisk ⚙️)
3. Lub wejdź bezpośrednio na: `http://localhost:3000/helpdesk/settings`

### 3. Konfiguracja Email Help Desk

#### Email odbiorcy powiadomień
- Edytuj pole "Email Help Desk" 
- Domyślnie: `arkadiusz.szwarocki@wp.pl`
- Tutaj trafiać będą powiadomienia o nowych ticketach

#### Email nadawcy
- Wyświetlany jako informacja (Email nadawcy)
- Pobierany z `EMAIL_FROM` w .env.local
- Aby zmienić: edytuj `.env.local` i restartuj serwer

### 4. Włączenie Powiadomień

Przełącznik **"Włącz powiadomienia e-mail"** aktywuje system:
- ✅ Zaznaczony = powiadomienia włączone
- ❌ Niezaznaczony = powiadomienia wyłączone

Po włączeniu, pojawiają się opcje:

#### Typy Powiadomień

1. **✨ Nowy ticket** (domyślnie włączony)
   - Wysyłane gdy użytkownik zgłosi nowy problem
   - Help Desk jest natychmiast powiadamiany

2. **🔄 Zmiana statusu** (domyślnie wyłączony)
   - Wysyłane gdy status ticketu się zmieni
   - np. OPEN → IN_PROGRESS → CLOSED

3. **👤 Przypisanie** (domyślnie wyłączony)
   - Wysyłane gdy ticket zostaje przypisany
   - Help Desk wie, kto go obsługuje

### 5. Test Połączenia SMTP

Przycisk **"Wyślij email testowy"** sprawdza:
- ✅ Połączenie SMTP
- ✅ Dane logowania
- ✅ Port SMTP
- ✅ Czy email jest dostępny

**Jeśli test się nie powiedzie:**
1. Sprawdź dane SMTP w .env.local
2. Sprawdź czy serwer SMTP jest dostępny
3. Sprawdź hasło (może wymagane jest hasło aplikacyjne)
4. Sprawdź logi serwera: `npm run dev` → sprawdź konsolę

## 📧 Zawartość Emaili

### Email o nowym tickecie
```
Temat: 🆕 Nowy ticket: [Tytuł zgłoszenia]

Zawartość:
- Tytuł ticketu
- Zgłaszający (imię i nazwisko)
- Opis problemu
- Link do otwarcia ticketu w systemie
```

### Email o zmianie statusu
```
Temat: 🔄 Zmiana statusu: [Tytuł zgłoszenia]

Zawartość:
- Tytuł ticketu
- Stary status
- Nowy status
- Link do ticketu
```

### Email o przypisaniu
```
Temat: 👤 Przypisanie ticketu: [Tytuł zgłoszenia]

Zawartość:
- Tytuł ticketu
- Przypisane przez: [Imię admina]
- Link do ticketu
```

## 🔧 Rozwiązywanie Problemów

### Emaile się nie wysyłają

**Problem 1: "Powiadomienia wyłączone"**
- Rozwiązanie: Włącz przełącznik "Włącz powiadomienia e-mail"

**Problem 2: "Błędne dane SMTP"**
- Sprawdź `.env.local`: EMAIL_SERVER_HOST, PORT, USER, PASSWORD
- Restartuj serwer po zmianach: Ctrl+C → `npm run dev`
- Test połączenia: Użyj przycisku "Wyślij email testowy"

**Problem 3: "Email testowy się nie wysyła"**
- Komunikat powinien zawierać błąd SMTP
- Sprawdź logi konsoli (npm run dev)
- Możliwe przyczyny:
  - Hasło aplikacyjne zamiast zwykłego hasła
  - Blokada zapory
  - Serwer SMTP niedostępny

**Problem 4: "Email trafia do SPAM"**
- To normalne dla testów
- Dodaj nadawcę do zaufanych nadawców
- Sprawdź w sekcji "Junk" lub "Spam" w Outlook/Gmail

### Zmiana Danych SMTP

Aby zmienić konfigurację SMTP:

1. **Edytuj `.env.local`:**
   ```env
   EMAIL_SERVER_HOST=nowy-serwer.pl
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=nowy-email@example.com
   EMAIL_SERVER_PASSWORD=nowe-haslo
   EMAIL_FROM=nowy-email@example.com
   ```

2. **Restartuj serwer:**
   ```bash
   Ctrl+C (aby zatrzymać)
   npm run dev (aby uruchomić ponownie)
   ```

3. **Test ponownie:** Użyj przycisku "Wyślij email testowy"

## 📊 Monitorowanie

### Logi Emaili

Logi wysyłania emaili pojawiają się w konsoli serwera:
```
[Serwer] Email sent successfully to: arkadiusz.szwarocki@wp.pl
[Serwer] Sending Help Desk notification for new ticket ...
[Serwer] Error sending Help Desk notification: ...
```

### Historia Ticketów

Każdy ticket ma historię zmian:
- ✅ Możesz zobaczyć kiedy zmienia się status
- 📝 Historia zawiera najdrobniejsze zmiany
- 👤 Widać kto dokonał zmiany i o której godzinie

## 🔐 Bezpieczeństwo

### Hasło SMTP

- Hasło jest przechowywane w `.env.local` (nigdy nie commituj!)
- `.env.local` jest w `.gitignore`
- Każdy deweloper ma swoją kopię `.env.local`
- Nie pokazuj hasła w komunikatach błędów

### Email Help Desk

- Może być dowolny email
- Najlepiej dedykowany email dla Help Desk (np. helpdesk@firma.pl)
- Nie musi mieć dostępu do wysyłania

## 🎯 Najlepsze Praktyki

1. **Testuj przed wdrożeniem**
   - Włącz powiadomienia w dev/test
   - Wyślij email testowy
   - Utwórz nowy ticket i sprawdź czy email przychodzi

2. **Skonfiguruj tylko potrzebne typy powiadomień**
   - Zbyt wiele emaili = spam
   - Zaznacz tylko: "Nowy ticket" na start
   - Rozważ dodanie "Zmiana statusu" później

3. **Monitoruj logi**
   - Czasami emaile się nie wysyłają bez widocznego powodu
   - Sprawdź konsolę serwera (npm run dev)
   - Może być problem z SMTP, PORT, czy hasłem

4. **Regularnie testuj**
   - Co miesiąc wyślij email testowy
   - Sprawdź czy nadal działa
   - SMTP mogą się zmienić na serwerze

## 📞 Support

Jeśli emaile dalej się nie wysyłają:

1. Zbierz informacje:
   - Treść błędu z przycisku "Wyślij email testowy"
   - Logi konsoli (npm run dev)
   - Dane z .env.local (bez hasła!)

2. Sprawdź:
   - Czy host SMTP jest dostępny (ping smtp.wp.pl)
   - Czy port SMTP jest otwarty (nc -zv smtp.wp.pl 587)
   - Czy hasło jest poprawne
   - Czy email nadawcy istnieje na serwerze

3. Kontakt:
   - Deweloper Help Desk
   - Administrator systemu
   - Support serwera SMTP (np. WP.pl support)

## 🎓 Dla Deweloperów

### API Endpoints

```
GET  /api/helpdesk/config       - Pobrania konfiguracji
PUT  /api/helpdesk/config       - Aktualizacja konfiguracji
POST /api/helpdesk/test-email   - Wysłanie testu
```

### Funkcje Wysyłania Email

W `src/lib/mailer.ts`:
- `sendMail()` - wysłanie generycznego emaila
- `sendHelpDeskNotification()` - wysłanie powiadomienia Help Desk

### Integracja

Emaile są wysyłane automatycznie w:
- `POST /api/helpdesk/tickets` - nowy ticket (jeśli notifyOnNewTicket)
- `PATCH /api/helpdesk/tickets/[id]` - zmiana statusu/przypisania

## ✅ Checklist Wdrożenia

- [ ] Sprawdzić dane SMTP w .env.local
- [ ] Włączyć powiadomienia w /helpdesk/settings
- [ ] Wysłać email testowy
- [ ] Sprawdzić czy email przyszedł
- [ ] Utworzyć nowy ticket i sprawdzić powiadomienie
- [ ] Zmienić status i sprawdzić powiadomienie
- [ ] Udokumentować proces w zespołem

---

**Data:** 2026-07-28  
**Wersja:** 1.0  
**Status:** ✅ Production Ready
