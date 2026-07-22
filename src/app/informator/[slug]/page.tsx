export default async function InformatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const titleMap: Record<string, string> = {
    'gmp': 'Dobra Praktyka Produkcyjna (GMP)',
    'gmp-plus': 'Bezpieczeństwo Pasz (GMP+)',
    'haccp': 'Analiza Zagrożeń i Krytyczne Punkty (HACCP)',
    '5s': 'System 5S',
    'fifo': 'First In, First Out (FIFO)',
    'fefo': 'First Expired, First Out (FEFO)',
  };

  const contentMap: Record<string, { desc: string, points: string[] }> = {
    'gmp': {
      desc: 'Zbiór standardów stosowanych w produkcji przemysłowej (szczególnie farmaceutycznej i spożywczej), mających na celu zapewnienie najwyższej jakości i bezpieczeństwa produktów.',
      points: ['Utrzymanie higieny stanowiska pracy', 'Mycie i dezynfekcja maszyn', 'Zapobieganie zanieczyszczeniom krzyżowym', 'Ścisłe przestrzeganie procedur technologicznych']
    },
    'gmp-plus': {
      desc: 'Rozszerzenie standardu GMP o wymogi dotyczące bezpieczeństwa i jakości w całym łańcuchu produkcji pasz dla zwierząt.',
      points: ['Identyfikowalność i monitorowanie surowców', 'Ocena ryzyka dostawców', 'Bezpieczeństwo transportu pasz', 'Zarządzanie incydentami paszowymi']
    },
    'haccp': {
      desc: 'System zapobiegawczy mający na celu zagwarantowanie bezpieczeństwa żywności poprzez identyfikację i oszacowanie skali zagrożeń.',
      points: ['Identyfikacja zagrożeń (biologicznych, chemicznych, fizycznych)', 'Wyznaczenie Krytycznych Punktów Kontroli (CCP)', 'Ustalenie limitów krytycznych', 'Monitorowanie punktów CCP i działania korygujące']
    },
    '5s': {
      desc: 'Japońska metoda zarządzania środowiskiem pracy, mająca na celu stworzenie dobrze zorganizowanego i bezpiecznego stanowiska.',
      points: ['Seiri (Sortowanie) – usuń wszystko co niepotrzebne', 'Seiton (Systematyka) – każde narzędzie ma swoje miejsce', 'Seiso (Sprzątanie) – utrzymuj czystość i sprawdzaj maszyny', 'Seiketsu (Standaryzacja) – stwórz procedury', 'Shitsuke (Samodyscyplina) – przestrzegaj wypracowanych zasad']
    },
    'fifo': {
      desc: 'First In, First Out (Pierwsze Weszło, Pierwsze Wyszło) – zasada rotacji zapasów.',
      points: ['Towar najstarszy jest wydawany jako pierwszy', 'Zapobiega starzeniu się surowców', 'Ułatwia kontrolę partii produkcyjnych']
    },
    'fefo': {
      desc: 'First Expired, First Out (Pierwsze Wygasa, Pierwsze Wyszło) – zasada kluczowa dla produktów z terminem ważności.',
      points: ['Towar z najkrótszym terminem ważności opuszcza magazyn jako pierwszy', 'Zapobiega przeterminowaniu surowców i stratom', 'Wymaga rygorystycznego systemu znakowania dat']
    }
  };

  const title = titleMap[slug] || 'Dokumentacja';
  const content = contentMap[slug] || { desc: 'Standard nieznany.', points: [] };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="glass-card">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b pb-4 border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          {title}
        </h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="bg-brand-50 dark:bg-brand-900/20 p-6 rounded-xl border border-brand-100 dark:border-brand-800/50 mb-8">
            <p className="text-lg text-brand-900 dark:text-brand-100 font-medium m-0">
              {content.desc}
            </p>
          </div>

          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Główne zasady:</h3>
          <div className="grid gap-3">
            {content.points.map((point, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="bg-brand-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium m-0">{point}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500">
              Chcesz dodać oficjalne instrukcje PDF do tego standardu? Przejdź do zakładki <a href="/dokumentacja" className="text-brand-600 hover:underline">Dokumentacja</a> i wgraj plik wybierając kategorię "{title}".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
