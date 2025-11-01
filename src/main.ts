import { NestFactory } from '@nestjs/core';
import { LoggerService } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = new DocumentBuilder()
    .setTitle('Better Jobs API')
    .setDescription('API for scraping and managing job listings from jobs.ge')
    .setVersion('1.0')
    .addTag('jobs', 'Job scraping and management endpoints')
    .addTag('app', 'Application health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const logger = app.get<LoggerService>(WINSTON_MODULE_NEST_PROVIDER);
  const port = process.env.PORT ?? 3001;
  logger.log(`Application is starting on port ${port}`, {
    context: 'Bootstrap',
  });

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`, {
    context: 'Bootstrap',
  });
  logger.log(`Swagger documentation: http://localhost:${port}/api`, {
    context: 'Bootstrap',
  });
}

void bootstrap();
