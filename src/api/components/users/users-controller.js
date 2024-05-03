const { User } = require('../../../models');
const { errorResponder, errorTypes } = require('../../../core/errors');
const usersService = require('./users-service');

/**
 * Handle get list of users request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUsers(request, response, next) {
  try {
    // Terima query parameters
    const {
      page_number = 1,
      page_size = 10,
      sort = 'email:asc',
      search,
    } = request.query;

    // Lakukan filtering berdasarkan query search (jika ada)
    let filter = {};
    if (search) {
      const [columnName, searchValue] = search.split(':');
      if (columnName && searchValue) {
        filter = { [columnName]: { $regex: searchValue, $options: 'i' } };
      }
    }

    // Lakukan sorting berdasarkan query sort
    let sortField = 'email';
    let sortOrder = 1;
    if (sort) {
      const [field, order] = sort.split(':');
      sortField = field;
      sortOrder = order === 'desc' ? -1 : 1;
    }
    const sortOptions = { [sortField]: sortOrder };

    // Hitung jumlah total data
    const count = await User.countDocuments(filter);

    // Hitung jumlah total halaman
    const total_pages = Math.ceil(count / page_size);

    // Hitung apakah ada halaman sebelumnya dan halaman berikutnya
    const has_previous_page = page_number > 1;
    const has_next_page = page_number < total_pages;

    // Ambil data sesuai dengan pagination
    const skip = (page_number - 1) * page_size;
    const users = await User.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(page_size));

    // Kirimkan response sesuai dengan format yang diminta
    response.json({
      page_number: parseInt(page_number),
      page_size: parseInt(page_size),
      count,
      total_pages,
      has_previous_page,
      has_next_page,
      data: users,
    });
  } catch (error) {
    // Tangani error jika terjadi
    return next(error);
  }
}

/**
 * Handle get user detail request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUser(request, response, next) {
  try {
    const user = await usersService.getUser(request.params.id);

    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    return response.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle create user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function createUser(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;

    // Check confirmation password
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.createUser(name, email, password);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }
    return response.status(200).json({ name, email });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle update user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function updateUser(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.updateUser(id, name, email);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to update user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle delete user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function deleteUser(request, response, next) {
  try {
    const id = request.params.id;

    const success = await usersService.deleteUser(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle change user password request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function changePassword(request, response, next) {
  try {
    // Check password confirmation
    if (request.body.password_new !== request.body.password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Check old password
    if (
      !(await usersService.checkPassword(
        request.params.id,
        request.body.password_old
      ))
    ) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong password');
    }

    const changeSuccess = await usersService.changePassword(
      request.params.id,
      request.body.password_new
    );

    if (!changeSuccess) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to change password'
      );
    }

    return response.status(200).json({ id: request.params.id });
  } catch (error) {
    return next(error);
  }
}
/**
 * Handle create user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function createUserMinibank(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;
    const balance = request.body.balance;
    const telp = request.body.telp;

    // Check confirmation password
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.createUserMinibank(
      name,
      email,
      password,
      balance,
      telp
    );
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }
    return response.status(200).json({ name, email });
  } catch (error) {
    return next(error);
  }
}
async function getminibanktelp(request, response, next) {
  try {
    const email = request.body.email;
    const password = request.body.password;

    // Panggil layanan untuk mendapatkan nomor telepon pengguna Minibank berdasarkan ID
    const user = await usersService.getminibanktelp(email, password);

    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    // Kirim nomor telepon sebagai respons
    return response.status(200).json({ telp: user.telp });
  } catch (error) {
    return next(error);
  }
}
async function updateminibanktelp(request, response, next) {
  try {
    const id = request.params.id;
    const password = request.body.password;
    const email = request.body.email;
    const telpbaru = request.body.newtelp;

    const newtelp = await usersService.updateminibanktelp(
      id,
      email,
      password,
      telpbaru
    );

    return response.status(200).json({ telp: newtelp });
  } catch (error) {
    return next(error);
  }
}
async function deleteminibank(request, response, next) {
  try {
    const id = request.params.id;

    const success = await usersService.deleteminibank(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  createUserMinibank,
  getminibanktelp,
  updateminibanktelp,
  deleteminibank,
};
