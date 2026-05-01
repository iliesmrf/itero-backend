import { Module } from '@nestjs/common';
import { RetroModule } from './retro/retro.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, RetroModule],
})
export class AppModule {}
