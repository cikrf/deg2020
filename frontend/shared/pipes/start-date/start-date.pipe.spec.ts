import { MomentDatePipe } from './start-date.pipe';

describe('MomentDatePipe', () => {
  it('create an instance', () => {
    const pipe = new MomentDatePipe();
    expect(pipe).toBeTruthy();
  });
});
