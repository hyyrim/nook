import { useCallback, useEffect, useState } from 'react';
import {
  cancelReminder,
  getReminder,
  scheduleReminder,
  type ReminderRecord,
} from './reminders';

/**
 * 콘텐츠 상세 화면에서 사용하는 훅. 현재 콘텐츠의 리마인더 상태를 노출하고
 * 예약/취소 액션을 제공한다. 저장소는 OS pending 큐라 화면 mount 시 조회.
 */
export function useContentReminder(contentId: string | null) {
  const [reminder, setReminder] = useState<ReminderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!contentId) {
      setReminder(null);
      setLoading(false);
      return;
    }
    const current = await getReminder(contentId);
    setReminder(current);
    setLoading(false);
  }, [contentId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const schedule = useCallback(
    async (input: { title: string; remindAt: Date }) => {
      if (!contentId) return null;
      setBusy(true);
      try {
        const record = await scheduleReminder({
          contentId,
          contentTitle: input.title,
          remindAt: input.remindAt,
        });
        setReminder(record);
        return record;
      } finally {
        setBusy(false);
      }
    },
    [contentId],
  );

  const cancel = useCallback(async () => {
    if (!contentId) return;
    setBusy(true);
    try {
      await cancelReminder(contentId);
      setReminder(null);
    } finally {
      setBusy(false);
    }
  }, [contentId]);

  return { reminder, loading, busy, schedule, cancel, refresh };
}
