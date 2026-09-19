import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from '@phosphor-icons/react';
import { notificationsApi } from '../../api/resources';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 60000,
  });

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const handleOpen = () => setOpen(o => !o);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={handleOpen}
        className="relative grid place-items-center w-9 h-9 rounded-md bg-transparent text-neutral-400 border border-divider cursor-pointer hover:text-accent-300 hover:border-accent-700"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent-400 text-[10px] leading-4 text-center text-neutral-900 font-medium">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="card absolute right-0 mt-2 w-80 z-40 shadow-lg p-2 max-h-96 overflow-auto">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="font-heading text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button type="button" className="text-accent text-xs cursor-pointer" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 && (
              <div className="text-center text-neutral-500 text-sm py-6">You're all caught up.</div>
            )}
            {notifications.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className="w-full text-left px-2 py-2 rounded-md hover:bg-accent-900/40 cursor-pointer"
                style={{ opacity: n.readAt ? 0.55 : 1 }}
              >
                <div className="text-sm">{n.title}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{n.body}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
