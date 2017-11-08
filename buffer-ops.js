let Duplex = require('stream').Duplex;  
function bufferToStream(buffer) {  
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function arrayBufferToBuffer(ab) {
    var buf = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}

function arrayBufferToStream(ab) {
  return bufferToStream(arrayBufferToBuffer(ab))
}

module.exports = {
  arrayBufferToBuffer,
  bufferToStream,
  arrayBufferToStream
}