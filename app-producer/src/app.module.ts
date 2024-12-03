// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProducerService } from './producer.service';

@Module({
  controllers: [AppController],
  providers: [ProducerService],
})
export class AppModule {}