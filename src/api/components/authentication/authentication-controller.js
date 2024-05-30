const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    // Check login credentials
    //Mengecek email apakah sudah mencapai batas login
    if (loginAttempts[email] && loginAttempts[email].count >= 5) {
      const currentTime = new Date();
          const lastAttemptTime = loginAttempts[email].lastAttempt;
            const timeDiff = Math.floor((currentTime - lastAttemptTime)/(1000 * 60)); 

            // If last attempt was within 30 minutes, return error
   if (timeDiff < 30) {
     throw errorResponder(
   errorTypes.FORBIDDEN,
 'terlalu banyak gagal saat login,coba lagi 30 menit kedepan.'
);
} else {
  // If last attempt was more than 30 minutes ago, reset the attempt count
  loginAttempts[email].count = 0;
}
    }
    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      // Increment login attempt count
   if (!loginAttempts[email]) {
    loginAttempts[email] = { count: 1, lastAttempt: new Date() };
      } else {
       loginAttempts[email].count++;
        loginAttempts[email].lastAttempt = new Date();
     }
     // If login attempt reaches limit, return error
     if (loginAttempts[email].count >= 5) {
      throw errorResponder(
          errorTypes.FORBIDDEN,
          'terlalu banyak gagal login,coba lagi.'
        );
      }
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Wrong email or password'
      );
    }
 // Reset login attempt count on successful login
 delete loginAttempts[email];
 
    return response.status(200).json(loginSuccess);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
};
