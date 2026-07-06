import { PipeTransform, Injectable, BadRequestException, ValidationError, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(ValidationPipe.name);

  private isBuiltInType(metatype: any): boolean {
    return [String, Boolean, Number, Array, Object].includes(metatype);
  }

  private isClassConstructor(metatype: any): boolean {
    return typeof metatype === 'function' && metatype.prototype != null && metatype.prototype.constructor === metatype;
  }

  async transform(value: any, metadata: any) {
    const ctx = '[VALIDATION]';
    const start = Date.now();

    const metaTypeName = metadata?.metatype?.name ?? String(metadata?.metatype ?? '<none>');
    this.logger.log(`${new Date().toISOString()} ${ctx}[1] Entering validation`);
    this.logger.log(`${new Date().toISOString()} ${ctx}[1.1] metadata.type=${String(metadata?.type ?? '<none>')}`);
    this.logger.log(`${new Date().toISOString()} ${ctx}[1.2] metadata.metatype=${metaTypeName}`);
    this.logger.log(`${new Date().toISOString()} ${ctx}[1.3] metadata.data=${String(metadata?.data ?? '<none>')}`);

    const metatype = metadata?.metatype;

    if (!metatype || typeof metatype !== 'function' || this.isBuiltInType(metatype) || !this.isClassConstructor(metatype)) {
      this.logger.log(`${new Date().toISOString()} ${ctx}[2] Skipping validation for built-in, missing, or non-class metatype (duration=${Date.now() - start}ms)`);
      return value;
    }

    let object: any;
    try {
      object = plainToInstance(metatype, value);
      const ctorName = object?.constructor?.name ?? '<no-constructor>';
      this.logger.log(`${new Date().toISOString()} ${ctx}[3] plainToInstance completed, constructor=${ctorName}`);
    } catch (error) {
      this.logger.error(`${new Date().toISOString()} ${ctx}[ERR] plainToInstance failed`, error instanceof Error ? error.stack : String(error));
      throw error;
    }

    let errors: ValidationError[] = [];
    try {
      const validationStart = Date.now();
      errors = await validate(object);
      this.logger.log(`${new Date().toISOString()} ${ctx}[4] validate() completed (duration=${Date.now() - validationStart}ms)`);
    } catch (error) {
      this.logger.error(`${new Date().toISOString()} ${ctx}[ERR] Validation execution failed`, error instanceof Error ? error.stack : String(error));
      throw error;
    }

    if (errors.length > 0) {
      const messages = errors.map((error: ValidationError) => ({
        field: error.property,
        messages: Object.values(error.constraints || {}),
      }));

      this.logger.warn(`${new Date().toISOString()} ${ctx}[ERR] Validation failed for ${metaTypeName}`);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }

    this.logger.log(`${new Date().toISOString()} ${ctx}[5] Validation passed (totalDuration=${Date.now() - start}ms)`);
    return object;
  }
}
