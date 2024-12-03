# NestJS RabbitMQ Communication Between Two Applications Using Docker Compose

### Table of Contents

	•	Architecture Overview
	•	Project Setup
	•	1. Create App 1 (Producer)
	•	2. Create App 2 (Consumer)
	•	3. Docker Compose Configuration
	•	4. Running the Applications
	•	5. Testing the Setup
	•	Project Structure

### Architecture Overview

	•	RabbitMQ: Acts as the central message broker.
	•	App 1 (Producer): Sends messages to RabbitMQ.
	•	App 2 (Consumer): Listens to messages from RabbitMQ and processes them.

### Project Setup

Create a folder to hold the two applications:
```bash
mkdir Service_Oriented_Architecture_NestJS_RabbitMQ_2App_Tuto
cd Service_Oriented_Architecture_NestJS_RabbitMQ_2App_Tuto
```

## 1. Create App 1 (Producer)

### Step 1: Initialize the NestJS App
```bash
nest new app-producer
```

Navigate to the app-producer directory:
```bash
cd app-producer
```

### Step 2: Install Dependencies
```bash
npm install --save @nestjs/microservices amqplib
npm install amqp-connection-manager
```

### Step 3: Configure the Producer Service

Edit src/main.ts to set up RabbitMQ:
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // RabbitMQ Producer Microservice
    const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
    const rabbitMQOptions: MicroserviceOptions = {
        transport: Transport.RMQ,
        options: {
            urls: [rabbitMQUrl],
            queue: 'main_queue',
            queueOptions: {
                durable: false,
            },
        },
    };

    await app.listen(3000); // HTTP Endpoint
}

bootstrap();
```

### Step 4: Add the Producer Logic

Create a service to send messages (src/producer.service.ts):
```typescript
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
```

Add the logic to trigger message sending (src/app.controller.ts):

```typescript
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
```

Register the ProducerService in the module (src/app.module.ts):

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProducerService } from './producer.service';

@Module({
    controllers: [AppController],
    providers: [ProducerService],
})
export class AppModule {}
```

## 2. Create App 2 (Consumer)

### Step 1: Initialize the NestJS App
```bash
nest new app-consumer
```

Navigate to the app-consumer directory:
```bash
cd app-consumer
```

### Step 2: Install Dependencies
```bash
npm install --save @nestjs/microservices amqplib
npm install amqp-connection-manager
```

### Step 3: Configure the Consumer Service

Edit src/main.ts to set up RabbitMQ:

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // RabbitMQ Consumer Microservice
    const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
    const rabbitMQOptions: MicroserviceOptions = {
        transport: Transport.RMQ,
        options: {
            urls: [rabbitMQUrl],
            queue: 'main_queue',
            queueOptions: {
                durable: false,
            },
        },
    };

    app.connectMicroservice(rabbitMQOptions);

    await app.startAllMicroservices();
    await app.listen(3001); // HTTP Endpoint (Optional)
}

bootstrap();
```

### Step 4: Add the Consumer Logic

Create a controller to listen for messages (src/app.controller.ts):
```typescript
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
```

## 3. Docker Compose Configuration

### Step 1: Create Dockerfiles
Dockerfile for App 1 (Producer)
```Dockerfile
# Dockerfile for App 1 (Producer)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Expose application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
```

Dockerfile for App 2 (Consumer)
```Dockerfile
# Dockerfile for App 2 (Consumer)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Expose application port (optional for debugging or extra endpoints)
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod"]
```

### Step 2: Configure Docker Compose

Create a docker-compose.yml file in the root of nestjs-rabbitmq-microservices:
```yaml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    healthcheck:
      test: ["CMD", "rabbitmqctl", "status"]
      interval: 10s
      timeout: 5s
      retries: 5

  app-producer:
    build:
      context: ./app-producer
      dockerfile: Dockerfile
    container_name: app-producer
    depends_on:
      rabbitmq:
        condition: service_healthy
    environment:
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    ports:
      - "3000:3000"

  app-consumer:
    build:
      context: ./app-consumer
      dockerfile: Dockerfile
    container_name: app-consumer
    depends_on:
      rabbitmq:
        condition: service_healthy
    environment:
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
    ports:
      - "3001:3001"
```

## 4. Running the Applications

From the nestjs-rabbitmq-microservices root directory, run:
```bash
docker-compose up --build
```

## 5. Testing the Setup

1.	Send a Message: Access http://localhost:3000/send to send a message from App 1 (Producer).
2.	Receive the Message: Observe the logs of App 2 (Consumer) to see the message received.
3.	RabbitMQ Management UI: Visit http://localhost:15672 (username: guest, password: guest) to monitor RabbitMQ queues.


## Steps to run the project
```bash
docker-compose down
```

Project Structure
```
Service_Oriented_Architecture_NestJS_RabbitMQ_2App_Tuto/
├── app-producer/
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── producer.service.ts
│   ├── package.json
│   ├── tsconfig.json
├── app-consumer/
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── main.ts
│   └── package.json
│   └── tsconfig.json
└── docker-compose.yml
```