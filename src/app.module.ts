import { Module } from '@nestjs/common';
import { ArdisAdapterModule } from './ardis-adapter/ardis-adapter.module';

@Module({
  imports: [ArdisAdapterModule],
})
export class AppModule {}
