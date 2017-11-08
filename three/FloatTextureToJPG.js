const jpeg = require('jpeg-js')
const StreamSaver = require('streamsaver')

module.exports = function(renderTarget, renderer) {  
  const encodeTarget = new THREE.WebGLRenderTarget(renderTarget.width, renderTarget.height, {
    format: THREE.RGBAFormat
  })
  
  const material = new THREE.RawShaderMaterial({
    vertexShader: `
    precision highp float;
    uniform mat4 modelViewMatrix; // optional
    uniform mat4 projectionMatrix; // optional
    attribute vec3 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main()	{
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `,
    fragmentShader: `
    precision highp float;
      uniform sampler2D inputImage;
      varying vec2 vUv;
      
      void main()	{
        vec3 hdr = texture2D(inputImage, vUv).rgb;
        hdr = pow(hdr, vec3(1.0 / 2.2));
        vec4 encoded = vec4(hdr, 1.0);
        gl_FragColor = encoded;
      }
    `,
    uniforms: {
      inputImage: {value: renderTarget.texture}
    }
  })
  const scene = new THREE.Scene()
  const quad = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2),
    material
  )
  quad.scale.y = -1
  scene.add(quad)
  quad.material.side = THREE.DoubleSide
  
  
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 100)
  camera.position.set(0, 0, 3)
  camera.lookAt(new THREE.Vector3)
  
  
  renderer.render(scene, camera, encodeTarget)
  
  const pixelData = new Uint8Array(renderTarget.width * renderTarget.height * 4)
  renderer.readRenderTargetPixels(encodeTarget, 0, 0, renderTarget.width, renderTarget.height, pixelData)
  const rawImageData = {
    data: pixelData,
    width: encodeTarget.width,
    height: encodeTarget.height
  }
  const jpegImageData = jpeg.encode(rawImageData, 100)
  const fileStream = StreamSaver.createWriteStream('packed.jpg', jpegImageData.length)
  const writer = fileStream.getWriter()
  console.log(jpegImageData)
  writer.write(jpegImageData.data)
  writer.close()
  // window.open(renderer.domElement.toDataURL('image/jpg'), 'screenshot')
}