const sphericalToCartesian = function(r, phi, theta) {
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  ]
}

const cartesianToSpherical = function(x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z)
  const theta = Math.atan2(y, x)
  const phi = Math.atan2(z, r)
  return {
    r, theta, phi
  }
}

module.exports = {
  sphericalToCartesian,
  cartesianToSpherical
}