const writeHDR = require('../write-hdr')
var binstring = require('binstring');
window.binstring = binstring
const bufferOps = require('../buffer-ops')
const StreamSaver = require('streamsaver')

function concatenate(resultConstructor, ...arrays) {
    let totalLength = 0;
    for (let arr of arrays) {
        totalLength += arr.length;
    }
    let result = new resultConstructor(totalLength);
    let offset = 0;
    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}


module.exports = function(renderTarget, renderer) {
  console.log(renderTarget)
  
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
			uniform float time;
      uniform sampler2D inputImage;
      varying vec2 vUv;
      
      vec3 rgbe2rgb(vec4 rgbe) {
        return (rgbe.rgb * pow(2.0, rgbe.a * 255.0 - 128.0));
      }
      
      
      vec4 HdrEncode(vec3 value)
      {
        // value = value / 65536.0;
        vec3 exponent = clamp(ceil(log2(value)), -128.0, 127.0);
        float commonExponent = max(max(exponent.r, exponent.g), exponent.b);
        float range = exp2(commonExponent);
        vec3 mantissa = clamp(value / range, 0.0, 1.0);
        return vec4(mantissa, (commonExponent + 128.0)/255.0);
      }
      
			void main()	{
				vec3 hdr = texture2D(inputImage, vUv).rgb;
        vec4 encoded = vec4(HdrEncode(hdr));
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
  scene.add(quad)
  quad.scale.y = -1
  quad.material.side = THREE.DoubleSide
  
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 100)
  camera.position.set(0, 0, 3)
  camera.lookAt(new THREE.Vector3)
  
  renderer.render(scene, camera, encodeTarget)
  
  const pixelData = new Uint8Array(renderTarget.width * renderTarget.height * 4)
  renderer.readRenderTargetPixels(encodeTarget, 0, 0, renderTarget.width, renderTarget.height, pixelData)
  // renderer.render(scene, camera)
  const header = [
    '#?RADIANCE',
    '# Made with Noodles',
    'FORMAT=32-bit_rle_rgbe',
    '',
    `-Y ${renderTarget.height} +X ${renderTarget.width}`,
    '',
  ].join('\n')
  
  const headerData = binstring(header)
  console.log(headerData, headerData.byteLength, 'h')
  console.log(pixelData, pixelData.byteLength, 'p')
  const fileStream = StreamSaver.createWriteStream('packed.hdr', headerData.byteLength + pixelData.byteLength)
  const writer = fileStream.getWriter()
  writer.write(headerData)
  writer.write(pixelData)
  writer.close()
  // quad.material = new THREE.MeshBasicMaterial({map: renderTarget.texture, side: THREE.DoubleSide})
  // renderer.render(scene, camera)
}