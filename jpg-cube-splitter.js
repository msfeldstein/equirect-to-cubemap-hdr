const HDRLoader = require('./hdr-load')
const createHDR = require('./create-hdr')
const EquirectToCubemapFaces = require('./equirect-to-cube')
const getPixels = require('get-pixels')

module.exports = function(outputResolution, hdrStream, callback) {
  getPixels(hdrStream, 'image/jpg', function(e, ndArray) {
    // data: Float32Array of pixel colors with length = width*height*3 
    //       in non-planar [X, Y, Z, X, Y, Z, ...] pixel layout 
    const equirectData = ndArray.data
    equirectData.width = ndArray.shape[0]
    equirectData.height = ndArray.shape[1]
    
    const cubes = EquirectToCubemapFaces(equirectData, outputResolution, {
      elementCount: 4,
      pixelType: Uint8Array,
      alpha: true
    })

    const output = []
    cubes.forEach((cube) => {
      output.push({
        data: cube,
        width: outputResolution,
        height: outputResolution
      })
    })
    callback(output)
  }) 
}
