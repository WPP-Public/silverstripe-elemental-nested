export default {
  post: jest.fn(() => Promise.resolve({})),
  get: jest.fn(() => Promise.resolve({ json: async () => ({}) })),
};
