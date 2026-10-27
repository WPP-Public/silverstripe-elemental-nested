export default {
  _t: (key, fallback) => fallback,
  inject: (message, values) => message.replace(/{(\w+)}/g, (match, key) => values[key] ?? match),
};
