import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function generateMatchScore(
  tenderTitle: string,
  tenderDescription: string,
  userKeywords: string[],
  userRegions: string[],
  userCategories: string[]
): Promise<{ score: number; reason: string }> {
  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Du är en AI som matchar byggrelaterade anbudsförfrågningar mot en användarprofil.

Användarprofil:
- Nyckelord: ${userKeywords.join(', ')}
- Regioner: ${userRegions.join(', ')}
- Kategorier: ${userCategories.join(', ')}

Anbud:
Titel: ${tenderTitle}
Beskrivning: ${tenderDescription}

Ge en matchpoäng 0-100 och en kort motivering på svenska.
Svara EXAKT i detta JSON-format:
{"score": <number>, "reason": "<string>"}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text);
    return { score: parsed.score, reason: parsed.reason };
  } catch {
    return { score: 50, reason: 'Kunde inte generera AI-matchning' };
  }
}

export async function generateTenderSummary(
  title: string,
  description: string
): Promise<{ core: string; risks: string; nextStep: string }> {
  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Du är en expert på byggrelaterade anbudsförfrågningar.

Anbud:
Titel: ${title}
Beskrivning: ${description}

Ge en executive summary i 3 delar på svenska:
1. Kärna i uppdraget (1 mening)
2. Risker/möjligheter (1 mening)
3. Rekommenderat nästa steg (1 mening)

Svara EXAKT i detta JSON-format:
{"core": "<string>", "risks": "<string>", "nextStep": "<string>"}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text);
  } catch {
    return {
      core: 'Sammanfattning ej tillgänglig.',
      risks: 'Kunde inte analysera risker.',
      nextStep: 'Granska anbudet manuellt.',
    };
  }
}

export async function generateDailyBriefing(
  newCount: number,
  updatedCount: number,
  closedCount: number,
  urgentTenders: Array<{ title: string; daysLeft: number; matchScore: number }>
): Promise<string> {
  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Du är en AI-assistent för bygganbudsbevakning. Generera en kort daglig briefing på svenska.

Data:
- Nya anbud idag: ${newCount}
- Uppdaterade: ${updatedCount}
- Stängda: ${closedCount}
- Brådskande anbud: ${JSON.stringify(urgentTenders)}

Skriv 2-3 meningar som sammanfattar dagen. Lyft fram det viktigaste. Var koncis och professionell.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text;
  } catch {
    return `Idag tillkom ${newCount} nya anbud, ${updatedCount} uppdaterades och ${closedCount} stängdes.`;
  }
}

export async function chatWithContext(
  question: string,
  tendersContext: string
): Promise<string> {
  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Du är en AI-assistent specialiserad på byggrelaterade anbudsförfrågningar. Svara på svenska.

Aktuella anbud i systemet:
${tendersContext}

Användarens fråga: ${question}

Svara baserat på datan ovan. Var specifik och hänvisa till konkreta anbud.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text;
  } catch {
    return 'Kunde inte generera svar. Kontrollera att ANTHROPIC_API_KEY är korrekt konfigurerad.';
  }
}
