import { getResumeLessonIndex } from '../../../frontend/src/utils/learningHubProgress';

describe('learning hub resume logic', () => {
  it('returns the last visited lesson when it is still incomplete', () => {
    const lessons = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];

    expect(getResumeLessonIndex(lessons, [], 1, 'two')).toBe(1);
  });

  it('falls back to the first incomplete lesson when the last visited lesson is already completed', () => {
    const lessons = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];

    expect(getResumeLessonIndex(lessons, ['two'], 1, 'two')).toBe(2);
  });
});
