import { PipeTransform, Injectable, BadRequestException, ValidationError } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: any) {
    if (!metadata.type) {
      return value;
    }

    const object = plainToInstance(metadata.type, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map((error: ValidationError) => ({
        field: error.property,
        messages: Object.values(error.constraints || {}),
      }));

      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }

    return object;
  }
}
