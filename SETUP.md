# 🚀 Przewodnik Instalacji Aplikacji Audit

Instrukcja krok po kroku dotycząca uruchomienia aplikacji Audit na nowym komputerze.

---

## 📋 Wymagania Systemowe

- **System operacyjny**: Windows, macOS lub Linux
- **Procesor**: Intel/AMD (64-bit)
- **RAM**: Minimum 4GB (zalecane 8GB+)
- **Przestrzeń dyskowa**: Minimum 1GB wolnej przestrzeni

---

## 📦 Wymagane Oprogramowanie

Przed rozpoczęciem upewnij się, że masz zainstalowane:

### 1. **Node.js** (v18.0.0 lub wyżej)
   - **Pobierz**: https://nodejs.org/ (zalecana wersja LTS)
   - **Sprawdzenie instalacji**:
     ```bash
     node --version
     npm --version
     ```

### 2. **Git** (opcjonalnie, do klonowania repozytorium)
   - **Pobierz**: https://git-scm.com/
   - **Sprawdzenie instalacji**:
     ```bash
     git --version
     ```

### 3. **Git Bash** (na Windows, opcjonalnie)
   - Instalowana razem z Git
   - Pozwala na używanie Linux-like poleceń na Windows

---

## 🔧 Krok po Kroku: Instalacja

### Krok 1: Klonowanie Repozytorium

```bash
# Otwórz terminal/PowerShell w wybranym katalogu
# Na Windows: Shift + Prawy Klik → Otwórz PowerShell tutaj

git clone https://github.com/ArkadiuszSzwarocki/Audit.git
cd Audit
```

### Krok 2: Instalacja Zależności

```bash
# Zainstaluj wszystkie wymagane pakiety
npm install
```

**Oczekiwany czas**: 2-5 minut (zależy od szybkości internetu)

### Krok 3: Konfiguracja Bazy Danych

```bash
# Inicjalizacja bazy danych Prisma
npx prisma migrate dev --name init

# Wygenerowanie klienta Prisma
npx prisma generate
```

**Co to robi:**
- Tworzy bazę danych SQLite (`prisma/dev.db`)
- Uruchamia wszystkie migracje
- Generuje typy TypeScript dla bazy danych

### Krok 4: Populacja Danych (Opcjonalnie)

Jeśli chcesz uruchomić aplikację z przykładowymi danymi:

```bash
# Na Windows
node seed.js

# Na macOS/Linux
node seed.js
```

---

## ▶️ Uruchamianie Aplikacji

### Tryb Deweloperski (Rekomendowany)

```bash
npm run dev
```

**Wynik**:
```
▲ Next.js 16.2.10 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://0.0.0.0:3000
```

Otwórz przeglądarkę i wejdź na: **http://localhost:3000**

### Tryb Produkcyjny

```bash
# Budowanie aplikacji
npm run build

# Uruchomienie aplikacji
npm start
```

---

## 📁 Struktura Projektu

```
Audit/
├── src/
│   ├── app/              # Strony aplikacji (Next.js App Router)
│   ├── components/       # Komponenty React
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Logika biznesowa
│   ├── repositories/    # Dostęp do bazy danych
│   └── utils/           # Funkcje pomocnicze
├── prisma/
│   ├── schema.prisma    # Definicja bazy danych
│   └── migrations/      # Migracje bazy danych
├── public/              # Pliki statyczne (obrazy, ikony)
├── package.json         # Zależności projektu
├── next.config.ts       # Konfiguracja Next.js
└── tsconfig.json        # Konfiguracja TypeScript
```

---

## 🛠️ Dostępne Polecenia

```bash
# Uruchomienie w trybie deweloperskim
npm run dev

# Budowanie aplikacji
npm run build

# Uruchomienie aplikacji produkcyjnej
npm start

# Uruchomienie lintingu kodu
npm run lint

# Zarządzanie bazą danych
npx prisma studio     # Otwiera GUI Prisma Studio
npx prisma generate   # Regeneruje Prisma Client
npx prisma migrate dev --name <nazwa>  # Tworzy nową migrację
```

---

## 🗄️ Praca z Bazą Danych

### Przeglądanie i Edycja Danych

```bash
# Otwiera Prisma Studio (GUI do zarządzania danymi)
npx prisma studio
```

- Dostępny na: http://localhost:5555

### Resetowanie Bazy Danych

```bash
# UWAGA: Spowoduje usunięcie wszystkich danych!
npx prisma migrate reset
```

---

## 🌍 Dostęp Sieciowy

### Połączenie z Innego Komputera w Sieci

Aplikacja jest skonfigurowana do nasłuchiwania na `0.0.0.0`, co oznacza, że można się do niej podłączyć z innych urządzeń:

1. Sprawdź adres IP komputera:
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   ```

2. Połącz się z innego urządzenia:
   ```
   http://<IP_KOMPUTERA>:3000
   ```

---

## 🔍 Rozwiązywanie Problemów

### Problem: "npm command not found"
**Rozwiązanie**: Node.js nie jest zainstalowany lub nie jest w PATH. Zainstaluj Node.js od https://nodejs.org/

### Problem: "prisma: command not found"
**Rozwiązanie**:
```bash
npm install
npx prisma generate
```

### Problem: Port 3000 jest zajęty
**Rozwiązanie**: Zmień port w package.json lub zabij proces:
```bash
# Windows
netstat -ano | findstr :3000

# Lub uruchom na innym porcie (edytuj package.json)
```

### Problem: Błędy przy npm install
**Rozwiązanie**:
```bash
# Wyczyść cache npm
npm cache clean --force

# Usuń node_modules i package-lock.json
rm -r node_modules
rm package-lock.json

# Zainstaluj ponownie
npm install
```

### Problem: Baza danych nie initializer
**Rozwiązanie**:
```bash
# Resetuj migracje
npx prisma migrate reset

# Lub ręcznie usuń dev.db
rm prisma/dev.db
npx prisma migrate dev --name init
```

---

## 📚 Dodatkowe Zasoby

- **Next.js Dokumentacja**: https://nextjs.org/docs
- **Prisma Dokumentacja**: https://www.prisma.io/docs/
- **React Dokumentacja**: https://react.dev/
- **TypeScript Dokumentacja**: https://www.typescriptlang.org/docs/

---

## 👨‍💻 Praca Deweloperska

### Edycja Kodu

Aplikacja używa **Hot Reload** w trybie developerskim, więc zmiany w kodzie będą automatycznie przeładowywane:

1. Otwórz projekt w VS Code:
   ```bash
   code .
   ```

2. Edytuj pliki w folderze `src/`

3. Przeglądarka automatycznie się odświeży

### Dodawanie Nowych Funkcji

1. Zdefiniuj model w `prisma/schema.prisma`
2. Stwórz migrację:
   ```bash
   npx prisma migrate dev --name opisMigracji
   ```
3. Stwórz komponent w `src/components/`
4. Dodaj stronę w `src/app/`

---

## 🚀 Deployment (Wdrażanie)

Aplikacja może być wdrażana na:
- **Vercel** (zalecane dla Next.js): https://vercel.com/
- **Heroku**: https://www.heroku.com/
- **AWS**: https://aws.amazon.com/
- **Azure**: https://azure.microsoft.com/
- **Własny serwer**: VPS z Node.js

---

## 📞 Pomoc i Wsparcie

Jeśli napotkasz problemy:

1. Sprawdź logs w terminalu
2. Przejrzyj sekję "Rozwiązywanie Problemów" powyżej
3. Sprawdź oficjalną dokumentację
4. Skontaktuj się z zespołem development

---

**Data Tworzenia**: 27.07.2026  
**Wersja**: 1.0  
**Autor**: Dokumentacja Techniczna

