const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');

// Simpan informasi percobaan login yang gagal di dalam objek untuk setiap email
const failedLoginAttempts = {};
const loginAttemptResetTime = 30 * 60 * 1000;

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middleware
 * @returns {object} Response object or pass an error to the next route
 */
async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    // Periksa jumlah percobaan login yang gagal untuk email yang diberikan
    const loginAttempts = failedLoginAttempts[email] || 0;

    // Jika jumlah percobaan melebihi batas, kirimkan pesan kesalahan
    if (loginAttempts >= 5) {
      throw errorResponder(
        errorTypes.FORBIDDEN,
        'Too many failed login attempts. Try again later 30min.'
      );
    }

    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      // Tambahkan ke jumlah percobaan login yang gagal jika login tidak berhasil
      failedLoginAttempts[email] = loginAttempts + 1;
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Wrong email or password'
      );
    }

    // Reset jumlah percobaan login yang gagal jika login berhasil
    failedLoginAttempts[email] = 0;

    // Atur ulang percobaan login yang gagal setelah 30 menit
    setTimeout(() => {
      failedLoginAttempts[email] = 0; // Atur ulang jumlah percobaan login ke 0 setelah 30 menit
    }, loginAttemptResetTime);

    // Kirimkan respons jika login berhasil
    return response.status(200).json(loginSuccess);
  } catch (error) {
    // Tangani kesalahan dan lemparkan ke middleware selanjutnya
    return next(error);
  }
}

module.exports = {
  login,
};
