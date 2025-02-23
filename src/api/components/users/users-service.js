const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');

/**
 * Get list of users
 * @returns {Array}
 */
async function getUsers(page_number, page_size, search, sort) {
  const users = await usersRepository.getUsers();

  let filteredUsers = users;
  if (search) {
    const searchParams = search.split(":");
    const searchField = searchParams[0];
    const searchValue = searchParams[1];

    filteredUsers = users.filter((user) => {
      if (searchField === "name") {
        return user.name.includes(searchValue);
      } else if (searchField === "email") { 
        return user.email.includes(searchValue);
      } else {
        return true; // or throw an error if searchField is not supported
      }
    });
  }
  if (sort) {
    const sortParams = sort.split(":");
    const sortField = sortParams[0];
    const sortOrder = sortParams[1].toLowerCase();

    if (sortOrder!== "asc" && sortOrder!== "desc") {
      throw new Error(`Invalid sort order: ${sortOrder}. Must be "asc" or "desc"`);
    }
    filteredUsers = filteredUsers.sort((a, b) => {
      if (sortField === "name") {
        if (sortOrder === "asc") {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      } else if (sortField === "email") {
        if (sortOrder === "asc") {
          return a.email.localeCompare(b.email);
        } else {
          return b.email.localeCompare(a.email);
        }
      } else {
        throw new Error(`Unsupported sort field: ${sortField}`);
      } 
    });
    }
    const totalCount = filteredUsers.length;
    const startIndex = (page_number - 1) * page_size;
    const endIndex = startIndex + page_size;

    const results = [];
    for (let i = startIndex; i < endIndex && i < filteredUsers.length; i += 1) {
      const user = filteredUsers[i];
      results.push({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }

  return {
  count: totalCount,
  page_number,
  page_size,
  total_pages: Math.ceil(totalCount / page_size),
  results,
};
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

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  // User not found
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

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
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

/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await usersRepository.getUserByEmail(email);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  // Check if user not found
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

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
};
