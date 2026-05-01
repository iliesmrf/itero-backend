import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Step, Note, Cluster, Action, Participant, RetrospectiveSummary, HistoryEntry } from '../retro.types';
import { FormatId } from '../retro.formats';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ type: Number, default: 0 })
  step: Step;

  @Prop({ type: String, default: 'start-stop-continue' })
  format: FormatId;

  @Prop({ type: Object, default: {} })
  participants: Record<string, Participant>;

  @Prop({ type: Object, default: {} })
  notes: Record<string, Note>;

  @Prop({ type: Object, default: {} })
  clusters: Record<string, Cluster>;

  @Prop({ type: Object, default: {} })
  votes: Record<string, Record<string, number>>;

  @Prop({ type: Object, default: {} })
  actions: Record<string, Action>;

  @Prop({ type: Object, default: null })
  summary: RetrospectiveSummary | null;

  @Prop({ type: Array, default: [] })
  history: HistoryEntry[];

  @Prop({ type: Date, default: Date.now })
  createdAt: number;

  // TTL index - rooms expire after 24 hours
  @Prop({ type: Date, expires: 86400, default: Date.now })
  expiresAt: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

// Create indexes
RoomSchema.index({ code: 1 });
RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
