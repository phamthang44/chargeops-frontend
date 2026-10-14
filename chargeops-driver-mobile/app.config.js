const { expo } = require('./app.json');

module.exports = {
  ...expo,
  extra: {
    ...expo.extra,
    mapBoxPublicKey: process.env.MAP_BOX_PUBLIC_KEY || '',
  },
};
