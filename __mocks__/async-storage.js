// Mock for AsyncStorage
let storage = {};

module.exports = {
  getItem: jest.fn((key) => Promise.resolve(storage[key] || null)),
  setItem: jest.fn((key, value) => {
    storage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    delete storage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    storage = {};
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(storage))),
  multiGet: jest.fn((keys) =>
    Promise.resolve(keys.map((key) => [key, storage[key] || null]))
  ),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([key, value]) => {
      storage[key] = value;
    });
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((key) => {
      delete storage[key];
    });
    return Promise.resolve();
  }),
};
