uniform sampler2D normalMap;
uniform sampler2D softShadowMap;
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
uniform int useTextureForColoring;
uniform int useMeshColor;

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

void main()
{	

	float softShadowIntensity = texture2D(softShadowMap, vec2(gl_FragCoord.x/windowWidth, gl_FragCoord.y/windowHeight)).r;
	gl_FragColor = phong(softShadowIntensity);
	
}