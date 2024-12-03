// src/app.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  @MessagePattern('message_print')
  handleMessage(@Payload() data: any) {
    console.log('Received message:', data);
    return 'Message received by Consumer!';
  }
}