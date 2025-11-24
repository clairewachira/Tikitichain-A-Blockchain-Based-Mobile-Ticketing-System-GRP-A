import { Event } from "@/types/event";

export function getEventsThisMonth(events: Event[]): Event[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return events
    .filter((event) => {
      const eventDate = new Date(event.time);
      return (
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      );
    })
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}
