// src/producer.service.ts
import { Injectable } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class ProducerService {
    private client: ClientProxy;

    constructor() {
        this.client = ClientProxyFactory.create({
            transport: Transport.RMQ,
            options: {
                urls: [process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672'],
                queue: 'main_queue',
                queueOptions: {
                    durable: false,
                },
            },
        });
    }

    sendMessage(pattern: string, data: any) {
        return this.client.send(pattern, data).toPromise();
    }
}