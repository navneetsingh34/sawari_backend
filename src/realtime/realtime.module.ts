import { Module, Global, forwardRef } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { RealtimeGateway } from './realtime.gateway';
import { AuthModule } from '../auth/auth.module'; // Access to JwtService
import { SocketAuthGuard } from './guards/socket-auth.guard';
import { ConfigModule } from '@nestjs/config';
import { RidesModule } from '../rides/rides.module';

@Global() // Make it global so we don't have to import it everywhere?
// Actually, explicitly importing is cleaner architecture usually, but for Relatime which is cross-cutting, Global is easier.
// Let's stick to explicit imports for strict modularity, OR Global for convenience.
// The Plan said "Imports AuthModule... Exports RealtimeService".
// I'll make it Global to simplify the many injections needed in Step 7 Integration.
@Module({
  imports: [AuthModule, ConfigModule, forwardRef(() => RidesModule)],
  providers: [RealtimeService, RealtimeGateway, SocketAuthGuard],
  exports: [RealtimeService],
})
export class RealtimeModule {}
