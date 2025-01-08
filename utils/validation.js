/**
 * Checks the string for a valid e-mail address
 * @param {String} email - String to be checked
 * @returns {Boolean}
 */
function isValidEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9._%-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}


/**
 * Checks the string for a valid phone number (e.g. "+37100000000")
 * @param {String} phone - String to be checked
 * @returns {Boolean}
 */
function isValidPhone(phone) {
  const regex = /^\+[0-9]{1,3}[0-9]{6,14}$/;
  return regex.test(phone);
}

module.exports = { isValidEmail, isValidPhone };