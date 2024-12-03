// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ProducerService } from './producer.service';

@Controller()
export class AppController {
  constructor(private readonly producerService: ProducerService) {}

  @Get('send')
  async sendMessage() {
    const message = { text: 'Hello from Producer!' };
    return this.producerService.sendMessage('message_print', message);
  }
}