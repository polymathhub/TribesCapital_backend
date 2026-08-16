import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDDDocumentDto, QueryDDDto } from './due-diligence.dto';

describe('CreateDDDocumentDto', () => {
  it('allows document uploads without an explicit category', async () => {
    const dto = new CreateDDDocumentDto();
    dto.fileName = 'summary.pdf';
    dto.fileUrl = '/uploads/summary.pdf';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});

describe('QueryDDDto', () => {
  it('converts numeric query parameters from strings into numbers', async () => {
    const dto = plainToInstance(QueryDDDto, {
      page: '2',
      limit: '50',
      status: 'approved',
    });

    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
