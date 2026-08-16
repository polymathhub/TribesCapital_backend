import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  it('returns an empty list when the database is unavailable', async () => {
    const prisma = {
      isDatabaseAvailable: () => false,
      course: {
        findMany: jest.fn(),
      },
    } as any;

    const service = new CoursesService(prisma);

    await expect(service.findAll(0, 8)).resolves.toEqual([]);
    expect(prisma.course.findMany).not.toHaveBeenCalled();
  });
});
