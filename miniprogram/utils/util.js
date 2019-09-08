/**
 * 工具类 util.js
 */
class Util {
  static formatTime(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
 
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
 
    //return [year, month, day].map(this.formatNumber).join('-') + ' ' + [hour, minute, second].map(this.formatNumber).join(':');
    return [hour, minute, second].map(this.formatNumber).join(':');
  };

  static formatDate(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    return [year, month, day].map(this.formatNumber).join('-');
  };

  static formatHour(date) {
    let hour = date.getHours();

    return this.formatNumber(hour);
  };

  static formatMinute(date) {
    let minute = date.getMinutes();

    return this.formatNumber(minute);
  };

  static formatSeconds(date) {
    let second = date.getSeconds();

    return this.formatNumber(second);
  };

  static formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
  };
};
 
module.exports = Util;
