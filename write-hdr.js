const fs = require('fs')
const mmmeEncoding = require('mmme-encoding')
/*
 * hdrData<Float32Array> of pixel color data X,Y,Z,X,Y,Z
 */

module.exports = function writeHdr(hdrData, width, height, path) {
  const header = [
    '#?RADIANCE',
    '# Made with Noodles',
    'FORMAT=32-bit_rle_rgbe',
    '',
    `-Y ${height} +X ${width}`,
    '',
  ].join('\n')
  
  const fd = fs.createWriteStream(path)
  fd.write(header)
  const len = width * height * 4

  const buffer = new Buffer(len)
  let bufferIdx = 0
  const encodedArray = new Uint8ClampedArray(4)
  for (var i = 0; i < hdrData.length; i += 3) {
    const floats = hdrData.slice(i, i + 3)
    
    mmmeEncoding.fromFloats(floats, encodedArray)
    buffer.writeUInt8(encodedArray[0], bufferIdx++)
    buffer.writeUInt8(encodedArray[1], bufferIdx++)
    buffer.writeUInt8(encodedArray[2], bufferIdx++)
    buffer.writeUInt8(encodedArray[3], bufferIdx++)
  }
  fd.write(buffer)
  fd.end()
}