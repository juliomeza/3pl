
/**
 * Date utilities for the application
 * Provides consistent date handling across AI assistant and dashboard components
 */

export interface DateContext {
  today: string; // YYYY-MM-DD format
  currentYear: number;
  currentMonth: number;
  currentDay: number;
  currentTimestamp: Date;
}

/**
 * Get current date context for the application
 */
export function getCurrentDateContext(): DateContext {
  const now = new Date();
  return {
    today: now.toISOString().split('T')[0], // YYYY-MM-DD format
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth() + 1, // JavaScript months are 0-indexed
    currentDay: now.getDate(),
    currentTimestamp: now
  };
}

/**
 * Get date range for common time periods
 */
export function getDateRange(period: 'last30days' | 'last90days' | 'thisMonth' | 'thisYear' | 'lastMonth' | 'lastYear' | 'today' | 'last6months'): { startDate: string; endDate: string } {
  const { today, currentYear, currentMonth } = getCurrentDateContext();
  const now = new Date();

  switch (period) {
    case 'today':
      return { startDate: today, endDate: today };

    case 'last30days': {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return {
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today
      };
    }
    
    case 'last90days': {
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      return {
        startDate: ninetyDaysAgo.toISOString().split('T')[0],
        endDate: today
      };
    }

    case 'last6months': {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setDate(1); // Set to the first day of the current month before subtracting
      sixMonthsAgo.setMonth(now.getMonth() - 5);
      return {
        startDate: sixMonthsAgo.toISOString().split('T')[0],
        endDate: today
      };
    }

    case 'thisMonth': {
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: today
      };
    }

    case 'thisYear': {
      const startOfYear = new Date(currentYear, 0, 1);
      return {
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: today
      };
    }

    case 'lastMonth': {
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const startOfLastMonth = new Date(lastMonthYear, lastMonth - 1, 1);
      const endOfLastMonth = new Date(lastMonthYear, lastMonth, 0); // Day 0 = last day of previous month
      return {
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0]
      };
    }

    case 'lastYear': {
      const lastYear = currentYear - 1;
      const startOfLastYear = new Date(lastYear, 0, 1);
      const endOfLastYear = new Date(lastYear, 11, 31);
      return {
        startDate: startOfLastYear.toISOString().split('T')[0],
        endDate: endOfLastYear.toISOString().split('T')[0]
      };
    }

    default:
      return { startDate: today, endDate: today };
  }
}

/**
 * Format date for display in UI
 */
export function formatDisplayDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
}

/**
 * Get SQL date filter for PostgreSQL queries
 */
export function getSqlDateFilter(column: string, period: 'last30days' | 'thisMonth' | 'thisYear' | 'lastMonth' | 'lastYear' | 'today'): string {
  const { startDate, endDate } = getDateRange(period);
  
  if (period === 'today') {
    return `DATE(${column}) = '${startDate}'`;
  }
  
  return `DATE(${column}) BETWEEN '${startDate}' AND '${endDate}'`;
}

/**
 * Check if a date string is valid
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
