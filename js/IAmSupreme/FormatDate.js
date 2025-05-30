class FormatDate{
  constructor() {
  }
  /**
   * @param {Date} date 
   */
  static formatDateToSQL(date) {
    const pad = num => num.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  /**
   * @param {string} sqlDate 
   */
  static sqlToJsDate(sqlDate) {
    // SQL date format: YYYY-MM-DD hh:mm:ss
    const [datePart, timePart] = sqlDate.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = (timePart || "00:00:00").split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  }

  /**
   * @param {Date} date 
   */
  static getStartofDay(date) {
    // Set startT to the start of the day
    date.setHours(0, 0, 0, 0);
    return FormatDate.formatDateToSQL(date);
  }
  /**
   * @param {Date} date 
   */
  static getEndOfDay(date) {
    // Set endT to the end of the day
    date.setHours(23, 59, 59, 999);
    
    return FormatDate.formatDateToSQL(date);
  }
  
  /**
   * @param {string} sqlDate 
   * @param {number} timezoneOffset 
   */
  static toUTCDate(sqlDate, timezoneOffset) {
    // Convert SQL date to JavaScript Date object
    const originalDate = FormatDate.sqlToJsDate(sqlDate);

    const gmtDate = new Date(originalDate.getTime() + (timezoneOffset + new Date().getTimezoneOffset()) * 60 * 1000); // note the time is set with your current timezone, so in order to get only utc, we take out your current timezone too.
    // 2024-12-31 10:20 will be set at your timezone so if your time zone is +2 expected 2 hours in result
    const gmtSQLDate = FormatDate.formatDateToSQL(gmtDate);

    return [
      gmtDate,
      gmtSQLDate
    ];
  }
  
  /**
   * @param {string} sqlDate 
   * @param {number} timezoneOffset 
   */
  static toLocalDate(sqlDate, timezoneOffset) {
    // Convert SQL date to JavaScript Date object
    const originalDate = FormatDate.sqlToJsDate(sqlDate);

    const localDate = new Date(originalDate.getTime() + (timezoneOffset * 60 * 1000)); // 
    const localSQLDate = FormatDate.formatDateToSQL(localDate);

    return [
      localDate,
      localSQLDate
    ];
  }

}
// Example:
/*
const sqlDate = '2024-09-28 5:30:00';
const timezoneOffset = -60; // Offset for UTC+1 timezone (Cameroon)
const utcD = FormatDate.toUTCDate(sqlDate, timezoneOffset);
const localD = FormatDate.toLocalDate(sqlDate, timezoneOffset);

console.log('GMT SQL Date:', utcD); // Output: GMT SQL Date: 2024-09-28 15:30:00
console.log('Local SQL Date:', localD); // Output: Local SQL Date: e.g., 2024-09-28 20:30:00 (depending on your current timezone)
*/