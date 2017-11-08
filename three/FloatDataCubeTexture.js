/**
* @author Prashant Sharma / spidersharma03
* @author Ben Houston / http://clara.io / bhouston
*/

THREE.FloatDataCubeTexture = function ( cubeTextureFloatData, resolution ) {
	var texture = new THREE.CubeTexture();

	texture.type = THREE.FloatType;
	texture.encoding =  THREE.LinearEncoding;
	texture.format = THREE.RGBFormat

	texture.anisotropy = 0;

	for ( var i = 0; i < cubeTextureFloatData.length; i ++ ) {
		const texData = cubeTextureFloatData[i]
		var dataTexture = new THREE.DataTexture( texData.data, texData.width, texData.height );
		dataTexture.format = texture.format;
		dataTexture.type = texture.type;
		dataTexture.encoding = texture.encoding;
		dataTexture.minFilter = texture.minFilter;
		dataTexture.magFilter = texture.magFilter;
		dataTexture.generateMipmaps = texture.generateMipmaps;
		dataTexture.needsUpdate = true
		texture.images[ i ] = dataTexture;
	}
	texture.needsUpdate = true;
	return texture;

};