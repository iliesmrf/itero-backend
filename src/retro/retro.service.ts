import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Room, Note, Action, Priority, Participant, Step,
  Cluster, RetrospectiveSummary, HistoryEntry,
} from './retro.types';
import { RETRO_FORMATS, FormatId } from './retro.formats';

// ── Color palette ─────────────────────────────────────────────────────────
const PALETTE: [string, string][] = [
  ['#a78bfa','#1e1240'],['#4ade80','#0d2a1a'],['#f87171','#2a0d0d'],
  ['#60a5fa','#0d1e35'],['#fb923c','#2a1205'],['#e879f9','#280d2a'],
  ['#34d399','#052a1e'],['#fbbf24','#2a1a05'],['#f472b6','#2a0d1e'],
  ['#38bdf8','#041e2a'],
];
function pickColor(name: string): [string, string] {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length;
  return PALETTE[h];
}
function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Text similarity (Jaccard on word tokens) ──────────────────────────────
function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-zàâçéèêëîïôûùüÿñæœ0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2),
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach(w => { if (b.has(w)) inter++; });
  return inter / (a.size + b.size - inter);
}

@Injectable()
export class RetroService {
  private rooms = new Map<string, Room>();

  // ── Room lifecycle ────────────────────────────────────────────────────────
  createRoom(): Room {
    let code: string;
    do { code = genCode(); } while (this.rooms.has(code));
    const room: Room = {
      code, step: 0,
      format: 'start-stop-continue',
      participants: {}, notes: {}, clusters: {}, votes: {}, actions: {},
      summary: null, history: [],
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    setTimeout(() => this.rooms.delete(code), 24 * 60 * 60 * 1000);
    return room;
  }

  getRoom(code: string): Room | null {
    return this.rooms.get(code.toUpperCase()) ?? null;
  }

  roomExists(code: string): boolean {
    return this.rooms.has(code.toUpperCase());
  }

  // ── Format ────────────────────────────────────────────────────────────────
  setFormat(code: string, format: FormatId): Room | null {
    const room = this.getRoom(code);
    if (!room || !RETRO_FORMATS[format]) return null;
    room.format = format;
    // Reset notes/clusters when format changes (only allowed before collect)
    room.notes = {}; room.clusters = {}; room.votes = {};
    return room;
  }

  // ── Participants ──────────────────────────────────────────────────────────
  joinRoom(code: string, name: string, avatar = ''): { room: Room; participant: Participant } | null {
    const room = this.getRoom(code);
    if (!room) return null;
    const [color, textColor] = pickColor(name);
    const participant: Participant = { id: uuidv4(), name, color, textColor, avatar, joinedAt: Date.now() };
    room.participants[name] = participant;
    return { room, participant };
  }

  leaveRoom(code: string, name: string): Room | null {
    const room = this.getRoom(code);
    if (!room) return null;
    delete room.participants[name];
    return room;
  }

  // ── Step ──────────────────────────────────────────────────────────────────
  setStep(code: string, step: Step): Room | null {
    const room = this.getRoom(code);
    if (!room) return null;
    room.step = step;
    return room;
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  addNote(code: string, text: string, col: string, author: string): Note | null {
    const room = this.getRoom(code);
    if (!room) return null;
    const [authorColor] = pickColor(author);
    const note: Note = { id: uuidv4(), text: text.trim().slice(0, 300), col, author, authorColor, createdAt: Date.now() };
    room.notes[note.id] = note;
    return note;
  }

  deleteNote(code: string, noteId: string, requester: string): boolean {
    const room = this.getRoom(code);
    if (!room) return false;
    const note = room.notes[noteId];
    if (!note || note.author !== requester) return false;
    delete room.notes[noteId];
    Object.values(room.votes).forEach(v => delete v[noteId]);
    // Remove from clusters
    Object.values(room.clusters).forEach(c => {
      c.noteIds = c.noteIds.filter(id => id !== noteId);
    });
    return true;
  }

  // ── Auto-clustering ───────────────────────────────────────────────────────
  // Groups notes by column, then clusters within each column using
  // greedy single-link clustering (Jaccard threshold = 0.2)
  autoClusters(code: string): Record<string, Cluster> | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const notes = Object.values(room.notes);
    const format = RETRO_FORMATS[room.format];
    const clusters: Record<string, Cluster> = {};

    for (const col of format.cols) {
      const colNotes = notes.filter(n => n.col === col.key);
      if (!colNotes.length) continue;

      // Union-find style greedy clustering
      const groups: Note[][] = [];
      const assigned = new Set<string>();

      for (const note of colNotes) {
        if (assigned.has(note.id)) continue;
        const tokens = tokenize(note.text);
        // Find existing group with highest similarity
        let bestGroup: Note[] | null = null;
        let bestScore = 0;
        for (const group of groups) {
          const score = Math.max(...group.map(g => jaccard(tokens, tokenize(g.text))));
          if (score > bestScore) { bestScore = score; bestGroup = group; }
        }
        if (bestScore >= 0.2 && bestGroup) {
          bestGroup.push(note);
        } else {
          groups.push([note]);
        }
        assigned.add(note.id);
      }

      // Only create clusters for groups with 2+ notes
      for (const group of groups) {
        if (group.length < 2) {
          // Single note — put in its own cluster with its text as label
          const c: Cluster = {
            id: uuidv4(), label: group[0].text.slice(0, 60),
            noteIds: [group[0].id], col: col.key, createdAt: Date.now(),
          };
          clusters[c.id] = c;
          group[0].clusterId = c.id;
        } else {
          // Multi-note cluster — label = most common significant words
          const allTokens = group.flatMap(n => [...tokenize(n.text)]);
          const freq = new Map<string, number>();
          allTokens.forEach(t => freq.set(t, (freq.get(t) || 0) + 1));
          const topWords = [...freq.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([w]) => w);
          const label = topWords.join(' · ') || group[0].text.slice(0, 40);
          const c: Cluster = {
            id: uuidv4(), label,
            noteIds: group.map(n => n.id), col: col.key, createdAt: Date.now(),
          };
          clusters[c.id] = c;
          group.forEach(n => { n.clusterId = c.id; });
        }
      }
    }

    room.clusters = clusters;
    return clusters;
  }

  // ── Votes ─────────────────────────────────────────────────────────────────
  castVote(code: string, voter: string, noteId: string): Room | null {
    const room = this.getRoom(code);
    if (!room || !room.notes[noteId]) return null;
    if (!room.votes[voter]) room.votes[voter] = {};
    const userVotes = room.votes[voter];
    const totalUsed = Object.values(userVotes).reduce((a, b) => a + b, 0);
    if (totalUsed >= 3) return null;
    userVotes[noteId] = (userVotes[noteId] || 0) + 1;
    return room;
  }

  removeVote(code: string, voter: string, noteId: string): Room | null {
    const room = this.getRoom(code);
    if (!room) return null;
    const userVotes = room.votes[voter];
    if (!userVotes || !userVotes[noteId]) return null;
    userVotes[noteId]--;
    if (userVotes[noteId] <= 0) delete userVotes[noteId];
    return room;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  addAction(code: string, text: string, owner: string, date: string, priority: Priority, addedBy: string): Action | null {
    const room = this.getRoom(code);
    if (!room) return null;
    const action: Action = { id: uuidv4(), text: text.trim().slice(0, 300), owner, date, priority, addedBy, createdAt: Date.now() };
    room.actions[action.id] = action;
    return action;
  }

  deleteAction(code: string, actionId: string): boolean {
    const room = this.getRoom(code);
    if (!room || !room.actions[actionId]) return false;
    delete room.actions[actionId];
    return true;
  }

  // ── Summary + History ─────────────────────────────────────────────────────
  async generateSummary(code: string): Promise<RetrospectiveSummary | null> {
    const room = this.getRoom(code);
    if (!room) return null;

    const notes = Object.values(room.notes);
    const actions = Object.values(room.actions);
    const format = RETRO_FORMATS[room.format];

    // Build vote totals
    const totals: Record<string, number> = {};
    Object.values(room.votes).forEach(uv => {
      Object.entries(uv).forEach(([id, c]) => { totals[id] = (totals[id] || 0) + c; });
    });

    const topVotedNotes = notes
      .map(n => ({ text: n.text, col: n.col, votes: totals[n.id] || 0 }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10);

    // Build prompt for Claude API
    const formatName = format.name;
    const notesByCol = format.cols.map(col => {
      const colNotes = notes.filter(n => n.col === col.key);
      return `### ${col.label}\n${colNotes.map(n => `- ${n.text}${totals[n.id] ? ` (${totals[n.id]} votes)` : ''}`).join('\n') || '_Aucune note_'}`;
    }).join('\n\n');

    const actionsList = actions.length
      ? actions.map(a => `- [${a.priority.toUpperCase()}] ${a.text}${a.owner ? ` → ${a.owner}` : ''}${a.date ? ` (${a.date})` : ''}`).join('\n')
      : '_Aucune action définie_';

    const prompt = `Tu es un facilitateur Agile expert. Génère un résumé structuré et synthétique de cette rétrospective en français.

**Format utilisé**: ${formatName}
**Participants**: ${Object.keys(room.participants).join(', ') || 'N/A'}
**Date**: ${new Date().toLocaleDateString('fr-FR')}

## Notes collectées
${notesByCol}

## Actions décidées
${actionsList}

Génère un résumé en markdown avec :
1. **Synthèse** (2-3 phrases résumant la rétro)
2. **Points clés** (les thèmes les plus importants avec votes)
3. **Décisions & actions** (ce qui a été acté)
4. **À surveiller** (risques ou points de vigilance identifiés)

Sois concis, factuel et orienté action. Maximum 400 mots.`;

    let summaryText = '';
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json() as any;
      summaryText = data?.content?.[0]?.text || '';
    } catch (e) {
      // Fallback: generate summary without AI
      summaryText = this.buildFallbackSummary(room, topVotedNotes, actions);
    }

    const summary: RetrospectiveSummary = {
      generatedAt: Date.now(),
      text: summaryText,
      topVotedNotes,
      actionCount: actions.length,
    };

    room.summary = summary;

    // Save to history
    this.saveToHistory(room);

    return summary;
  }

  private buildFallbackSummary(room: Room, topVoted: any[], actions: Action[]): string {
    const format = RETRO_FORMATS[room.format];
    const noteCount = Object.keys(room.notes).length;
    const participants = Object.keys(room.participants);
    const lines: string[] = [];
    lines.push(`## Synthèse de la rétro — ${format.name}`);
    lines.push(`\n**Participants** : ${participants.join(', ')}`);
    lines.push(`**Notes collectées** : ${noteCount} · **Actions** : ${actions.length}`);
    if (topVoted.length) {
      lines.push(`\n## Points les plus votés`);
      topVoted.slice(0, 5).forEach(n => {
        lines.push(`- **${n.text}** _(${n.col}, ${n.votes} vote${n.votes > 1 ? 's' : ''})_`);
      });
    }
    if (actions.length) {
      lines.push(`\n## Actions décidées`);
      actions.forEach(a => {
        const prio = { high: '🔴', medium: '🟡', low: '🟢' }[a.priority];
        lines.push(`- ${prio} **${a.text}**${a.owner ? ` → ${a.owner}` : ''}${a.date ? ` (${a.date})` : ''}`);
      });
    }
    return lines.join('\n');
  }

  private saveToHistory(room: Room): void {
    const entry: HistoryEntry = {
      id: uuidv4(),
      createdAt: Date.now(),
      format: room.format,
      participantNames: Object.keys(room.participants),
      noteCount: Object.keys(room.notes).length,
      actionCount: Object.keys(room.actions).length,
      summary: room.summary,
      actions: Object.values(room.actions),
    };
    room.history.unshift(entry);
    // Keep last 20 entries
    if (room.history.length > 20) room.history = room.history.slice(0, 20);
  }

  getHistory(code: string): HistoryEntry[] | null {
    const room = this.getRoom(code);
    return room ? room.history : null;
  }
}
