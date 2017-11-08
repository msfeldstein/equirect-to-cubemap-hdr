#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const getPixels = require('get-pixels')
const EquirectToCubemapFaces = require('./equirect-to-cube')
const HDRLoader = require('./hdr-load')
const writeHDR = require('./write-hdr')
const convolve = require('./convolve')

const input = process.argv[2]
const outputResolution = parseInt(process.argv[3]) || 256

if (!input || input == '-h') {
  console.log("Usage: equirect-to-cubemap path/to/equirect.hdr [output resolution]")
  return
}

console.log(`>> Generating maps for ${input} at ${outputResolution}px`)

const hdrLoader = new HDRLoader()
hdrLoader.on('load', function() {
  // data: Float32Array of pixel colors with length = width*height*3 
  //       in non-planar [X, Y, Z, X, Y, Z, ...] pixel layout 
  const equirectData = this.data
  equirectData.width = this.width
  equirectData.height = this.height
  console.log(this.headers)
  
  const convolved = convolve(equirectData, this.width, this.height, 0.3)
  writeHDR(convolved, this.width, this.height, this.headers, '/Users/feldstein/Desktop/convolved.hdr')
  return
  
  const cubes = EquirectToCubemapFaces(equirectData, outputResolution, {
    elementCount: 3,
    pixelType: Float32Array,
    alpha: false
  })
  let i = 0
  
  const outPath = input + '.cubemaps'
  if (!fs.existsSync(outPath)){
    fs.mkdirSync(outPath);
  }
  console.log(this.headers)
  cubes.forEach((cube) => {
    const outName = `${outPath}/${cube.name}.hdr`
    writeHDR(cube, cube.width, cube.height, this.headers, outName)
    console.log("Written ", outName)
  })
})
const file = fs.createReadStream(input)
file.pipe(hdrLoader)
