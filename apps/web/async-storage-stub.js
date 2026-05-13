/** Stub for MetaMask SDK web builds that optionally import RN async-storage. */
module.exports = {
  __esModule: true,
  default: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
    mergeItem: async () => {},
    clear: async () => {},
    getAllKeys: async () => [],
    multiGet: async () => [],
    multiSet: async () => [],
    multiRemove: async () => {},
  },
};
