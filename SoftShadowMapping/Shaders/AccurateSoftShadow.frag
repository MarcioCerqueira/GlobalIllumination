#extension GL_EXT_texture_array : enable
uniform sampler2DArray shadowMapArray;
uniform sampler2D texture0;
uniform sampler2D texture1;
uniform sampler2D texture2;
varying vec4 vertex4;
varying vec3 N;
varying vec3 v;  
varying vec3 uvTexture;
varying vec3 meshColor;
uniform mat4 lightMVP;
uniform vec3 lightPosition;
uniform vec4 lightMVPTrans[289];
uniform float shadowIntensity;
uniform int numberOfSamples;
uniform int windowWidth;
uniform int windowHeight;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int useTextureForColoring;
uniform int useMeshColor;
uniform int monteCarlo;
uniform int adaptiveSampling;
uniform int adaptiveSamplingLowerAccuracy;

vec4 phong(float shadow)
{

	vec4 light_ambient = vec4(0.4, 0.4, 0.4, 1);
    vec4 light_specular = vec4(0.25, 0.25, 0.25, 1);
    vec4 light_diffuse = vec4(0.5, 0.5, 0.5, 1);
    float shininess = 10.0;
	float specShadow = shadow - shadowIntensity;

    vec3 L = normalize(lightPosition.xyz - v);   
    vec3 E = normalize(-v); // we are in Eye Coordinates, so EyePos is (0,0,0)  
    vec3 R = normalize(-reflect(L, N));  
 
    //calculate Ambient Term:  
    vec4 Iamb = light_ambient;    

    //calculate Diffuse Term:  
    vec4 Idiff = light_diffuse * max(dot(N,L), 0.0);    
   
    // calculate Specular Term:
    vec4 Ispec = specShadow * light_specular * pow(max(dot(R,E),0.0), 0.3 * shininess);

    vec4 sceneColor;
   
    if(useTextureForColoring == 1) {
		if(uvTexture.b > 0.99 && uvTexture.b < 1.001)
			sceneColor = texture2D(texture0, vec2(uvTexture.rg));
		else if(uvTexture.b > 1.999 && uvTexture.b < 2.001)
			sceneColor = texture2D(texture1, vec2(uvTexture.rg));	
		else if(uvTexture.b > 2.999 && uvTexture.b < 3.001)
			sceneColor = texture2D(texture2, vec2(uvTexture.rg));
		else
			sceneColor = vec4(meshColor.r, meshColor.g, meshColor.b, 1);
	} else if(useMeshColor == 1)
		sceneColor = vec4(meshColor.r, meshColor.g, meshColor.b, 1);
	else
		sceneColor = gl_FrontLightModelProduct.sceneColor;
   
	return shadow * sceneColor * (Idiff + Ispec + Iamb);  
   
}

float computePreEvaluationBasedOnNormalOrientation()
{

	vec3 L = normalize(lightPosition.xyz - v);   
	vec3 N2 = N;

	if(!gl_FrontFacing)
		N2 *= -1;

	if(max(dot(N2,L), 0.0) == 0.0) 
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

	float shadow = computePreEvaluationBasedOnNormalOrientation();
	
	if(shadow == 1.0) {
		
		vec4 shadowCoord;
		vec4 commonShadowCoord;
		float distanceFromLight;
		float accShadow = 0;
		float count = 0;
		float accFactor = 1.0;

		commonShadowCoord.x = lightMVP[0][0] * vertex4.x + lightMVP[1][0] * vertex4.y + lightMVP[2][0] * vertex4.z;
		commonShadowCoord.y = lightMVP[0][1] * vertex4.x + lightMVP[1][1] * vertex4.y + lightMVP[2][1] * vertex4.z;
		commonShadowCoord.z = lightMVP[0][2] * vertex4.x + lightMVP[1][2] * vertex4.y + lightMVP[2][2] * vertex4.z;
		commonShadowCoord.w = lightMVP[0][3] * vertex4.x + lightMVP[1][3] * vertex4.y + lightMVP[2][3] * vertex4.z;

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
	
	gl_FragColor = phong(shadow);
	
}