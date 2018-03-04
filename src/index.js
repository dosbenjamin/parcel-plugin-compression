const compress = require('./compress');

module.exports = bundler => {
  const { outDir } = bundler.options;

  if (process.env.NODE_ENV === 'production') {
    bundler.on('buildEnd', () => {
      compress(outDir);
    });
  }
};
