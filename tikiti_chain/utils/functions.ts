export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type TimeFormatOptions = {
  includeYear?: boolean;
  includeTime?: boolean;
  fullMonth?: boolean;
  onlyTime?: boolean;
};

export function formatTime(
  timestamp: number | string | Date,
  options: TimeFormatOptions = {},
): string {
  const {
    includeYear = false,
    includeTime = false,
    fullMonth = false,
    onlyTime = false,
  } = options;

  let date: Date;
  try {
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "string") {
      const trimmed = timestamp.trim();
      if (trimmed === "") throw new Error("Empty timestamp string");

      if (/^\d+$/.test(trimmed)) {
        const numTimestamp = parseInt(trimmed, 10);
        date = new Date(
          numTimestamp > 1e10 ? numTimestamp : numTimestamp * 1000,
        );
      } else {
        date = new Date(trimmed);
      }
    } else if (typeof timestamp === "number") {
      date = new Date(timestamp > 1e10 ? timestamp : timestamp * 1000);
    } else {
      throw new Error("Invalid timestamp type");
    }

    if (isNaN(date.getTime())) throw new Error("Invalid date");

    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 100)
      throw new Error("Date out of reasonable range");
  } catch {
    return "Invalid date";
  }

  try {
    const now = new Date();
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timeDiff = nowOnly.getTime() - dateOnly.getTime();
    const dayDifference = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    // 🔹 If only time requested
    if (onlyTime) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // 24-hour format
      });
    }

    let baseFormat: string;

    if (dayDifference === 0) {
      // Today
      if (includeTime) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
      return "Today";
    } else if (dayDifference === 1) {
      // Yesterday
      baseFormat = "Yesterday";
      if (includeTime) {
        const timeStr = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        return `${baseFormat} ${timeStr}`;
      }
      return baseFormat;
    } else if (dayDifference > 0 && dayDifference < 7 && !includeYear) {
      // Within the last week
      baseFormat = date.toLocaleDateString([], { weekday: "short" });
      if (includeTime) {
        const timeStr = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        return `${baseFormat} ${timeStr}`;
      }
      return baseFormat;
    } else {
      // Older dates or far future
      const currentYear = now.getFullYear();
      const dateYear = date.getFullYear();

      const day = date.getDate();
      const month = date.toLocaleDateString([], {
        month: fullMonth ? "long" : "short",
      });

      if (includeYear || dateYear !== currentYear) {
        baseFormat = `${day} ${month} ${dateYear}`;
      } else {
        baseFormat = `${day} ${month}`;
      }

      if (includeTime) {
        const timeStr = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        return `${baseFormat} ${timeStr}`;
      }
      return baseFormat;
    }
  } catch {
    return "Invalid date";
  }
}

export function formatTimeWithYear(timestamp: number | string | Date): string {
  return formatTime(timestamp, { includeYear: true });
}

export function formatTimeWithYearAndTime(
  timestamp: number | string | Date,
): string {
  return formatTime(timestamp, { includeYear: true, includeTime: true });
}
