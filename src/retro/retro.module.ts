import { Module } from '@nestjs/common';
import { RetroGateway } from './retro.gateway';
import { RetroService } from './retro.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [RetroGateway, RetroService],
})
export class RetroModule {}
