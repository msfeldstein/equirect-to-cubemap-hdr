const HDRLoader = require('./hdr-load')
const createHDR = require('./create-hdr')
const EquirectToCubemapFaces = require('./equirect-to-cube')

module.exports = function(outputResolution, hdrStream, callback) {
  const hdrLoader = new HDRLoader()
  hdrLoader.on('load', function() {
    // data: Float32Array of pixel colors with length = width*height*3 
    //       in non-planar [X, Y, Z, X, Y, Z, ...] pixel layout 
    const equirectData = this.data
    equirectData.width = this.width
    equirectData.height = this.height
    
    const cubes = EquirectToCubemapFaces(equirectData, outputResolution, {
      elementCount: 3,
      pixelType: Float32Array,
      alpha: false
    })

    const output = []
    cubes.forEach((cube) => {
      const outName = `${cube.name}.hdr`
      output.push({
        data: cube,
        width: outputResolution,
        height: outputResolution
      })
    })
    callback(output)
  }) 
  hdrStream.pipe(hdrLoader)
  return hdrLoader 
}
