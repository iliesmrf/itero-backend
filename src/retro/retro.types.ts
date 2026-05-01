import { FormatId } from './retro.formats';

export type Priority = 'high' | 'medium' | 'low';
export type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// Steps: 0=FormatPicker, 1=Intro, 2=Collect, 3=Group, 4=Vote, 5=Actions, 6=Summary

export interface Participant {
  id: string;
  name: string;
  color: string;
  textColor: string;
  avatar: string;
  joinedAt: number;
}

export interface Note {
  id: string;
  text: string;
  col: string;
  author: string;
  authorColor: string;
  createdAt: number;
  clusterId?: string;
}

export interface Cluster {
  id: string;
  label: string;
  noteIds: string[];
  col: string;
  createdAt: number;
}

export interface Vote {
  [noteId: string]: number;
}

export interface Action {
  id: string;
  text: string;
  owner: string;
  date: string;
  priority: Priority;
  addedBy: string;
  createdAt: number;
}

export interface RetrospectiveSummary {
  generatedAt: number;
  text: string;
  topVotedNotes: { text: string; col: string; votes: number }[];
  actionCount: number;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  format: FormatId;
  participantNames: string[];
  noteCount: number;
  actionCount: number;
  summary: RetrospectiveSummary | null;
  actions: Action[];
}

export interface Room {
  code: string;
  step: Step;
  format: FormatId;
  participants: Record<string, Participant>;
  notes: Record<string, Note>;
  clusters: Record<string, Cluster>;
  votes: Record<string, Vote>;
  actions: Record<string, Action>;
  summary: RetrospectiveSummary | null;
  history: HistoryEntry[];
  createdAt: number;
}
