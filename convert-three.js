window.THREE = require('three')
require('./three/PMREMGenerator')
require('./three/FloatDataCubeTexture')
require('./three/PMREMCubeUVPacker')
const dragDrop = require('drag-drop')
const splitter = require('./cube-splitter')
const bufferOps = require('./buffer-ops')
const FloatToHDR = require('./three/FloatTextureToHDR')
const TextureToJPG = require('./three/FloatTextureToJPG')
const DAT = require('dat-gui')
const gui = new DAT.GUI()
const opts = {
  cubeResolution: 512
}
gui.add(opts, 'cubeResolution', [32,64,128,256,512,1024,2048,4096])

const W = window.innerWidth
const H = window.innerHeight
const renderer = new THREE.WebGLRenderer({
  preserveDrawingBuffer: true
})
const gl = renderer.getContext()
document.body.appendChild(renderer.domElement)
document.body.style.margin = 0
renderer.setSize(W, H)

dragDrop(renderer.domElement, function(files, pos) {
  if (files.length > 1 || files[0].fullPath.indexOf('.hdr') == -1) {
    return alert("Only drop .hdr equirects")
  }
  const reader = new FileReader()
  reader.addEventListener('load', function(e) {
    const hdrArrayBuffer = reader.result
    const stream = bufferOps.arrayBufferToStream(hdrArrayBuffer)
    const hdrReader = splitter(parseInt(opts.cubeResolution), stream, function(cube) {
      const cubemap = new THREE.FloatDataCubeTexture(cube, parseInt(opts.cubeResolution))
      
      const pmremGenerator = new THREE.PMREMGenerator(cubemap)
      pmremGenerator.update(renderer)
      
      const packer = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods)
      packer.update(renderer)
      
      const renderTarget = packer.CubeUVRenderTarget
      
      FloatToHDR(renderTarget, renderer)
      console.log("DOING HDR TOO")
      TextureToJPG(renderTarget, renderer)
    })
  })
  reader.addEventListener('error', function(err) {
    console.error('FileReader Error', err)
  })
  reader.readAsArrayBuffer(files[0])
})

// 
const info = document.createElement('div')
info.textContent = "v v v Drop an equirect .hdr below v v v"
document.body.appendChild(info)
info.style.position = 'fixed'
info.style.top = "10%"
info.style.width = "100%"
info.style.color = 'white'
info.style.textAlign = 'center'