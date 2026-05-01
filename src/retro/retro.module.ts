import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RetroGateway } from './retro.gateway';
import { RetroService } from './retro.service';
import { AuthModule } from '../auth/auth.module';
import { Room, RoomSchema } from './schemas/room.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  providers: [RetroGateway, RetroService],
})
export class RetroModule {}
