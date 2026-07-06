import { PipeTransform, Injectable, BadRequestException, ValidationError, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(ValidationPipe.name);
  async transform(value: any, metadata: any) {
    const ctx = `[VALIDATION]`;
    const start = Date.now();
    this.logger.log(`${new Date().toISOString()} ${ctx}[1] Entering validation for type: ${metadata?.metatype?.name ?? 'unknown'}`);
    if (!metadata.type) {
      this.logger.log(`${new Date().toISOString()} ${ctx}[2] No metadata.type, skipping validation (duration=${Date.now()-start}ms)`);
      return value;
    }
    const object = plainToInstance(metadata.type, value);
    let errors: ValidationError[];
    try {
      errors = await validate(object);
    } catch (e) {
      this.logger.error(`${new Date().toISOString()} ${ctx}[ERR] Validation execution failed`, e instanceof Error ? e.stack : String(e));
      throw e;
    }

    if (errors.length > 0) {
      const messages = errors.map((error: ValidationError) => ({
        field: error.property,
        messages: Object.values(error.constraints || {}),
      }));
      this.logger.warn(`${new Date().toISOString()} ${ctx}[ERR] Validation failed for ${metadata?.metatype?.name ?? 'unknown'}`);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }

    this.logger.log(`${new Date().toISOString()} ${ctx}[3] Validation passed (duration=${Date.now()-start}ms)`);
    return object;
  }
}
