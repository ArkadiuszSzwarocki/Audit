# Instrukcja Uruchomienia i Wdrożenia AuditApp w Sieci Firmowej

Dokument zawiera instrukcję uruchomienia aplikacji **AuditApp** na komputerze firmowym oraz udostępnienia jej innym pracownikom w tej samej sieci firmowej (Wi-Fi / LAN).

---

## 🚀 Pierwsze uruchomienie na nowym komputerze (Krok po kroku)

### Krok 1: Wymagania wstępne
1. Na komputerze pełniącym rolę serwera musi być zainstalowany **Node.js** (wersja v18 lub nowsza).
2. Przy pierwszym przeniesieniu folderu projektu należy otworzyć terminal w tym folderze i wykonać:
   ```bash
   npm install
   ```

### Krok 2: Jednorazowa konfiguracja Zapory Windows (Firewall)
1. W folderze projektu kliknij prawym przyciskiem myszy na plik:
   `konfiguruj_zapore.bat`
2. Wybierz: **"Uruchom jako administrator"**.
3. Skrypt automatycznie odblokuje port `3000` dla ruchu z sieci lokalnej.

---

## 💻 Automatyczny Start Serwera z Systemem Windows (Autostart)

Serwer AuditApp został skonfigurowany tak, aby **uruchamiał się automatycznie w tle od razu po włączeniu lub ponownym uruchomieniu komputera**, bez konieczności ręcznego klikania czegokolwiek.

* **Automatyczna instalacja**: W folderze znajduje się skrypt `install_autostart.bat` (został już aktywowany).
* **Jak to działa**: Przy starcie systemu Windows cicho uruchamia się w tle plik `autostart_server.vbs`, który włącza serwer aplikacji na porcie `3000`.
* **Usuwanie autostartu (w razie potrzeby)**: Skrypt `uninstall_autostart.bat`.

---

## 📱 Instalacja Aplikacji PWA (Progressive Web App)

AuditApp jest w pełni funkcjonalną aplikacją **PWA**. Oznacza to, że pracownicy mogą zainstalować ją jako osobną, samodzielną aplikację (z własną ikonką na pulpicie/ekranie głównym) bez paska adresu przeglądarki!

### Na telefonach i tabletach (Android / iOS):
1. Otwórz przeglądarkę (Chrome / Safari) i wejdź na adres serwera (np. `http://AuditApp:3000` lub `http://192.168.0.19:3000`).
2. W menu przeglądarki kliknij **"Dodaj do ekranu głównego"** (lub **"Zainstaluj aplikację"**).
3. Na ekranie głównym telefonu pojawi się oficjalna ikonka **AuditApp**.

### Na komputerach (Windows / Chrome / Edge):
1. Wejdź na `http://localhost:3000` lub `http://AuditApp:3000`.
2. W prawym górnym rogu paska adresu kliknij ikonkę **"Zainstaluj AuditApp"** (ikona monitora z strzałką).
3. Aplikacja otworzy się w osobnym, okienkowym interfejsie bez paska przeglądarki.

---

## 💻 Codzienne uruchamianie serwera w firmie (Ręczne)

1. Kliknij dwukrotnie plik:
   **`start_audit.bat`**

2. Po uruchomieniu w oknie konsoli pojawi się nagłówek z dokładnym adresem IP komputera w sieci firmowej:
   ```text
   =======================================================================
     ADRESY DOSTĘPU DLA PRACOWNIKÓW I URZĄDZEŃ MOBILNYCH:

     - Dostęp lokalny na tym komputerze:  http://localhost:3000
     - Dostęp z telefonów / tabletów LAN: http://192.168.X.X:3000
   =======================================================================
   ```

3. Pracownicy na swoich telefonach, tabletach lub innych komputerach mogą wpisać adres IP (np. `http://192.168.1.50:3000`) lub alias z nazwą komputera (np. `http://auditapp:3000`).

---

## 🏷️ Jak ustawić stały alias `http://AuditApp:3000`?

Zamiast zapamiętywać cyfry adresu IP (np. `192.168.0.19`), pracownicy mogą wpisywać proste słowo **`http://AuditApp:3000`**.

### Metoda 1: Zmiana nazwy komputera w Windowsie (Najprostsza — działa automatycznie dla wszystkich w Wi-Fi)
1. Na komputerze pełniącym rolę serwera otwórz **Ustawienia Windows -> System -> Informacje**.
2. Kliknij **"Zmień nazwę tego komputera"**.
3. Wpisz nową nazwę: **`AuditApp`**.
4. Zrestartuj komputer.
5. Od tej chwili każde urządzenie w tej samej sieci Wi-Fi/LAN (komputery, telefony z Androidem i iOS) może wchodzić przez:
   - `http://AuditApp:3000`
   - lub `http://AuditApp.local:3000` (dla iPhone / iPad / Mac).

### Metoda 2: Wpisy w routerze firmowym (DHCP / Local DNS)
W panelu administratora routera firmowego dodaj stałą rezerwację IP dla komputera-serwera oraz wpis DNS: `AuditApp` -> `192.168.0.19`.

---

## ⚠️ Rozwiązywanie problemów w sieci firmowej

* **Strona na telefonie nie ładuje się (`ERR_ADDRESS_UNREACHABLE`):**
  * Sprawdź, czy telefon jest połączony z tą samą siecią Wi-Fi co komputer-serwer.
  * Upewnij się, że na telefonie wyłączono **dane komórkowe** oraz **aplikacje VPN**.
  * Sprawdź, czy sieć Wi-Fi w Windowsie jest ustawiona jako **Prywatna** (*Ustawienia Windows -> Sieć i internet -> Wi-Fi -> Profil sieciowy: Prywatna*).

* **Telefon otwiera nieznaną stronę domeny (np. parking domen):**
  * Upewnij się, że wpisujesz adres z przedrostkiem `http://` na początku (np. `http://AuditApp:3000` lub `http://192.168.0.19:3000`).
