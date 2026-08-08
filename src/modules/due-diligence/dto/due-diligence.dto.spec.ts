import { validate } from 'class-validator';
import { CreateDDDocumentDto } from './due-diligence.dto';

describe('CreateDDDocumentDto', () => {
  it('allows document uploads without an explicit category', async () => {
    const dto = new CreateDDDocumentDto();
    dto.fileName = 'summary.pdf';
    dto.fileUrl = '/uploads/summary.pdf';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
