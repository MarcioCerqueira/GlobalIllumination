uniform sampler2D shadowMap;
uniform sampler2D SATShadowMap;
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
uniform int zNear;
uniform int zFar;
uniform int windowWidth;
uniform int windowHeight;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int useTextureForColoring;
uniform int useMeshColor;
uniform int blockerSearchSize;
uniform int kernelSize;
uniform int lightSourceRadius;
uniform int SATDisabled;

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

float linearize(float depth) {

	float n = float(zNear);
	float f = float(zFar);
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}

float chebyshevUpperBound(vec2 moments, float distanceToLight)
{
	
	if (distanceToLight <= moments.x)
		return 1.0;
	
	float variance = moments.y - (moments.x * moments.x);
	float d = distanceToLight - moments.x;
	float p_max = variance / (variance + d*d);
	p_max = (p_max - 0.25) / (1.0 - 0.25);
	return clamp(p_max, shadowIntensity, 1.0);

}

vec2 recombinePrecision(vec4 value)  
{  

	float factorInv = 1.0 / 256.0;  
	return vec2(value.zw * factorInv + value.xy);  

} 

float SAVSM(vec4 normalizedShadowCoord)
{

	//Step 1. Blocker Search
	float averageDepth = 0;
	int numberOfBlockers = 0;
	float blockerSearchWidth = lightSourceRadius/float(shadowMapWidth);
	float stepSize = 2.0 * blockerSearchWidth/(blockerSearchSize * blockerSearchSize);
	
	if(stepSize <= 0.0) 
		return 0.0;
	
	for(float w = -blockerSearchWidth; w <= blockerSearchWidth; w += stepSize) {
		for(float h = -blockerSearchWidth; h <= blockerSearchWidth; h += stepSize) {
		
			float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h))).z;
			if(normalizedShadowCoord.z > distanceFromLight) {
				averageDepth += distanceFromLight;
				numberOfBlockers++;
			}
				
		}
	}

	if(numberOfBlockers == 0)
		return 1.0;

	//Step 2. Penumbra Estimation
	averageDepth /= numberOfBlockers;
	float filterWidth = ((normalizedShadowCoord.z - averageDepth)/averageDepth) * lightSourceRadius;
	
	//Step 3. Filtering
	stepSize = 2.0 * filterWidth/(kernelSize * kernelSize);
	//float div = filterWidth/stepSize;
	
	if(stepSize <= 0.0)
		return 0.0;
	
	vec2 moments = vec2(0.0);
	int count = 0;
	float div = 0;

	for(float w = -filterWidth; w <= filterWidth; w += stepSize) {
		for(float h = -filterWidth; h <= filterWidth; h += stepSize) {
		
			if(SATDisabled == 1) {
				moments += recombinePrecision(texture2D(SATShadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h)))).xy;
				moments.x += 0.5;
			}
			count++;
		}
		div++;
	}
	
	if(SATDisabled == 1) moments /= count;
	
	if(SATDisabled == 0) {

		float xmax = normalizedShadowCoord.x + (div) * stepSize;
		float xmin = normalizedShadowCoord.x - (div + 1) * stepSize;
		float ymax = normalizedShadowCoord.y + (div) * stepSize;
		float ymin = normalizedShadowCoord.y - (div + 1) * stepSize;
	
		vec4 A = texture2D(SATShadowMap, vec2(xmin, ymin));
		vec4 B = texture2D(SATShadowMap, vec2(xmax, ymin));
		vec4 C = texture2D(SATShadowMap, vec2(xmin, ymax));
		vec4 D = texture2D(SATShadowMap, vec2(xmax, ymax));
		moments = recombinePrecision((D + A - B - C)/float(div * 8));
		moments.x += 0.5;
		if(filterWidth < 0.001) return 1.0;
		//0.009
		
	}

	normalizedShadowCoord.z = linearize(normalizedShadowCoord.z);
	return chebyshevUpperBound(moments, normalizedShadowCoord.z);

}

void main()
{	

	vec4 color = phong();
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;

	float shadow = computePreEvaluationBasedOnNormalOrientation();

	if(shadowCoord.w > 0.0 && shadow == 1.0)
		shadow = SAVSM(normalizedShadowCoord);

	gl_FragColor = shadow * color;
	
}