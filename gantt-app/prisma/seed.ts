import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
const { hash } = bcryptjs;

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const passwordHash = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gantt-anbud.se' },
    update: {},
    create: {
      email: 'admin@gantt-anbud.se',
      name: 'Admin',
      passwordHash,
      role: 'admin',
      profileConfig: JSON.stringify({
        keywords: ['byggledning', 'projektledning', 'BIM', 'Stockholm'],
        regions: ['Stockholm', 'Göteborg', 'Malmö'],
        categories: ['byggledning', 'projektledning', 'bim_samordning'],
      }),
    },
  });

  // Create a regular user
  const userHash = await hash('user123', 12);
  await prisma.user.upsert({
    where: { email: 'user@gantt-anbud.se' },
    update: {},
    create: {
      email: 'user@gantt-anbud.se',
      name: 'Byggkonsult',
      passwordHash: userHash,
      role: 'user',
      profileConfig: JSON.stringify({
        keywords: ['geoteknik', 'besiktning', 'kontrollansvarig'],
        regions: ['Göteborg', 'Hela Sverige'],
        categories: ['geoteknik', 'besiktning', 'kontrollansvarig'],
      }),
    },
  });

  // Seed search keywords
  const keywords = [
    { keyword: 'Byggledning', category: 'bygg' },
    { keyword: 'Projektledning', category: 'bygg' },
    { keyword: 'Besiktning', category: 'bygg' },
    { keyword: 'Projektering', category: 'bygg' },
    { keyword: 'Kalkyl', category: 'bygg' },
    { keyword: 'Underhåll', category: 'bygg' },
    { keyword: 'Byggprojektledning', category: 'bygg' },
    { keyword: 'Kontrollansvarig', category: 'bygg' },
    { keyword: 'Teknisk förvaltning', category: 'teknik' },
    { keyword: 'Fastighetsutveckling', category: 'bygg' },
    { keyword: 'Mark och exploatering', category: 'bygg' },
    { keyword: 'Entreprenadjuridik', category: 'bygg' },
    { keyword: 'Geoteknik', category: 'teknik' },
    { keyword: 'Byggkontroll', category: 'bygg' },
    { keyword: 'Rivning och sanering', category: 'bygg' },
    { keyword: 'BIM-samordning', category: 'teknik' },
    { keyword: 'Totalentreprenad', category: 'bygg' },
    { keyword: 'Ramavtal', category: 'general' },
    { keyword: 'Infrastruktur', category: 'bygg' },
    { keyword: 'Energioptimering', category: 'teknik' },
  ];

  for (const kw of keywords) {
    await prisma.searchKeyword.upsert({
      where: { keyword: kw.keyword },
      update: {},
      create: kw,
    });
  }

  // Seed mock tenders
  const now = new Date();
  const day = 86400000;

  const tenders = [
    {
      externalId: 'MOCK-001',
      title: 'Byggledning för nyproduktion av bostäder i Hagastaden',
      description: 'Stockholms stad söker byggledare för nyproduktion av 120 lägenheter i Hagastaden. Uppdraget omfattar byggledning genom samtliga skeden från projektering till slutbesiktning.',
      category: 'byggledning',
      region: 'Stockholm',
      buyer: 'Stockholms stad',
      value: 4500000,
      publishedAt: new Date(now.getTime() - 2 * day),
      deadlineAt: new Date(now.getTime() + 12 * day),
      source: 'mercell',
      sourceUrl: 'https://mercell.com/mock/001',
      status: 'ny',
      matchScore: 91,
      matchReason: 'Matchar på: byggledning, Stockholm, värde >2Mkr',
    },
    {
      externalId: 'MOCK-002',
      title: 'Kontrollansvarig (KA) för skolbyggnad i Mölndal',
      description: 'Mölndals kommun upphandlar kontrollansvarig enligt PBL för ombyggnad av Fässbergsskolan.',
      category: 'kontrollansvarig',
      region: 'Göteborg',
      buyer: 'Mölndals kommun',
      value: 800000,
      publishedAt: new Date(now.getTime() - 1 * day),
      deadlineAt: new Date(now.getTime() + 4 * day),
      source: 'visma_anbud',
      sourceUrl: 'https://vismaanbud.com/mock/002',
      status: 'stänger_snart',
      matchScore: 78,
      matchReason: 'Matchar på: kontrollansvarig, Göteborg-region',
    },
    {
      externalId: 'MOCK-003',
      title: 'Projektering av VA-nät i Uppsala kommun',
      description: 'Uppsala Vatten söker konsult för projektering av nytt VA-nät i Södra staden.',
      category: 'projektering',
      region: 'Uppsala',
      buyer: 'Uppsala Vatten och Avfall AB',
      value: 3200000,
      publishedAt: new Date(now.getTime() - 5 * day),
      deadlineAt: new Date(now.getTime() + 20 * day),
      source: 'ted_eu',
      sourceUrl: 'https://ted.europa.eu/mock/003',
      status: 'ny',
      matchScore: 62,
      matchReason: 'Matchar på: projektering, infrastruktur',
    },
    {
      externalId: 'MOCK-004',
      title: 'Besiktning av broar och tunnlar i Västra Götaland',
      description: 'Trafikverket upphandlar besiktningstjänster för ca 200 broar och 15 tunnlar. Ramavtal 4 år.',
      category: 'besiktning',
      region: 'Göteborg',
      buyer: 'Trafikverket',
      value: 8000000,
      publishedAt: new Date(now.getTime() - 3 * day),
      deadlineAt: new Date(now.getTime() + 30 * day),
      source: 'mercell',
      sourceUrl: 'https://mercell.com/mock/004',
      status: 'ny',
      matchScore: 85,
      matchReason: 'Matchar på: besiktning, ramavtal, högt värde',
    },
    {
      externalId: 'MOCK-005',
      title: 'Mark och exploatering — detaljplan Västerås',
      description: 'Västerås stad söker konsultstöd för mark- och exploateringsfrågor.',
      category: 'mark_exploatering',
      region: 'Västerås',
      buyer: 'Västerås stad',
      value: 1500000,
      publishedAt: new Date(now.getTime() - 0.5 * day),
      deadlineAt: new Date(now.getTime() + 8 * day),
      source: 'visma_anbud',
      sourceUrl: 'https://vismaanbud.com/mock/005',
      status: 'ny',
      matchScore: 55,
      matchReason: 'Delvis matchning: mark och exploatering',
    },
    {
      externalId: 'MOCK-006',
      title: 'Geoteknisk undersökning Norrköping',
      description: 'Geoteknisk undersökning och markmiljöutredning inför nybyggnad av idrottshall.',
      category: 'geoteknik',
      region: 'Norrköping',
      buyer: 'Norrköpings kommun',
      value: 650000,
      publishedAt: new Date(now.getTime() - 1 * day),
      deadlineAt: new Date(now.getTime() + 15 * day),
      source: 'mercell',
      sourceUrl: 'https://mercell.com/mock/006',
      status: 'ny',
      matchScore: 72,
      matchReason: 'Matchar på: geoteknik',
    },
    {
      externalId: 'MOCK-007',
      title: 'BIM-samordning för sjukhusbyggnad Malmö',
      description: 'Region Skåne söker BIM-samordnare för tillbyggnad av Skånes universitetssjukhus.',
      category: 'bim_samordning',
      region: 'Malmö',
      buyer: 'Region Skåne',
      value: 2800000,
      publishedAt: new Date(now.getTime() - 4 * day),
      deadlineAt: new Date(now.getTime() + 25 * day),
      source: 'ted_eu',
      sourceUrl: 'https://ted.europa.eu/mock/007',
      status: 'ny',
      matchScore: 88,
      matchReason: 'Matchar på: BIM-samordning, Malmö, sjukvård',
    },
    {
      externalId: 'MOCK-008',
      title: 'Rivning och sanering av industrilokal Helsingborg',
      description: 'Rivning och sanering av f.d. kemikaliefabrik. Kräver erfarenhet av miljösanering.',
      category: 'rivning_sanering',
      region: 'Helsingborg',
      buyer: 'Helsingborgs stad',
      value: 12000000,
      publishedAt: new Date(now.getTime() - 7 * day),
      deadlineAt: new Date(now.getTime() + 3 * day),
      source: 'mercell',
      sourceUrl: 'https://mercell.com/mock/008',
      status: 'stänger_snart',
      matchScore: 45,
      matchReason: 'Låg matchning: rivning utanför kärnkompetens',
    },
    {
      externalId: 'MOCK-009',
      title: 'Kalkyl och mängdförteckning Linköping',
      description: 'Konsultstöd för framtagande av kalkyl och mängdförteckning inför nytt kulturhus.',
      category: 'kalkyl',
      region: 'Linköping',
      buyer: 'Linköpings kommun',
      value: 500000,
      publishedAt: new Date(now.getTime()),
      deadlineAt: new Date(now.getTime() + 18 * day),
      source: 'visma_anbud',
      sourceUrl: 'https://vismaanbud.com/mock/009',
      status: 'ny',
      matchScore: 68,
      matchReason: 'Matchar på: kalkyl, offentlig upphandling',
    },
    {
      externalId: 'MOCK-010',
      title: 'Entreprenadjuridisk rådgivning — Trafikverket',
      description: 'Ramavtal för entreprenadjuridisk rådgivning. Tvistlösning och ÄTA-hantering.',
      category: 'entreprenadjuridik',
      region: 'Hela Sverige',
      buyer: 'Trafikverket',
      value: 5000000,
      publishedAt: new Date(now.getTime() - 6 * day),
      deadlineAt: new Date(now.getTime() + 10 * day),
      source: 'ted_eu',
      sourceUrl: 'https://ted.europa.eu/mock/010',
      status: 'uppdaterad',
      matchScore: 40,
      matchReason: 'Låg matchning: juridik, ej teknik',
    },
    {
      externalId: 'MOCK-011',
      title: 'Teknisk förvaltning bostadsbestånd Jönköping',
      description: 'Partner för teknisk förvaltning av ca 3000 lägenheter.',
      category: 'teknisk_förvaltning',
      region: 'Jönköping',
      buyer: 'Jönköpings Bostads AB',
      value: 15000000,
      publishedAt: new Date(now.getTime() - 2 * day),
      deadlineAt: new Date(now.getTime() + 22 * day),
      source: 'mercell',
      sourceUrl: 'https://mercell.com/mock/011',
      status: 'ny',
      matchScore: 75,
      matchReason: 'Matchar på: teknisk förvaltning, högt värde',
    },
    {
      externalId: 'MOCK-012',
      title: 'Fastighetsutveckling blandstad Örebro',
      description: 'Strategisk rådgivare för fastighetsutveckling i Södra Ladugårdsängen.',
      category: 'fastighetsutveckling',
      region: 'Örebro',
      buyer: 'ÖrebroBostäder AB',
      value: 2000000,
      publishedAt: new Date(now.getTime() - 3 * day),
      deadlineAt: new Date(now.getTime() + 14 * day),
      source: 'visma_anbud',
      sourceUrl: 'https://vismaanbud.com/mock/012',
      status: 'ny',
      matchScore: 58,
      matchReason: 'Delvis matchning: fastighetsutveckling',
    },
    {
      externalId: 'MOCK-013',
      title: 'Underhållsplan för kommunala fastigheter Umeå',
      description: 'Framtagande av underhållsplaner för kommunens fastighetsbestånd om ca 200 byggnader.',
      category: 'underhåll',
      region: 'Umeå',
      buyer: 'Umeå kommun',
      value: 900000,
      publishedAt: new Date(now.getTime() - 8 * day),
      deadlineAt: new Date(now.getTime() + 6 * day),
      source: 'mercell',
      sourceUrl: 'https://mercell.com/mock/013',
      status: 'stänger_snart',
      matchScore: 64,
      matchReason: 'Matchar på: underhåll, fastigheter',
    },
    {
      externalId: 'MOCK-014',
      title: 'Byggkontroll nybyggnad kontor Sundsvall',
      description: 'Byggkontrollant för nybyggnad av kommunhus.',
      category: 'byggkontroll',
      region: 'Sundsvall',
      buyer: 'Sundsvalls kommun',
      value: 700000,
      publishedAt: new Date(now.getTime() - 1 * day),
      deadlineAt: new Date(now.getTime() + 2 * day),
      source: 'visma_anbud',
      sourceUrl: 'https://vismaanbud.com/mock/014',
      status: 'stänger_snart',
      matchScore: 70,
      matchReason: 'Matchar på: byggkontroll',
    },
    {
      externalId: 'MOCK-015',
      title: 'Projektledning infrastrukturprojekt Luleå',
      description: 'Projektledare för samhällsbyggnadsprojekt, ny stadsdel. Budget 250 Mkr.',
      category: 'projektledning',
      region: 'Luleå',
      buyer: 'Luleå kommun',
      value: 6000000,
      publishedAt: new Date(now.getTime() - 4 * day),
      deadlineAt: new Date(now.getTime() + 35 * day),
      source: 'ted_eu',
      sourceUrl: 'https://ted.europa.eu/mock/015',
      status: 'ny',
      matchScore: 82,
      matchReason: 'Matchar på: projektledning, infrastruktur, högt värde',
    },
    {
      externalId: 'MOCK-016',
      title: 'Byggprojektledning sjukvårdsbyggnad Karlstad',
      description: 'Byggprojektledare för renovering av centralsjukhuset. Budget 1,2 miljarder SEK.',
      category: 'byggprojektledning',
      region: 'Karlstad',
      buyer: 'Region Värmland',
      value: 9500000,
      publishedAt: new Date(now.getTime() - 10 * day),
      deadlineAt: new Date(now.getTime() + 45 * day),
      source: 'mercell',
      sourceUrl: 'https://mercell.com/mock/016',
      status: 'ny',
      matchScore: 93,
      matchReason: 'Matchar på: byggprojektledning, sjukvård, toppvärde',
    },
  ];

  for (const tender of tenders) {
    await prisma.tender.upsert({
      where: { externalId: tender.externalId },
      update: tender,
      create: tender,
    });
  }

  console.log(`Seeded: ${tenders.length} tenders, 2 users, ${keywords.length} keywords`);
  console.log(`Admin login: admin@gantt-anbud.se / admin123`);
  console.log(`User login: user@gantt-anbud.se / user123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
