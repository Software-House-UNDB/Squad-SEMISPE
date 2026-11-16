import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 5 }],
      errorMessage:
        'Muitas solicitações. Aguarde um minuto antes de tentar novamente.',
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
