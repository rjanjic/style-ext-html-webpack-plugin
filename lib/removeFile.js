'use strict';

const debug = require('./common.js').debug;

const deleteFileFromCompilation = (compilation, filename) => {
  delete compilation.assets[filename];
  compilation.chunks.forEach(chunk => {
    const files = Array.from(chunk.files);
    const fileIndex = files.indexOf(filename);
    if (fileIndex > -1) {
      files.splice(fileIndex, 1);
    }
  });
  debug(`emit: asset '${filename}' deleted`);
};

module.exports = deleteFileFromCompilation;
