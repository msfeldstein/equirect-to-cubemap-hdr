var equirectToCubemapFaces = (function() {
	'use strict';

	var min = Math.min, max = Math.max;
	var pow = Math.pow, atan2 = Math.atan2, sqrt = Math.sqrt, log = Math.log;
	var floor = Math.floor, round = Math.round;
	var PI = +Math.PI;

	function clamp(v, lo, hi) {
		return min(hi, max(lo, v));
	}

	// These are approximations that assume gamma is 2.0. Not ideal, but close enough.
	function srgbToLinear(v) {
		return Math.pow(v, 2.2);
		// var component = (+v * (1.0 / 255.0));
		// return component * component;
	}

	function linearToSRGB(v) {
    	return Math.pow(v, 1.0 / 2.2);
	}

	function nearestPowerOfTwo(n) {
		return 1 << round(log(n)/log(2))
	}
	var DEFAULT_OPTIONS = {
		flipTheta: false,
		interpolation: "bilinear"
	};

	function transformSingleFace(inPixels, faceIdx, facePixels, opts) {
		if (!opts) {
			opts = DEFAULT_OPTIONS;
		}
		var thetaFlip = opts.flipTheta ? -1 : 1;
		var edge = facePixels.width;

		var inWidth = inPixels.width;
		var inHeight = inPixels.height;

		var inData = inPixels

		var smoothNearest = (opts.interpolation === "nearest");

		var faceData = facePixels
		var faceWidth = facePixels.width;
		var faceHeight = facePixels.height;

		var face = faceIdx | 0;

		var iFaceWidth2 = 2.0 / faceWidth;
		var iFaceHeight2 = 2.0 / faceHeight;

		for (var j = 0; j < faceHeight; ++j) {
			for (var i = 0; i < faceWidth; ++i) {
				var a = iFaceWidth2 * i;
				var b = iFaceHeight2 * j;
				var outPos = (i + j * edge) * opts.elementCount;
				var x = 0.0, y = 0.0, z = 0.0;
				// @@NOTE: Tried using explicit matrices for this and didn't see any
				// speedup over the (IMO more understandable) switch. (Probably because these
				// branches should be correctly predicted almost every time).
				switch (face) {
					case 0: x = 1.0 - a; y = 1.0;     z = 1.0 - b; break; // right  (+x)
					case 1: x = a - 1.0; y = -1.0;    z = 1.0 - b; break; // left   (-x)
					case 2: x = b - 1.0; y = a - 1.0; z = 1.0;     break; // top    (+y)
					case 3: x = 1.0 - b; y = a - 1.0; z = -1.0;    break; // bottom (-y)
					case 4: x = 1.0;     y = a - 1.0; z = 1.0 - b; break; // front  (+z)
					case 5: x = -1.0;    y = 1.0 - a; z = 1.0 - b; break; // back   (-z)
				}

				var theta = thetaFlip * atan2(y, x);
				var rad = sqrt(x*x+y*y);
				var phi = atan2(z, rad);

				var uf = 2.0 * (inWidth / 4) * (theta + PI) / PI;
				var vf = 2.0 * (inWidth / 4) * (PI/2 - phi) / PI;
				var ui = floor(uf), vi = floor(vf);

				if (smoothNearest) {
					var inPos = ((ui % inWidth) + inWidth * clamp(vi, 0, inHeight-1)) * opts.elementCount;
					faceData[outPos + 0] = inData[inPos + 0];
					faceData[outPos + 1] = inData[inPos + 1];
					faceData[outPos + 2] = inData[inPos + 2];
					// faceData[outPos + 3] = inData[inPos + 3];
				} else {
					// bilinear blend
					var u2 = ui+1, v2 = vi+1;
					var mu = uf-ui, nu = vf-vi;

					var pA = ((ui % inWidth) + inWidth * clamp(vi, 0, inHeight-1)) * opts.elementCount;
					var pB = ((u2 % inWidth) + inWidth * clamp(vi, 0, inHeight-1)) * opts.elementCount;
					var pC = ((ui % inWidth) + inWidth * clamp(v2, 0, inHeight-1)) * opts.elementCount;
					var pD = ((u2 % inWidth) + inWidth * clamp(v2, 0, inHeight-1)) * opts.elementCount;
					var aA = (inData[pA+3])*(1.0 / 255.0)
					var aB = (inData[pB+3])*(1.0 / 255.0)
					var aC = (inData[pC+3])*(1.0 / 255.0)
					var aD = (inData[pD+3])*(1.0 / 255.0)
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
					faceData[outPos+0] = linearToSRGB(r * ia) / 1.0;
					faceData[outPos+1] = linearToSRGB(g * ia) / 1.0;
					faceData[outPos+2] = linearToSRGB(b * ia) / 1.0;
					faceData[outPos+3] = (1);
				}
			}
		}
		return facePixels;
	}

	function transformToCubeFaces(inPixels, facePixArray, options) {
		if (facePixArray.length !== 6) {
			throw new Error("facePixArray length must be 6!");
		}
		if (!options) {
			options = DEFAULT_OPTIONS;
		}
		for (var face = 0; face < 6; ++face) {
			transformSingleFace(inPixels, face, facePixArray[face], options);
		}
		return facePixArray;
	}

	function equirectToCubemapFaces(inPixels, faceSize, options) {

		if (!faceSize) {
			faceSize = nearestPowerOfTwo(image.width/4);
		}

		if (typeof faceSize !== 'number') {
			throw new Error("faceSize needed to be a number or missing");
		}
    const pixelType = options.pixelType || Uint8ClampedArray
    options.elementCount = options.alpha ? 4 : 3
		var faces = [];

    const names = ["px", "nx", "py", "ny", "pz", "nz"]
		for (var i = 0; i < 6; ++i) {
			var faceData = new pixelType(faceSize * faceSize * options.elementCount)
      faceData.width = faceSize
      faceData.height = faceSize
      faceData.name = names[i]
			faces.push(faceData);
		}

		transformToCubeFaces(inPixels, faces, options)
		return faces;
	}

	equirectToCubemapFaces.transformSingleFace = transformSingleFace;
	equirectToCubemapFaces.transformToCubeFaces = transformToCubeFaces;

	return equirectToCubemapFaces;
}());

if (typeof module !== 'undefined' && module.exports) {
	module.exports = equirectToCubemapFaces;
}