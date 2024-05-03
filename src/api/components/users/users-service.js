const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');
const { Minibank } = require('../../../models');
const { balance } = require('../../../models/minibanks-schema');

async function getUsers(page_number, page_size, sort = 'email:asc', search) {
  try {
    const skip = (page_number - 1) * page_size;
    const users = await usersRepository.getUsers(page_size, skip, sort, search);
    const total_count = await usersRepository.getUserCount(search);
    const total_pages = Math.ceil(total_count / page_size);
    return {
      page_number: parseInt(page_number),
      page_size: parseInt(page_size),
      count: users.length,
      total_pages,
      has_previous_page: page_number > 1,
      has_next_page: page_number < total_pages,
      data: users,
    };
  } catch (error) {
    throw new Error(`Failed to get users: ${error.message}`);
  }
}
/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

async function createUser(name, email, password) {
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}

async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  if (!user) {
    return null;
  }

  try {
    await usersRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

async function deleteUser(id) {
  const user = await usersRepository.getUser(id);

  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteUser(id);
  } catch (err) {
    return null;
  }

  return true;
}

async function emailIsRegistered(email) {
  const user = await usersRepository.getUserByEmail(email);
  return !!user;
}

async function checkPassword(userId, password) {
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);
  const changeSuccess = await usersRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}

async function createUserMinibank(name, email, password, balance, telp) {
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUserMinibank(
      name,
      email,
      hashedPassword,
      balance,
      telp
    );
  } catch (err) {
    return null;
  }

  return true;
}
async function getminibanktelp(email, password) {
  const user = await usersRepository.getUserMinibankByEmail(email);    

  // Periksa apakah pengg  una ditemukan
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Periksa apakah kata sandi cocok
  const passwordMatch = await passwordMatched(password, user.password);
  if (!passwordMatch) {
    throw new Error('Invalid email or password');
  }

  // Jika pengguna dan kata sandi valid, kembalikan nomor telepon dan saldo
  return {
    telp: user.telp,
  };
}
async function updateminibanktelp(id, email, password, telpbaru) {
  const user = await usersRepository.getminibanktelp(id);

  if (!user) {
    return null;
  }
  let telp = telpbaru;
  try {
    await usersRepository.changetelp(id, telp);
  } catch (err) {
    return null;
  }

  return telp;
}
async function deleteminibank(id) {
  const user = await usersRepository.deleteminibank(id);

  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteminibank    (id);
  } catch (err) {
    return null;
  }

  return true;
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
  createUserMinibank,
  getminibanktelp,
  updateminibanktelp,
  deleteminibank,
};
