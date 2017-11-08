const SAMPLES_PER_LEVEL = 20

const glm = require('gl-matrix')
const spherical = require('./spherical')
const textureLookup = require('./texture-lookup')
const mergeArray = function(src, dest, srcOff, srcLen, destOff) {
  let i = 0
  while (srcLen > 0) {
    dest[destOff + i] = src[srcOff + i]
    i++
    srcLen --
  }
}

const validate = function(o, name) {
  Object.keys(o).forEach(function(k) {
    if (isNaN(o[k]) || o[k] === Infinity || o[k] === -Infinity) {
      console.trace("Invalid matrix" + name)
      console.log(o)
      throw ""
    }
  })
}

// 
// vec3 ImportanceSampleGGX( vec2 uv, mat3 vecSpace, float Roughness )\n\
// 				{\n\
// 					float a = Roughness * Roughness;\n\
// 					float Phi = 2.0 * PI * uv.x;\n\
// 					float CosTheta = sqrt( (1.0 - uv.y) / ( 1.0 + (a*a - 1.0) * uv.y ) );\n\
// 					float SinTheta = sqrt( 1.0 - CosTheta * CosTheta );\n\
// 					return vecSpace * vec3(SinTheta * cos( Phi ), SinTheta * sin( Phi ), CosTheta);\n\
// 				}\n\
const tmpMat3 = glm.mat3.create()

const ImportanceSampleGGX = function(uv, vecSpace, roughness) {
  uv.x = uv[0]
  uv.y = uv[1]
  let a = roughness * roughness
  let phi = 2 * Math.PI * uv.x
  let cosTheta = Math.sqrt( (1 - uv.y) / (1 + (a * a - 1.0) * uv.y) )
  let sinTheta = Math.sqrt(1 - cosTheta * cosTheta)
  const v = glm.vec3.fromValues(
    sinTheta * Math.cos(phi),
    sinTheta * Math.sin(phi),
    cosTheta
  )
  validate(vecSpace, "vecSpace")
  console.log("vecSpace", vecSpace)
  console.log("v", v)
  validate(v, "v")
  return glm.vec3.transformMat3(
    tmpMat3,
    v,
    vecSpace
  )
}

const matrixFromVector = (v) => {
  console.log(v)
  let a = 1 / (1 + v[2])
  console.log("a", a)
  let b = -v[0] * v[1] * a
  console.log("b", b)
  let b1 = glm.vec3.fromValues(1.0 - v[0] * v[0] * a, b, -v[0])
  console.log("b1", b1)
  let b2 = glm.vec3.fromValues(b, 1.0 - v[1] * v[1] * a, - v[1])
  console.log("b2", b2)
  return glm.mat3.fromValues(
    b1[0], b1[1], b1[2],
    b2[0], b2[1], b2[2],
    v[0], v[1], v[1])
}

module.exports = function(pixelData, width, height, roughness) {
  const convolvedData = new Float32Array(width * height * 3)
  
  const getPixelIndex = (x, y) => (x + y * width) * 3
  const tempVec = new Float32Array(3)
  const tempLookupVec = new Float32Array(4) // in case there is alpha
  
  const textureCubeLookup = function(phi, theta) {
    const x = phi / 2 * Math.PI + 0.5
    const y = theta / Math.PI + 0.5
    const i = getPixelIndex(x, y)
    mergeArray(pixelData, tempVec, i, 3, 0)
  }
  const convolvePixel = function(x, y) {
    const pixelIndex = getPixelIndex(x, y)
    
    let rgbColor = new Float32Array(3)
    let numSamples = SAMPLES_PER_LEVEL
    let weight = 0.0
    let phi = x / width * 2 * Math.PI - Math.PI
    let theta = y / height * Math.PI - Math.PI / 2
    let r = 1

    let sampleDirection = glm.vec3.fromValues.apply(null, spherical.sphericalToCartesian(r, phi, theta))
    glm.vec3.normalize(sampleDirection, sampleDirection)

    let vecSpace = matrixFromVector(sampleDirection)
    for (let i = 0; i < numSamples; i++) {
      const sinI = Math.sin(i)
      const cosI = Math.cos(i)
      const r = Math.random() // todo does this actually need cos and sin inputs
      const uv = glm.vec2.fromValues(i / numSamples, r)
      let vect = ImportanceSampleGGX(uv, vecSpace, roughness)
      const dotProd = glm.vec3.dot(vect, sampleDirection)
      weight += dotProd
      validate(vect, "vect")
      let color = textureLookup(pixelData, tempLookupVec, vect[0], vect[1], vect[2])
      mergeArray(convolvedData, pixelData, 0, 3, i)
    }
    
    
    
    // mat3 vecSpace = matrixFromVector(normalize(sampleDirection * queryScale));\n\
		// 			vec3 rgbColor = vec3(0.0);\n\
		// 			const int NumSamples = SAMPLES_PER_LEVEL;\n\
		// 			vec3 vect;\n\
		// 			float weight = 0.0;\n\
		// 			for( int i = 0; i < NumSamples; i ++ ) {\n\
		// 				float sini = sin(float(i));\n\
		// 				float cosi = cos(float(i));\n\
		// 				float r = rand(vec2(sini, cosi));\n\
		// 				vect = ImportanceSampleGGX(vec2(float(i) / float(NumSamples), r), vecSpace, roughness);\n\
		// 				float dotProd = dot(vect, normalize(sampleDirection));\n\
		// 				weight += dotProd;\n\
		// 				vec3 color = envMapTexelToLinear(textureCube(envMap,vect)).rgb;\n\
		// 				rgbColor.rgb += color;\n\
		// 			}\n\
		// 			rgbColor /= float(NumSamples);\n\
    
    mergeArray(pixelData, tempVec, i, 3, 0)
    return tempVec

  }
  convolvedData.fill(0)
  
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      const p = convolvePixel(x, y)
      const i = getPixelIndex(x, y)
      mergeArray(p, convolvedData, 0, 3, i)
    }
  }
  return convolvedData
}