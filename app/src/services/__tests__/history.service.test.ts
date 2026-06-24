import { beforeEach, describe, expect, it } from 'vitest';
import { historyService } from '@/services/history.service';

describe('historyService scroll positions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('supports string content ids and updates scroll position without duplicates', () => {
    historyService.addEntry(null, {
      content_type: 'news',
      content_id: 'abc',
      title: 'News item',
    });

    historyService.updateScrollPosition(null, 'news', 'abc', 320);

    const history = historyService.getHistory(null);
    expect(history).toHaveLength(1);
    expect(history[0].scrollY).toBe(320);
  });

  it('matches numeric and string ids when updating existing entries', () => {
    historyService.addEntry(null, {
      content_type: 'article',
      content_id: 42,
      title: 'Article',
    });

    historyService.updateScrollPosition(null, 'article', '42', 180);

    const entry = historyService.getEntry(null, 'article', 42);
    expect(entry?.scrollY).toBe(180);
  });

  it('preserves previous scroll position when re-adding the same entry', () => {
    historyService.addEntry(null, {
      content_type: 'post',
      content_id: 7,
      title: 'Post',
    });
    historyService.updateScrollPosition(null, 'post', 7, 540);

    historyService.addEntry(null, {
      content_type: 'post',
      content_id: 7,
      title: 'Post renamed',
    });

    const history = historyService.getHistory(null);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ title: 'Post renamed', scrollY: 540 });
  });
});
