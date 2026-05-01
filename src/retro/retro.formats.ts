// ── Retro formats ────────────────────────────────────────────────────────────
// Each format defines its columns.
// col.key must be unique within the format and is used as the note.col value.

export const RETRO_FORMATS = {
  'start-stop-continue': {
    id: 'start-stop-continue',
    name: 'Start · Stop · Continue',
    emoji: '🔄',
    description: 'Le classique. Ce qu\'on démarre, arrête et continue.',
    cols: [
      { key: 'start',    label: 'Start',    color: '#4ade80', dim: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  sub: 'Nouvelles pratiques à lancer' },
      { key: 'stop',     label: 'Stop',     color: '#f87171', dim: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', sub: 'Ce qu\'on doit arrêter' },
      { key: 'continue', label: 'Continue', color: '#60a5fa', dim: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  sub: 'Ce qui fonctionne, à garder' },
    ],
  },

  '4ls': {
    id: '4ls',
    name: '4L\'s',
    emoji: '💡',
    description: 'Liked, Learned, Lacked, Longed for.',
    cols: [
      { key: 'liked',    label: 'Liked',     color: '#4ade80', dim: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  sub: 'Ce qu\'on a apprécié' },
      { key: 'learned',  label: 'Learned',   color: '#60a5fa', dim: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  sub: 'Ce qu\'on a appris' },
      { key: 'lacked',   label: 'Lacked',    color: '#f87171', dim: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', sub: 'Ce qui a manqué' },
      { key: 'longed',   label: 'Longed for',color: '#a78bfa', dim: 'rgba(167,139,250,0.12)',border: 'rgba(167,139,250,0.3)',  sub: 'Ce qu\'on aurait voulu avoir' },
    ],
  },

  'sailboat': {
    id: 'sailboat',
    name: 'Sailboat',
    emoji: '⛵',
    description: 'Ancres, vents, récifs et île au trésor.',
    cols: [
      { key: 'wind',   label: '💨 Vent',    color: '#4ade80', dim: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  sub: 'Ce qui nous fait avancer' },
      { key: 'anchor', label: '⚓ Ancre',   color: '#f87171', dim: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', sub: 'Ce qui nous ralentit' },
      { key: 'reef',   label: '🪨 Récif',   color: '#fb923c', dim: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.25)',  sub: 'Risques à venir' },
      { key: 'island', label: '🏝️ Île',     color: '#facc15', dim: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.25)',  sub: 'Notre objectif' },
    ],
  },

  '5whys': {
    id: '5whys',
    name: '5 Whys',
    emoji: '🔍',
    description: 'Identifier les causes racines par itération.',
    cols: [
      { key: 'problem', label: '⚠️ Problème', color: '#f87171', dim: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', sub: 'Le problème observé' },
      { key: 'why1',    label: 'Pourquoi 1',  color: '#fb923c', dim: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.25)',  sub: 'Première cause' },
      { key: 'why2',    label: 'Pourquoi 2',  color: '#facc15', dim: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.25)',  sub: 'Cause de la cause' },
      { key: 'why3',    label: 'Pourquoi 3',  color: '#4ade80', dim: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  sub: 'Aller plus loin' },
      { key: 'root',    label: '🎯 Cause racine', color: '#a78bfa', dim: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', sub: 'La vraie raison' },
    ],
  },

  'slow-us-down': {
    id: 'slow-us-down',
    name: 'What slowed us down',
    emoji: '🐢',
    description: 'Focus sur les freins, les solutions et les quick wins.',
    cols: [
      { key: 'blocker',  label: '🚧 Bloquant',  color: '#f87171', dim: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', sub: 'Ce qui nous a bloqués' },
      { key: 'friction', label: '😤 Friction',   color: '#fb923c', dim: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.25)',  sub: 'Ce qui était pénible' },
      { key: 'solution', label: '✅ Solution',   color: '#4ade80', dim: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  sub: 'Idées d\'amélioration' },
      { key: 'quickwin', label: '⚡ Quick win',  color: '#facc15', dim: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.25)',  sub: 'Actions rapides à prendre' },
    ],
  },
} as const;

export type FormatId = keyof typeof RETRO_FORMATS;
export type RetroFormat = typeof RETRO_FORMATS[FormatId];
export type RetroCol = RetroFormat['cols'][number];
