const fs = require('fs')
const mmmeEncoding = require('mmme-encoding')
const rle = require("thing-rle-pack");
/*
 * hdrData<Float32Array> of pixel color data X,Y,Z,X,Y,Z
 */

module.exports = function writeHdr(hdrData, width, height, path) {
  const header = `#?RADIANCE\n# Made with noodles\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`
  
  const fd = fs.createWriteStream(path)
  fd.write(header)
  const len = width * height * 4

  const buffer = new Buffer(len)
  let bufferIdx = 0
  const encodedArray = new Uint8ClampedArray(4)
  for (var i = 0; i < hdrData.length; i += 4) {
    mmmeEncoding.fromFloats(hdrData.slice(i, i + 3), encodedArray)
    buffer.writeUInt8(encodedArray[0], bufferIdx++)
    buffer.writeUInt8(encodedArray[1], bufferIdx++)
    buffer.writeUInt8(encodedArray[2], bufferIdx++)
    buffer.writeUInt8(encodedArray[3], bufferIdx++)
  }
  fd.write(buffer)
  fd.end()
}