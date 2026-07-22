import { prisma } from '@/config/db';

export const IFS_FOOD_V8_QUESTIONS = [
  // Rozdział 1: Kierownictwo i ciągłe doskonalenie
  {
    chapter: '1. Kierownictwo i ciągłe doskonalenie',
    code: '1.1.1',
    questionText: 'Czy kadra kierownicza sformułowała i wdrożyła politykę jakości oraz kulturę bezpieczeństwa żywności (Food Safety Culture)?',
    guidance: 'Wymóg KO #1. Kierownictwo musi wykazać zaangażowanie w budowanie kultury bezpieczeństwa żywności.',
    isKnockOut: true,
    sortOrder: 10,
  },
  {
    chapter: '1. Kierownictwo i ciągłe doskonalenie',
    code: '1.2.2',
    questionText: 'Czy przegląd zarządzania odbywa się co najmniej raz w roku i uwzględnia cele jakościowe oraz wyniki audytów?',
    guidance: 'Przegląd musi zawierać weryfikację wskaźników KPI i działań korygujących.',
    isKnockOut: false,
    sortOrder: 20,
  },

  // Rozdział 2: System zarządzania bezpieczeństwem żywności (HACCP)
  {
    chapter: '2. System Zarządzania HACCP',
    code: '2.1.1',
    questionText: 'Czy zespół HACCP posiada odpowiednią wiedzę interdyscyplinarną i aktualne szkolenia?',
    guidance: 'Wymagana jest imienna lista zespołu HACCP z zakresem kompetencji.',
    isKnockOut: false,
    sortOrder: 30,
  },
  {
    chapter: '2. System Zarządzania HACCP',
    code: '2.2.1',
    questionText: 'Czy analiza zagrożeń opiera się na 7 zasadach Codex Alimentarius i obejmuje wszystkie surowce i etapy procesu?',
    guidance: 'Wymóg KO #2. Wszelkie fizyczne, chemiczne, biologiczne i alergazenne zagrożenia muszą być ocenione.',
    isKnockOut: true,
    sortOrder: 40,
  },
  {
    chapter: '2. System Zarządzania HACCP',
    code: '2.3.1',
    questionText: 'Czy dla każdego CCP ustalono limity krytyczne oraz procedury ciągłego monitorowania?',
    guidance: 'Zapisy monitorowania CCP muszą być weryfikowane przez wyznaczonego kierownika.',
    isKnockOut: false,
    sortOrder: 50,
  },

  // Rozdział 3: Zarządzanie zasobami i Higiena Personelu
  {
    chapter: '3. Higiena Personelu i Zasoby',
    code: '3.1.1',
    questionText: 'Czy personel produkcyjny przestrzega instrukcji higieny osobistej (zakaz noszenia biżuterii, zegarków, czysta odzież)?',
    guidance: 'Wymóg KO #3. Brak przestrzegania zasad higieny osobistej dyskwalifikuje zakład.',
    isKnockOut: true,
    sortOrder: 60,
  },
  {
    chapter: '3. Higiena Personelu i Zasoby',
    code: '3.2.1',
    questionText: 'Czy strefy mycia rąk przy wejściu na produkcję są wyposażone w wodę, mydło, środki dezynfekcyjne i bezdotykowe podajniki?',
    guidance: 'Mycie i dezynfekcja rąk musi być obowiązkowa przed wejściem na halę.',
    isKnockOut: false,
    sortOrder: 70,
  },

  // Rozdział 4: Procesy Operacyjne i Higiena Zakładu
  {
    chapter: '4. Procesy Operacyjne i Infrastruktura',
    code: '4.1.1',
    questionText: 'Czy stan techniczny posadzek, ścian, sufitów oraz odwodnień zapobiega gromadzeniu wody i skażeniom?',
    guidance: 'Brak pęknięć, ubytków i stojącej wody na trasach produkcyjnych.',
    isKnockOut: false,
    sortOrder: 80,
  },
  {
    chapter: '4. Procesy Operacyjne i Infrastruktura',
    code: '4.2.1',
    questionText: 'Czy procedury mycia i dezynfekcji są udokumentowane, a ich skuteczność regularnie weryfikowana wymazami?',
    guidance: 'Wymóg KO #4. Plan mycia musi zawierać stężenia chemii, czas i temperaturę.',
    isKnockOut: true,
    sortOrder: 90,
  },
  {
    chapter: '4. Procesy Operacyjne i Infrastruktura',
    code: '4.3.1',
    questionText: 'Czy wdrożono skuteczną procedurę zapobiegania zanieczyszczeniu ciałami obcymi (detektor metalu, sita, rejestr szkła)?',
    guidance: 'Wymóg KO #5. Detektory metalu muszą być testowane na początku i końcu zmiany próbkami testowymi.',
    isKnockOut: true,
    sortOrder: 100,
  },
  {
    chapter: '4. Procesy Operacyjne i Infrastruktura',
    code: '4.4.1',
    questionText: 'Czy prowadzone jest profesjonalne zabezpieczenie przed szkodnikami (DDD) z aktualną mapą pułapek i raportami?',
    guidance: 'Brak śladów obecności gryzoni lub owadów w strefach magazynowych i produkcyjnych.',
    isKnockOut: false,
    sortOrder: 110,
  },

  // Rozdział 5: Pomiary, Analizy i Weryfikacja
  {
    chapter: '5. Pomiary, Analizy i Wycofania',
    code: '5.1.1',
    questionText: 'Czy harmonogram audytów wewnętrznych jest w pełni realizowany przez niezależnych audytorów?',
    guidance: 'Działania korygujące z audytów wewnętrznych muszą posiadać wyznaczone terminy i odpowiedzialnych.',
    isKnockOut: false,
    sortOrder: 120,
  },
  {
    chapter: '5. Pomiary, Analizy i Wycofania',
    code: '5.2.1',
    questionText: 'Czy procedura wycofania i przywołania produktu z rynku jest testowana próbnie co najmniej raz w roku?',
    guidance: 'Wymóg KO #6. Test wycofania (Mock Recall) musi osiągać bilans masy wyrobu > 99.5% w czasie poniżej 4 godzin.',
    isKnockOut: true,
    sortOrder: 130,
  },

  // Rozdział 6: Food Defense i Ochrona Zakładu
  {
    chapter: '6. Food Defense i Ochrona Zakładu',
    code: '6.1.1',
    questionText: 'Czy wykonano analizę zagrożeń Food Defense i zidentyfikowano krytyczne strefy dostępu?',
    guidance: 'Ochrona przed celowym i sabotażowym skażeniem żywności.',
    isKnockOut: false,
    sortOrder: 140,
  },
  {
    chapter: '6. Food Defense i Ochrona Zakładu',
    code: '6.2.1',
    questionText: 'Czy wejścia dla osób postronnych, kierowców i dostawców są nadzorowane i rejestrowane?',
    guidance: 'Kierowcy dostawczy nie mogą poruszać się swobodnie po hali produkcyjnej.',
    isKnockOut: false,
    sortOrder: 150,
  },
];

export async function ensureIfsAuditTypeWithQuestions() {
  // Find or create IFS Food v8 AuditType
  let ifs = await prisma.auditType.findFirst({
    where: {
      OR: [
        { name: { contains: 'IFS' } },
        { name: { contains: 'ifs' } },
      ],
    },
  });

  if (!ifs) {
    ifs = await prisma.auditType.create({
      data: {
        name: 'IFS Food v8',
        description: 'Standard Międzynarodowy Bezpieczeństwa Żywności (IFS Food Version 8) - Formatka Pytań i Wymogów KO',
      },
    });
  }

  // Check how many questions exist
  const existingCount = await prisma.auditTypeQuestion.count({
    where: { auditTypeId: ifs.id },
  });

  if (existingCount === 0) {
    // Populate official questions
    for (const q of IFS_FOOD_V8_QUESTIONS) {
      await prisma.auditTypeQuestion.create({
        data: {
          auditTypeId: ifs.id,
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

  return ifs;
}
