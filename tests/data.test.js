import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidTaskList } from '../js/data.js';

describe('data (real module)', () => {
  it('isValidTaskList sprejme veljaven seznam', () => {
    const tasks = [{ id: 'a', title: 'T', description: 'D', tag: 'tag' }];
    assert.equal(isValidTaskList(tasks), true);
  });

  it('isValidTaskList zavrne prazen seznam? ne, prazen je veljaven', () => {
    assert.equal(isValidTaskList([]), true);
  });

  it('isValidTaskList zavrne ne-array', () => {
    assert.equal(isValidTaskList(null), false);
    assert.equal(isValidTaskList('str'), false);
    assert.equal(isValidTaskList(42), false);
  });

  it('isValidTaskList zavrne task brez id', () => {
    const tasks = [{ title: 'T', description: 'D', tag: 'tag' }];
    assert.equal(isValidTaskList(tasks), false);
  });

  it('isValidTaskList zavrne task s praznim id', () => {
    const tasks = [{ id: '', title: 'T', description: 'D', tag: 'tag' }];
    assert.equal(isValidTaskList(tasks), false);
  });
});
