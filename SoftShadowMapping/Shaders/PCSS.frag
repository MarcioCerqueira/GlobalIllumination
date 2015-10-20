uniform sampler2D shadowMap;
uniform sampler2D accumulationMap;
uniform sampler2D texture0;
uniform sampler2D texture1;
uniform sampler2D texture2;
varying vec3 N;
varying vec3 v;  
varying vec4 shadowCoord;
varying vec3 uvTexture;
varying vec3 meshColor;
uniform vec3 lightPosition;
uniform float shadowIntensity;
uniform float accFactor;
uniform int windowWidth;
uniform int windowHeight;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int useTextureForColoring;
uniform int useMeshColor;
uniform int blockerSearchSize;
uniform int kernelSize;
uniform int lightSourceRadius;

vec4 phong()
{

	vec4 light_ambient = vec4(0.4, 0.4, 0.4, 1);
    vec4 light_specular = vec4(0.25, 0.25, 0.25, 1);
    vec4 light_diffuse = vec4(0.5, 0.5, 0.5, 1);
    float shininess = 10.0;

    vec3 L = normalize(lightPosition.xyz - v);   
    vec3 E = normalize(-v); // we are in Eye Coordinates, so EyePos is (0,0,0)  
    vec3 R = normalize(-reflect(L, N));  
 
    //calculate Ambient Term:  
    vec4 Iamb = light_ambient;    

    //calculate Diffuse Term:  
    vec4 Idiff = light_diffuse * max(dot(N,L), 0.0);    
   
    // calculate Specular Term:
    vec4 Ispec = light_specular * pow(max(dot(R,E),0.0), 0.3 * shininess);

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
   
	return sceneColor * (Idiff + Ispec + Iamb);  
   
}

float computePreEvaluationBasedOnNormalOrientation()
{

	vec3 L = normalize(lightPosition.xyz - v);   
	vec3 N2 = N;

	if(!gl_FrontFacing)
		N2 *= -1;

	if(max(dot(N2,L), 0.0) == 0) 
		return shadowIntensity;
	else
		return 1.0;

}

float PCSS(vec4 normalizedShadowCoord)
{

	float averageDepth = 0;
	int numberOfBlockers = 0;
	float offset = (blockerSearchSize - 1.0) * 0.5;
	float incrWidth = 1.0/float(shadowMapWidth);
	float incrHeight = 1.0/float(shadowMapHeight);
	
	for(float w = -offset; w <= offset; w++) {
		for(float h = -offset; h <= offset; h++) {
		
			float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.s + w * incrWidth, normalizedShadowCoord.t + h * incrHeight)).z;
			if(normalizedShadowCoord.z > distanceFromLight) {
				averageDepth += distanceFromLight;
				numberOfBlockers++;
			}
			
		}
	}

	if(numberOfBlockers == 0)
		return 1.0;

	averageDepth /= numberOfBlockers;
	float penumbraWidth = ((normalizedShadowCoord.z - averageDepth)/averageDepth) * lightSourceRadius;
	float PCFWidth = (1.0 * penumbraWidth)/normalizedShadowCoord.z;
	float illuminationCount = 0;
	int count = 0;
	float stepSize = 2.0 * PCFWidth/(kernelSize * kernelSize);
		
	if(stepSize <= 0.0)
		return 0.0;
		
	for(float w = -PCFWidth; w <= PCFWidth; w += stepSize) {
		for(float h = -PCFWidth; h <= PCFWidth; h += stepSize) {
		
			float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h))).z;
			if(normalizedShadowCoord.z <= distanceFromLight)
				illuminationCount++;
			else
				illuminationCount += shadowIntensity;
			count++;
				
		}
	}
		
	return illuminationCount/count;
	
}

void main()
{	

	vec4 color = phong();
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;

	float shadow = computePreEvaluationBasedOnNormalOrientation();
	
	if(shadowCoord.w > 0.0 && shadow == 1.0)
		shadow = PCSS(normalizedShadowCoord);

	gl_FragColor = shadow * color;

}