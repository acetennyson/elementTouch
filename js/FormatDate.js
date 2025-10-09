export default class FormatDate {
  static pad(num) {
    return num.toString().padStart(2, '0');
  }

  /**
   * @param {Date} date 
   * @returns {string}
   */
  static formatDateToSQL(date) {
    const { pad } = FormatDate;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  /**
   * @param {string} sqlDate 
   * @returns {Date}
   */
  static sqlToJsDate(sqlDate) {
    const [datePart, timePart = "00:00:00"] = sqlDate.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  }

  /**
   * @param {Date} date 
   * @returns {string}
   */
  static getStartOfDay(date) {
    date.setHours(0, 0, 0, 0);
    return FormatDate.formatDateToSQL(date);
  }

  /**
   * @param {Date} date 
   * @returns {string}
   */
  static getEndOfDay(date) {
    date.setHours(23, 59, 59, 999);
    return FormatDate.formatDateToSQL(date);
  }

  /**
   * @param {string} sqlDate 
   * @param {number} timezoneOffset 
   * @returns {[Date, string]}
   */
  static toUTCDate(sqlDate, timezoneOffset) {
    const originalDate = FormatDate.sqlToJsDate(sqlDate);
    const offsetMinutes = timezoneOffset + new Date().getTimezoneOffset();
    const gmtDate = new Date(originalDate.getTime() + offsetMinutes * 60000);
    return [gmtDate, FormatDate.formatDateToSQL(gmtDate)];
  }

  /**
   * @param {string} sqlDate 
   * @param {number} timezoneOffset 
   * @returns {[Date, string]}
   */
  static toLocalDate(sqlDate, timezoneOffset) {
    const originalDate = FormatDate.sqlToJsDate(sqlDate);
    const localDate = new Date(originalDate.getTime() + timezoneOffset * 60000);
    return [localDate, FormatDate.formatDateToSQL(localDate)];
  }
}
