#extension GL_EXT_texture_array : enable
uniform sampler2DArray shadowMapArray;
uniform sampler2D vertexMap;
uniform sampler2D normalMap;
uniform mat4 lightMVP;
uniform mat4 MV;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;
uniform vec4 lightMVPTrans[289];
uniform float shadowIntensity;
uniform int numberOfSamples;
uniform int windowWidth;
uniform int windowHeight;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int monteCarlo;
uniform int adaptiveSampling;
uniform int adaptiveSamplingLowerAccuracy;
varying vec2 f_texcoord;

float computePreEvaluationBasedOnNormalOrientation(vec4 vertex, vec4 normal)
{

	vertex = MV * vertex;
	normal.xyz = normalize(normalMatrix * normal.xyz);

	vec3 L = normalize(lightPosition.xyz - vertex.xyz);   
	
	if(!bool(normal.w))
		normal.xyz *= -1;

	if(max(dot(normal.xyz,L), 0.0) == 0) 
		return shadowIntensity;
	else
		return 1.0;

}

float myPow(float value, int exponent) {
	
	if(exponent == 0) 
		return 1.0;
	else {
		float result = 1.0;
		for(int e = 1; e <= exponent; e++)
			result *= value;
		return result;
	}

}

void main()
{	

	vec4 vertex = texture2D(vertexMap, f_texcoord);
	if(vertex.x == 0.0) discard; //Discard background scene

	vec4 normal = texture2D(normalMap, f_texcoord);
	float shadow = computePreEvaluationBasedOnNormalOrientation(vertex, normal);
	
	if(shadow == 1.0) {
		
		vec4 shadowCoord;
		vec4 commonShadowCoord;
		float distanceFromLight;
		float accShadow = 0;
		float count = 0;
		float accFactor = 1.0;

		commonShadowCoord.x = lightMVP[0][0] * vertex.x + lightMVP[1][0] * vertex.y + lightMVP[2][0] * vertex.z;
		commonShadowCoord.y = lightMVP[0][1] * vertex.x + lightMVP[1][1] * vertex.y + lightMVP[2][1] * vertex.z;
		commonShadowCoord.z = lightMVP[0][2] * vertex.x + lightMVP[1][2] * vertex.y + lightMVP[2][2] * vertex.z;
		commonShadowCoord.w = lightMVP[0][3] * vertex.x + lightMVP[1][3] * vertex.y + lightMVP[2][3] * vertex.z;

		for(int index = 0; index < numberOfSamples; index++) {
				
			if(adaptiveSampling == 1) {
			
				int quadTreeLevel = lightMVPTrans[index].w / 10000;
				if(quadTreeLevel > 4) quadTreeLevel = 4;
				float wValue = lightMVPTrans[index].w - quadTreeLevel * 10000;
				accFactor = myPow(2.0, quadTreeLevel) + 1.0;
				accFactor = 1.0/(accFactor * accFactor);
				shadowCoord = commonShadowCoord + vec4(lightMVPTrans[index].xyz, wValue);
			
			} else {
			
				shadowCoord = commonShadowCoord + lightMVPTrans[index];
			
			}
		
			shadowCoord /= shadowCoord.w;
			
			if(adaptiveSamplingLowerAccuracy == 0) {
			
				distanceFromLight = texture2DArray(shadowMapArray, vec3(shadowCoord.xy, index)).z;		
				accShadow += ((shadowCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity) * accFactor; 
			
			} else {

				float incrWidth = 1.0/float(shadowMapWidth);
				float incrHeight = 1.0/float(shadowMapHeight);
				float offset = 1;
				float stepSize = 2 * offset/3.0;
				float illuminationCount = 0;
				int PCFCount = 0;

				for(float w = -offset; w <= offset; w+=stepSize) {
					for(float h = -offset; h <= offset; h+=stepSize) {

						distanceFromLight = texture2DArray(shadowMapArray, vec3(shadowCoord.x + w * incrWidth, shadowCoord.y + h * incrHeight, index)).z;
						if(shadowCoord.z <= distanceFromLight) illuminationCount++;
						else illuminationCount += shadowIntensity;
						PCFCount++;

					}
				}
				
				accShadow += (illuminationCount/float(PCFCount)) * accFactor;

			}

			count += accFactor;

		}

		shadow = accShadow/count;

	}
	
	gl_FragColor = vec4(shadow, 0.0, 0.0, 1.0);
	
}