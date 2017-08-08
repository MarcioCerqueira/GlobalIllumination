#extension GL_EXT_texture_array : enable
uniform sampler2DArray shadowMapArray;
uniform sampler2DArray discontinuityMapArray;
uniform sampler2D vertexMap;
uniform sampler2D visibilityMap;
uniform mat4 lightMVPs[4];
uniform int shadowMapIndices[4];
uniform int shadowIntensity;
uniform int windowWidth;
uniform int windowHeight;
uniform int quadTreeLevel;
varying vec2 f_texcoord;

void main()
{	

	vec4 vertex = texture2D(vertexMap, f_texcoord);
	if(vertex.x == 0.0) discard; //Discard background scene
	
	vec4 shadowCoord[4];
	vec4 discontinuity;
	float shadow[4];
	float sum = 0.0;
	float tempSum = 0.0;
	int discontinuityCount = 0;
	
	for(int i = 0; i < 4; i++) {
		shadowCoord[i] = lightMVPs[i] * vertex;
		shadowCoord[i] /= shadowCoord[i].w;
		shadow[i] = (shadowCoord[i].z <= texture2DArray(shadowMapArray, vec3(shadowCoord[i].xy, shadowMapIndices[i])).z) ? 1.0 : 0.0;
		discontinuity = texture2DArray(discontinuityMapArray, vec3(f_texcoord, shadowMapIndices[i]));
		if((discontinuity.r + discontinuity.g) > 0.0) discontinuityCount++;
	}
	
	tempSum = sum = shadow[0] + shadow[1] + shadow[2] + shadow[3];	
	float visibilityClassification = texture2D(visibilityMap, f_texcoord).r;
	
	if(discontinuityCount >= 2) sum = 5.0;
	
	if(quadTreeLevel == 0) {
		if(sum.r == 0.0 || sum.r == 4.0) visibilityClassification = sum.r/4.0;
		else visibilityClassification = 0.5;
	} else {
		if((visibilityClassification == 0.0 && sum.r != 0.0) || (visibilityClassification == 1.0 && sum.r != 4.0)) visibilityClassification = 0.5;
	}
	
	//if(discontinuityCount < 3) sum = tempSum;
	
	gl_FragData[0] = vec4(sum, 0.0, 1.0, 1.0);
	gl_FragData[1] = vec4(visibilityClassification, 0.0, 0.0, 1.0);

}