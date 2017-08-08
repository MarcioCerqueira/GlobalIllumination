uniform sampler2D softShadowMap;
uniform sampler2D colorMap;
uniform sampler2D vertexMap;
uniform sampler2D normalMap;
uniform mat4 MV;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;
uniform float shadowIntensity;
varying vec2 f_texcoord;

vec4 phong(vec4 vertex, vec4 normal, float shadow)
{

	vec4 light_ambient = vec4(0.4, 0.4, 0.4, 1);
    vec4 light_specular = vec4(0.25, 0.25, 0.25, 1);
    vec4 light_diffuse = vec4(0.5, 0.5, 0.5, 1);
    float shininess = 10.0;
	float specShadow = shadow - shadowIntensity;

	vertex = MV * vertex;
	normal.xyz = normalize(normalMatrix * normal.xyz);

    vec3 L = normalize(lightPosition.xyz - vertex.xyz);   
    vec3 E = normalize(-vertex); // we are in Eye Coordinates, so EyePos is (0,0,0)  
    vec3 R = normalize(-reflect(L, normal.xyz));  
 
    vec4 Iamb = light_ambient;    
	vec4 Idiff = light_diffuse * max(dot(normal.xyz,L), 0.0);    
    vec4 Ispec = specShadow * light_specular * pow(max(dot(R,E),0.0), 0.3 * shininess);
	vec4 fragmentColor = texture2D(colorMap, f_texcoord);
   
	return shadow * fragmentColor * (Idiff + Ispec + Iamb);  
   
}

void main()
{	

	vec4 vertex = texture2D(vertexMap, f_texcoord);
	if(vertex.x == 0.0) discard; //Discard background scene

	vec4 normal = texture2D(normalMap, f_texcoord);
	float softShadowIntensity = texture2D(softShadowMap, f_texcoord).r;
	
	gl_FragColor = phong(vertex, normal, softShadowIntensity);
	
}