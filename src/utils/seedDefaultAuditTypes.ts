import { prisma } from '@/config/db';

export const QUESTIONS_5S = [
  // 1S - Seiri (Sortowanie)
  {
    chapter: '1. 1S — Seiri (Sortowanie / Selekcja)',
    code: '5S-1.1',
    questionText: 'Czy na stanowisku pracy i przy maszynie znajdują się wyłącznie przedmioty, narzędzia i materiały niezbędne do bieżącej produkcji?',
    guidance: 'Brak zbędnych detali, starych dokumentów, nieużywanych przyrządów i rzeczy osobistych.',
    isKnockOut: false,
    sortOrder: 10,
  },
  {
    chapter: '1. 1S — Seiri (Sortowanie / Selekcja)',
    code: '5S-1.2',
    questionText: 'Czy usunięto ze stanowiska niepotrzebne pojemniki, zniszczone osłony, uszkodzone detale oraz uszkodzone narzędzia?',
    guidance: 'Wszystkie uszkodzone lub nieużywane elementy powinny być odseparowane do strefy Czerwonej Kartki.',
    isKnockOut: false,
    sortOrder: 20,
  },

  // 2S - Seiton (Systematyka)
  {
    chapter: '2. 2S — Seiton (Systematyka / Uporządkowanie)',
    code: '5S-2.1',
    questionText: 'Czy wszystkie narzędzia, oprzyrządowanie i wyposażenie mają wyznaczone, opisane i oznakowane miejsca przechowywania (np. tablice cieni)?',
    guidance: 'Każdy przedmiot posiada jednoznaczne miejsce: "Miejsce na wszystko i wszystko na swoim miejscu".',
    isKnockOut: false,
    sortOrder: 30,
  },
  {
    chapter: '2. 2S — Seiton (Systematyka / Uporządkowanie)',
    code: '5S-2.2',
    questionText: 'Czy pojemniki produkcyjne, wózki oraz ciągi komunikacyjne są odpowiednio wyznaczone czytelnymi liniami i tabliczkami?',
    guidance: 'Brak zastawiania dróg ewakuacyjnych i ciągów pieszych.',
    isKnockOut: false,
    sortOrder: 40,
  },

  // 3S - Seiso (Sprzątanie)
  {
    chapter: '3. 3S — Seiso (Sprzątanie / Czyszczenie)',
    code: '5S-3.1',
    questionText: 'Czy stanowisko pracy, korpus maszyny, podłoga oraz osłony są wolne od wycieków oleju, pyłu i zanieczyszczeń?',
    guidance: 'Czyszczenie połączone z inspekcją stanu technicznego maszyny.',
    isKnockOut: false,
    sortOrder: 50,
  },
  {
    chapter: '3. 3S — Seiso (Sprzątanie / Czyszczenie)',
    code: '5S-3.2',
    questionText: 'Czy sprzęt do sprzątania (szczotki, mopy, czyściwo) jest czysty, sprawny i odłożony na wyznaczone miejsce?',
    guidance: 'Sprzęt czyszczący nie leży na posadzce i jest pogrupowany wg stref.',
    isKnockOut: false,
    sortOrder: 60,
  },

  // 4S - Seiketsu (Standaryzacja)
  {
    chapter: '4. 4S — Seiketsu (Standaryzacja)',
    code: '5S-4.1',
    questionText: 'Czy na stanowisku znajduje się i jest przestrzegana aktualna instrukcja 5S oraz standard przezbrajania/czyszczenia?',
    guidance: 'Wizualne standardy są łatwo dostępne i zrozumiałe dla każdego operatora.',
    isKnockOut: false,
    sortOrder: 70,
  },
  {
    chapter: '4. 4S — Seiketsu (Standaryzacja)',
    code: '5S-4.2',
    questionText: 'Czy tablica informacyjna obszaru zawiera aktualne wskaźniki 5S, wyniki audytów i harmonogram działań?',
    guidance: 'Wizualne zarządzanie obszarem (Visual Management).',
    isKnockOut: false,
    sortOrder: 80,
  },

  // 5S - Shitsuke (Samodyscyplina)
  {
    chapter: '5. 5S — Shitsuke (Samodyscyplina / Doskonalenie)',
    code: '5S-5.1',
    questionText: 'Czy operatorzy regularnie wykonują autokontrole 5S na początku i przy zakończeniu zmiany?',
    guidance: 'Nawyk przestrzegania wypracowanych standardów.',
    isKnockOut: false,
    sortOrder: 90,
  },
  {
    chapter: '5. 5S — Shitsuke (Samodyscyplina / Doskonalenie)',
    code: '5S-5.2',
    questionText: 'Czy zgłoszone usterki 5S oraz propozycje udoskonaleń (Kaizen) są na bieżąco realizowane i śledzone?',
    guidance: 'Ciągłe doskonalenie środowiska pracy.',
    isKnockOut: false,
    sortOrder: 100,
  },
];

export const QUESTIONS_HACCP = [
  // 1. Zespół i Analiza Zagrożeń
  {
    chapter: '1. System HACCP i Analiza Zagrożeń',
    code: 'HACCP-1.1',
    questionText: 'Czy plan HACCP oraz schematy blokowe procesów produkcyjnych są aktualne i zweryfikowane na hali produkcyjnej?',
    guidance: 'Schematy muszą odzwierciedlać rzeczywisty przepływ surowców i wyrobów.',
    isKnockOut: false,
    sortOrder: 10,
  },
  {
    chapter: '1. System HACCP i Analiza Zagrożeń',
    code: 'HACCP-1.2',
    questionText: 'Czy wyznaczono imienny, przeszkolony zespół HACCP oraz zweryfikowano analizę zagrożeń dla wszystkich surowców?',
    guidance: 'Imienna lista zespołu wraz z zakresem odpowiedzialności i certyfikatami szkoleń.',
    isKnockOut: false,
    sortOrder: 20,
  },

  // 2. Krytyczne Punkty Kontroli (CCP)
  {
    chapter: '2. Krytyczne Punkty Kontroli (CCP)',
    code: 'HACCP-2.1',
    questionText: 'Czy dla każdego punktu CCP (np. detektor metalu, pasteryzator) ustalono limity krytyczne oraz procedury ciągłego monitorowania?',
    guidance: 'Wymóg KO HACCP #1. Limity krytyczne muszą być podparte badaniami naukowymi lub normami.',
    isKnockOut: true,
    sortOrder: 30,
  },
  {
    chapter: '2. Krytyczne Punkty Kontroli (CCP)',
    code: 'HACCP-2.2',
    questionText: 'Czy rejestry monitorowania CCP są prowadzone na bieżąco i weryfikowane przez wyznaczonego Kierownika Jakości?',
    guidance: 'Wymóg KO HACCP #2. Zapisy bez luk, czytelne i podpisane przez osoby odpowiedzialne.',
    isKnockOut: true,
    sortOrder: 40,
  },
  {
    chapter: '2. Krytyczne Punkty Kontroli (CCP)',
    code: 'HACCP-2.3',
    questionText: 'Czy w przypadku przekroczenia limitu krytycznego CCP natychmiast wdrożono procedurę działań korygujących i wstrzymano wyroby?',
    guidance: 'Wymóg KO HACCP #3. Pełne odizolowanie partii zagrożonej skażeniem.',
    isKnockOut: true,
    sortOrder: 50,
  },

  // 3. Dobra Praktyka Higieniczna i Produkcyjna (GHP/GMP)
  {
    chapter: '3. Dobra Praktyka Higieniczna i Produkcyjna (GHP/GMP)',
    code: 'HACCP-3.1',
    questionText: 'Czy stan techniczny maszyn, uszczelnień i powierzchni mających kontakt z żywnością zapobiega skażeniom krzyżowym?',
    guidance: 'Brak korozji, ubytków, stosowanie materiałów dopuszczonych do kontaktu z żywnością.',
    isKnockOut: false,
    sortOrder: 60,
  },
  {
    chapter: '3. Dobra Praktyka Higieniczna i Produkcyjna (GHP/GMP)',
    code: 'HACCP-3.2',
    questionText: 'Czy chemia myjąca i dezynfekcyjna jest odpowiednio magazynowana, oznakowana i stosowana wg instrukcji dozowania?',
    guidance: 'Brak ryzyka chemicznego skażenia żywności.',
    isKnockOut: false,
    sortOrder: 70,
  },

  // 4. Identyfikowalność i Wykorzystanie (Recall)
  {
    chapter: '4. Identyfikowalność Partii i Procedura Wycofania (Recall)',
    code: 'HACCP-4.1',
    questionText: 'Czy zapewniona jest pełna identyfikowalność surowców, półproduktów i opakowań na każdym etapie produkcji?',
    guidance: 'Zasada 1 krok w przód, 1 krok w tył.',
    isKnockOut: false,
    sortOrder: 80,
  },
  {
    chapter: '4. Identyfikowalność Partii i Procedura Wycofania (Recall)',
    code: 'HACCP-4.2',
    questionText: 'Czy procedura wycofania produktu z rynku (Mock Recall) jest okresowo testowana z bilansem masy wyrobu > 99.5%?',
    guidance: 'Czas przeprowadzenia próbnego wycofania poniżej 4 godzin.',
    isKnockOut: false,
    sortOrder: 90,
  },
];

export async function ensure5SAndHaccpAuditTypes() {
  // 1. Ensure 5S Audit Type
  let type5S = await prisma.auditType.findFirst({
    where: {
      OR: [
        { name: { contains: '5S' } },
        { name: { contains: '5s' } },
      ],
    },
  });

  if (!type5S) {
    type5S = await prisma.auditType.create({
      data: {
        name: 'Audyt 5S (Standardowy)',
        description: 'Formatka pytań standardu 5S: Seiri (Sortowanie), Seiton (Systematyka), Seiso (Sprzątanie), Seiketsu (Standaryzacja), Shitsuke (Samodyscyplina)',
      },
    });
  }

  const count5S = await prisma.auditTypeQuestion.count({
    where: { auditTypeId: type5S.id },
  });

  if (count5S === 0) {
    for (const q of QUESTIONS_5S) {
      await prisma.auditTypeQuestion.create({
        data: {
          auditTypeId: type5S.id,
          chapter: q.chapter,
          code: q.code,
          questionText: q.questionText,
          guidance: q.guidance,
          isKnockOut: q.isKnockOut,
          sortOrder: q.sortOrder,
        },
      });
    }
  }

  // 2. Ensure HACCP Audit Type
  let typeHaccp = await prisma.auditType.findFirst({
    where: {
      OR: [
        { name: { contains: 'HACCP' } },
        { name: { contains: 'haccp' } },
        { name: { contains: 'HACCAP' } },
        { name: { contains: 'haccap' } },
      ],
    },
  });

  if (!typeHaccp) {
    typeHaccp = await prisma.auditType.create({
      data: {
        name: 'Audyt HACCP / Bezpieczeństwo Żywności',
        description: 'Formatka pytań Analizy Zagrożeń i Krytycznych Punktów Kontrolnych (CCP) wg Codex Alimentarius',
      },
    });
  }

  const countHaccp = await prisma.auditTypeQuestion.count({
    where: { auditTypeId: typeHaccp.id },
  });

  if (countHaccp === 0) {
    for (const q of QUESTIONS_HACCP) {
      await prisma.auditTypeQuestion.create({
        data: {
          auditTypeId: typeHaccp.id,
          chapter: q.chapter,
          code: q.code,
          questionText: q.questionText,
          guidance: q.guidance,
          isKnockOut: q.isKnockOut,
          sortOrder: q.sortOrder,
        },
      });
    }
  }

  return { type5S, typeHaccp };
}
