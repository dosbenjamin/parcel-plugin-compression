const zlib = require('zlib');
const fs = require('fs');
const glob = require('glob');
const brotli = require('brotli');
const path = require('path');
const filesize = require('filesize');
const chalk = require('chalk');

const util = require('util');
const fs_writeFile = util.promisify(fs.writeFile);

const log = console.log;

const extensionsToCompress = [
  'js',
  'css',
  'svg',
  'map',
  'json',
  'html',
  'htm',
  'map',
  'xml',
];

const compress = outDir => {
  let totalBytes = 0;
  let totalBytesCompressed = 0;

  glob(
    `${outDir}/**/*.{${extensionsToCompress.toString()}}`,
    async (er, files) => {
      for (file of files) {
        await gzipFile(file);
        await brotliFile(file);

        log(resultRow(file));

        totalBytes += getFilesizeInBytes(file);
        totalBytesCompressed += getFilesizeInBytes(file + '.br');
      }
      log(resultTotal(totalBytes, totalBytesCompressed));
    },
  );

  const gzipFile = file => {
    const inp = fs.createReadStream(file);
    const out = fs.createWriteStream(`${file}.gz`);

    const gzip = zlib.createGzip();

    return new Promise(resolve =>
      inp
        .pipe(gzip)
        .pipe(out)
        .on('finish', resolve),
    );
  };

  const brotliFile = file => {
    const result = brotli.compress(fs.readFileSync(file), {
      mode: 1,
      quality: 11,
      lgwin: 22,
    });

    return fs_writeFile(`${file}.br`, result);
  };
};

const getFilesizeInBytes = filename => {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats['size'];
  return fileSizeInBytes;
};

const resultRow = file => {
  const fileSizeInBytes = getFilesizeInBytes(file);
  const fileSize = filesize(fileSizeInBytes);
  const fileSizeInBytesCompressed = getFilesizeInBytes(`${file}.br`);
  const fileSizeCompressed = filesize(fileSizeInBytesCompressed);

  const savedPercent = getCompressedPercent(
    fileSizeInBytes,
    fileSizeInBytesCompressed,
  );

  return `${chalk.green.bold(
    fileSizeCompressed,
  )} ${savedPercent} from ${chalk.red.bold(fileSize)} ${getFilename(file)}`;
};

const resultTotal = (totalBytes, totalBytesCompressed) => `${chalk.bold(
  `Total compressed size:`,
)} ${chalk.green.bold(filesize(totalBytesCompressed))} ${getCompressedPercent(
  totalBytes,
  totalBytesCompressed,
)} from ${chalk.red.bold(filesize(totalBytes))}
  
`;

const getCompressedPercent = (fileSizeInBytes, fileSizeInBytesCompressed) =>
  chalk.greenBright(
    `(${(fileSizeInBytesCompressed / fileSizeInBytes * 100).toFixed(2)}%)`,
  );

const getFilename = filePath => filePath.replace(/^.*[\\\/]/, '');

module.exports = compress;
