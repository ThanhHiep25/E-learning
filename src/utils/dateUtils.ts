import { formatDistanceToNow, format, parseISO, type Locale } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Safely format a date string using formatDistanceToNow
 * @param dateStr The date string to format
 * @param options Options for formatting
 * @returns Formatted string or a default fallback
 */
export const safeFormatDistanceToNow = (
  dateStr: string | Date | null | undefined, 
  options: { addSuffix?: boolean; locale?: Locale } = { addSuffix: true, locale: vi }
): string => {
  if (!dateStr) return 'vừa xong';
  
  try {
    let date: Date;
    if (dateStr instanceof Date) {
      date = dateStr;
    } else if (typeof dateStr === 'string') {
      // Try parseISO first as it's more reliable for ISO strings
      date = parseISO(dateStr);
      // If parseISO fails, try new Date()
      if (isNaN(date.getTime())) {
        date = new Date(dateStr);
      }
    } else {
      return 'vừa xong';
    }
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateStr);
      return 'vừa xong';
    }
    
    return formatDistanceToNow(date, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'vừa xong';
  }
};

/**
 * Safely format a date string using format
 * @param dateStr The date string to format
 * @param formatStr The format string
 * @param options Options for formatting
 * @returns Formatted string or a default fallback
 */
export const safeFormat = (
  dateStr: string | Date | null | undefined,
  formatStr: string = 'dd/MM/yyyy',
  options: { locale?: Locale } = { locale: vi }
): string => {
  if (!dateStr) return '';
  
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return format(date, formatStr, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};
