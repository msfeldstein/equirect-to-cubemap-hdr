	// These are approximations that assume gamma is 2.0. Not ideal, but close enough.
	function srgbToLinear(v) {
    return v
		// var component = (+v * (1.0 / 255.0));
		// return component * component;
	}

	function linearToSRGB(v) {
    return v
		// return (sqrt(v) * 255.0) | 0;
	}
  

module.exports = function(inData, outData, x, y, z, bilinearFiltering) {
  var theta = atan2(y, x);
  var rad = sqrt(x*x+y*y);
  var phi = atan2(z, rad);

  var uf = 2.0 * (inWidth / 4) * (theta + PI) / PI;
  var vf = 2.0 * (inWidth / 4) * (PI/2 - phi) / PI;
  var ui = floor(uf), vi = floor(vf);

  if (bilinearFiltering) {
    // bilinear blend
    var u2 = ui+1, v2 = vi+1;
    var mu = uf-ui, nu = vf-vi;

    var pA = ((ui % inWidth) + inWidth * clamp(vi, 0, inHeight-1)) * opts.elementCount;
    var pB = ((u2 % inWidth) + inWidth * clamp(vi, 0, inHeight-1)) * opts.elementCount;
    var pC = ((ui % inWidth) + inWidth * clamp(v2, 0, inHeight-1)) * opts.elementCount;
    var pD = ((u2 % inWidth) + inWidth * clamp(v2, 0, inHeight-1)) * opts.elementCount;
    var aA = (inData[pA+3])
    var aB = (inData[pB+3])
    var aC = (inData[pC+3])
    var aD = (inData[pD+3])
    // Do the bilinear blend in linear space.
    var rA = srgbToLinear(inData[pA+0]) * aA, gA = srgbToLinear(inData[pA+1]) * aA, bA = srgbToLinear(inData[pA+2]) * aA;
    var rB = srgbToLinear(inData[pB+0]) * aB, gB = srgbToLinear(inData[pB+1]) * aB, bB = srgbToLinear(inData[pB+2]) * aB;
    var rC = srgbToLinear(inData[pC+0]) * aC, gC = srgbToLinear(inData[pC+1]) * aC, bC = srgbToLinear(inData[pC+2]) * aC;
    var rD = srgbToLinear(inData[pD+0]) * aD, gD = srgbToLinear(inData[pD+1]) * aD, bD = srgbToLinear(inData[pD+2]) * aD;

    var r = (rA*(1.0-mu)*(1.0-nu) + rB*mu*(1.0-nu) + rC*(1.0-mu)*nu + rD*mu*nu);
    var g = (gA*(1.0-mu)*(1.0-nu) + gB*mu*(1.0-nu) + gC*(1.0-mu)*nu + gD*mu*nu);
    var b = (bA*(1.0-mu)*(1.0-nu) + bB*mu*(1.0-nu) + bC*(1.0-mu)*nu + bD*mu*nu);
    var a = (aA*(1.0-mu)*(1.0-nu) + aB*mu*(1.0-nu) + aC*(1.0-mu)*nu + aD*mu*nu);
    var ia = 1.0 / a;
    faceData[outPos+0] = linearToSRGB(r * ia);
    faceData[outPos+1] = linearToSRGB(g * ia);
    faceData[outPos+2] = linearToSRGB(b * ia);
    faceData[outPos+3] = a;
  } else {
    var inPos = ((ui % inWidth) + inWidth * clamp(vi, 0, inHeight-1)) * opts.elementCount;
    faceData[outPos + 0] = inData[inPos + 0];
    faceData[outPos + 1] = inData[inPos + 1];
    faceData[outPos + 2] = inData[inPos + 2];
    // faceData[outPos + 3] = inData[inPos + 3];
  }
}