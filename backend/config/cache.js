const NodeCache = require('node-cache');

// TTL of 3600s (1 hour) for live location entries
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

module.exports = { cache };
