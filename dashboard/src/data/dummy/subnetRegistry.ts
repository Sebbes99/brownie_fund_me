import { SubnetMeta } from '../../types';

const SUBNET_NAMES: [string, string, string[]][] = [
  ['Root Network', 'ROOT', ['governance', 'core']],
  ['Text Prompting', 'TP', ['ai', 'nlp']],
  ['Machine Translation', 'MT', ['ai', 'translation']],
  ['Data Scraping', 'DS', ['data', 'scraping']],
  ['Multi-Modality', 'MM', ['ai', 'multimodal']],
  ['Text-to-Image', 'T2I', ['ai', 'generative']],
  ['Storage', 'STR', ['infrastructure', 'storage']],
  ['Prediction Market', 'PM', ['defi', 'prediction']],
  ['Pre-Training', 'PT', ['ai', 'training']],
  ['Map Reduce', 'MR', ['compute', 'distributed']],
  ['Transcription', 'TRN', ['ai', 'audio']],
  ['Horde', 'HRD', ['compute', 'inference']],
  ['Data Universe', 'DU', ['data', 'analytics']],
  ['LLM Defense', 'LDF', ['ai', 'security']],
  ['Blockchain Insights', 'BCI', ['analytics', 'blockchain']],
  ['Audio Generation', 'AG', ['ai', 'audio', 'generative']],
  ['Flavia', 'FLV', ['ai', 'nlp']],
  ['Cortex.t', 'CRT', ['ai', 'inference']],
  ['Namodata', 'NMD', ['data', 'collection']],
  ['BitAgent', 'BAG', ['ai', 'agents']],
  ['Omega Labs', 'OML', ['ai', 'research']],
  ['Datura', 'DTR', ['ai', 'compute']],
  ['NicheImage', 'NI', ['ai', 'image']],
  ['Omega Focus', 'OF', ['ai', 'attention']],
  ['Protein Folding', 'PF', ['ai', 'biotech']],
  ['Infinite Games', 'IG', ['gaming', 'ai']],
  ['Neural Internet', 'NIN', ['infrastructure', 'ai']],
  ['Foundry S&P', 'FSP', ['analytics', 'finance']],
  ['Coldint', 'CLD', ['ai', 'reasoning']],
  ['Bettensor', 'BET', ['prediction', 'sports']],
  ['Wombo', 'WMB', ['ai', 'creative']],
  ['IT Department', 'ITD', ['infrastructure', 'devops']],
  ['ReadyAI', 'RAI', ['ai', 'deployment']],
  ['Subnet 34', 'S34', ['ai', 'misc']],
  ['LogicNet', 'LGN', ['ai', 'reasoning']],
  ['Sentiment Analysis', 'SA', ['ai', 'nlp', 'finance']],
  ['Compute Exchange', 'CEX', ['compute', 'marketplace']],
  ['Tatsu', 'TAT', ['ai', 'inference']],
  ['EdgeMaxxing', 'EMX', ['ai', 'optimization']],
  ['Fractal', 'FRC', ['ai', 'generative']],
  ['Chunking', 'CHK', ['data', 'processing']],
  ['Dippy', 'DPY', ['ai', 'social']],
  ['Human Intelligence', 'HI', ['data', 'labeling']],
  ['Score Predict', 'SP', ['prediction', 'sports']],
  ['Gen42', 'G42', ['ai', 'gaming']],
  ['Neural Condense', 'NC', ['ai', 'compression']],
  ['Tensorplex', 'TPX', ['infrastructure', 'ai']],
  ['AutoML', 'AML', ['ai', 'automl']],
  ['Hivetrain', 'HVT', ['ai', 'distributed']],
  ['Synth', 'SYN', ['ai', 'synthetic']],
];

function generateSubnets(count: number): SubnetMeta[] {
  const subnets: SubnetMeta[] = [];
  for (let i = 0; i < count; i++) {
    const template = SUBNET_NAMES[i % SUBNET_NAMES.length];
    const suffix = i >= SUBNET_NAMES.length ? ` v${Math.floor(i / SUBNET_NAMES.length) + 1}` : '';
    const daysAgo = Math.floor(Math.random() * 365) + 30;
    const created = new Date(Date.now() - daysAgo * 86400000);
    const isNew = daysAgo < 14;

    subnets.push({
      subnetId: i,
      name: `${template[0]}${suffix}`,
      symbol: template[1] + (suffix ? `${Math.floor(i / SUBNET_NAMES.length) + 1}` : ''),
      description: `Subnet ${i}: ${template[0]}${suffix} - A Bittensor subnet focused on ${template[2].join(', ')} capabilities.`,
      tags: template[2],
      createdAt: created.toISOString(),
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      registryVersion: 1,
      isNew,
    });
  }
  return subnets;
}

export const dummySubnets: SubnetMeta[] = generateSubnets(128);
