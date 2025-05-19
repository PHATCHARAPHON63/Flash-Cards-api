class DateUtil {
  static yearCeToBuddhist(year) {
    return year + 543;
  }

  static dateCeToBuddhist(date, separator = '/') {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear() + 543;
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${day}${separator}${month}${separator}${year}`;
  }

  static isEndDateAfterStartDate(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set time to 00:00 to ignore time portion
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return start <= end;
  }

  static selectOnlyDate(date) {
    // Check if the date is a valid Date object
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date provided');
    }

    // Extract the year, month, and day
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    // Create a date string in YYYY-MM-DD format
    const dateFiltered = `${year}-${month}-${day}`;

    // Return a new Date object with time set to 00:00:00 for consistency
    return new Date(dateFiltered + 'T00:00:00Z'); // Ensure UTC time is set to midnight
  }

  static formatDateToUTCString = (date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}T00:00:00.000+00:00`;
  };
  static formatDateToUTCStringEnd = (date) => {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 0);
    
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}T23:59:59.000+00:00`;
  };  
}

module.exports = DateUtil;
