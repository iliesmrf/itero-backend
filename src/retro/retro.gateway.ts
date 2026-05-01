import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RetroService } from './retro.service';
import { AuthService } from '../auth/auth.service';
import { Priority, Step } from './retro.types';
import { FormatId } from './retro.formats';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://itero.mantiq.fr:5173', credentials: true },
})
export class RetroGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private socketMeta = new Map<string, { room: string; name: string; avatar: string }>();

  constructor(
    private readonly retroService: RetroService,
    private readonly authService: AuthService,
  ) {}

  // ── Connection ────────────────────────────────────────────────────────────
  handleConnection(client: Socket) {
    const token = client.handshake?.auth?.token || client.handshake?.query?.token;
    if (!token) { client.emit('error', { message: 'Authentification requise' }); client.disconnect(); return; }
    const payload = this.authService.verify(String(token));
    if (!payload) { client.emit('error', { message: 'Token invalide' }); client.disconnect(); return; }
    (client as any).user = payload;
  }

  handleDisconnect(client: Socket) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const room = this.retroService.leaveRoom(meta.room, meta.name);
    if (room) {
      this.broadcast(meta.room, 'room:updated', room);
      this.broadcast(meta.room, 'participant:left', { name: meta.name });
    }
    this.socketMeta.delete(client.id);
  }

  private broadcast(roomCode: string, event: string, payload: any) {
    this.server.to(roomCode).emit(event, payload);
  }
  private err(client: Socket, message: string) { client.emit('error', { message }); }
  private getUser(client: Socket): { name: string; avatar: string } | null {
    const user = (client as any).user;
    return user ? { name: user.name, avatar: user.avatar || '' } : null;
  }

  // ── Room ──────────────────────────────────────────────────────────────────
  @SubscribeMessage('room:create')
  async handleCreateRoom(@ConnectedSocket() client: Socket) {
    const user = this.getUser(client);
    if (!user) return this.err(client, 'Non authentifié');
    const room = await this.retroService.createRoom();
    const result = await this.retroService.joinRoom(room.code, user.name, user.avatar);
    if (!result) return this.err(client, 'Erreur création');
    client.join(room.code);
    this.socketMeta.set(client.id, { room: room.code, name: user.name, avatar: user.avatar });
    client.emit('room:joined', { room: result.room, me: result.participant });
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { code: string }) {
    const user = this.getUser(client);
    if (!user) return this.err(client, 'Non authentifié');
    const code = data?.code?.trim().toUpperCase();
    if (!code) return this.err(client, 'Code requis');
    if (!(await this.retroService.roomExists(code))) return this.err(client, 'Salle introuvable');
    const result = await this.retroService.joinRoom(code, user.name, user.avatar);
    if (!result) return this.err(client, 'Erreur rejoindre');
    client.join(code);
    this.socketMeta.set(client.id, { room: code, name: user.name, avatar: user.avatar });
    client.emit('room:joined', { room: result.room, me: result.participant });
    this.broadcast(code, 'participant:joined', result.participant);
  }

  // ── Format ────────────────────────────────────────────────────────────────
  @SubscribeMessage('format:set')
  async handleSetFormat(@ConnectedSocket() client: Socket, @MessageBody() data: { format: FormatId }) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const room = await this.retroService.setFormat(meta.room, data.format);
    if (!room) return this.err(client, 'Format invalide');
    this.broadcast(meta.room, 'format:changed', { format: data.format, room });
  }

  // ── Step ──────────────────────────────────────────────────────────────────
  @SubscribeMessage('step:set')
  async handleSetStep(@ConnectedSocket() client: Socket, @MessageBody() data: { step: Step }) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const room = await this.retroService.setStep(meta.room, data.step);
    if (!room) return;
    this.broadcast(meta.room, 'step:changed', { step: data.step });
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  @SubscribeMessage('note:add')
  async handleAddNote(@ConnectedSocket() client: Socket, @MessageBody() data: { text: string; col: string }) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.text?.trim()) return;
    const note = await this.retroService.addNote(meta.room, data.text, data.col, meta.name);
    if (!note) return;
    this.broadcast(meta.room, 'note:added', note);
  }

  @SubscribeMessage('note:delete')
  async handleDeleteNote(@ConnectedSocket() client: Socket, @MessageBody() data: { noteId: string }) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const ok = await this.retroService.deleteNote(meta.room, data.noteId, meta.name);
    if (!ok) return this.err(client, 'Suppression non autorisée');
    this.broadcast(meta.room, 'note:deleted', { noteId: data.noteId });
  }

  // ── Auto-cluster ──────────────────────────────────────────────────────────
  @SubscribeMessage('cluster:auto')
  async handleAutoClusters(@ConnectedSocket() client: Socket) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const clusters = await this.retroService.autoClusters(meta.room);
    if (!clusters) return this.err(client, 'Erreur clustering');
    // Also send updated notes (with clusterId)
    const room = await this.retroService.getRoom(meta.room);
    this.broadcast(meta.room, 'clusters:updated', { clusters, notes: room?.notes });
  }

  // ── Votes ─────────────────────────────────────────────────────────────────
  @SubscribeMessage('vote:cast')
  async handleCastVote(@ConnectedSocket() client: Socket, @MessageBody() data: { noteId: string }) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const room = await this.retroService.castVote(meta.room, meta.name, data.noteId);
    if (!room) return this.err(client, 'Plus de votes disponibles');
    this.broadcast(meta.room, 'votes:updated', room.votes);
  }

  @SubscribeMessage('vote:remove')
  async handleRemoveVote(@ConnectedSocket() client: Socket, @MessageBody() data: { noteId: string }) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const room = await this.retroService.removeVote(meta.room, meta.name, data.noteId);
    if (!room) return;
    this.broadcast(meta.room, 'votes:updated', room.votes);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  @SubscribeMessage('action:add')
  async handleAddAction(@ConnectedSocket() client: Socket, @MessageBody() data: { text: string; owner: string; date: string; priority: Priority }) {
    const meta = this.socketMeta.get(client.id);
    if (!meta || !data?.text?.trim()) return;
    const action = await this.retroService.addAction(meta.room, data.text, data.owner || '', data.date || '', data.priority || 'medium', meta.name);
    if (!action) return;
    this.broadcast(meta.room, 'action:added', action);
  }

  @SubscribeMessage('action:delete')
  async handleDeleteAction(@ConnectedSocket() client: Socket, @MessageBody() data: { actionId: string }) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const ok = await this.retroService.deleteAction(meta.room, data.actionId);
    if (!ok) return;
    this.broadcast(meta.room, 'action:deleted', { actionId: data.actionId });
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  @SubscribeMessage('summary:generate')
  async handleGenerateSummary(@ConnectedSocket() client: Socket) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    client.emit('summary:generating', {});
    const summary = await this.retroService.generateSummary(meta.room);
    if (!summary) return this.err(client, 'Erreur génération résumé');
    this.broadcast(meta.room, 'summary:ready', summary);
  }

  @SubscribeMessage('history:get')
  async handleGetHistory(@ConnectedSocket() client: Socket) {
    const meta = this.socketMeta.get(client.id);
    if (!meta) return;
    const history = await this.retroService.getHistory(meta.room);
    client.emit('history:data', history || []);
  }
}
