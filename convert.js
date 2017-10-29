const fs = require('fs')
const getPixels = require('get-pixels')
const EquirectToCubemapFaces = require('./equirect-to-cube')
const HDR = require('hdr')
const writeHDR = require('./write-hdr')
const jpeg = require('jpeg-js')

const hdrLoader = new HDR.loader()
hdrLoader.on('load', function() {
  // data: Float32Array of pixel colors with length = width*height*3 
  //       in non-planar [X, Y, Z, X, Y, Z, ...] pixel layout 
  const equirectData = this.data
  equirectData.width = this.width
  equirectData.height = this.height
  const cubes = EquirectToCubemapFaces(equirectData, 512, {
    elementCount: 3,
    pixelType: Float32Array,
    alpha: false,
    interpolation: "nearest"
  })
  let i = 0
  cubes.forEach((cube) => {
    const outName = `./out/${i++}.hdr`
    writeHDR(cube, cube.width, cube.height, outName)
    console.log("Written ", outName)
  })
})
const file = fs.createReadStream('./radiance.hdr')
file.pipe(hdrLoader)
