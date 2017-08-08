uniform sampler2D image;
uniform sampler2D vertexMap;
uniform mat4 MV;
uniform float shadowIntensity;
uniform float fov;
uniform int width;
uniform int height;
uniform int order;
uniform int horizontal;
uniform int vertical;
uniform int zNear;
uniform int zFar;
varying vec2 f_texcoord;

float linearize(float depth) {

	float n = float(zNear);
	float f = float(zFar);
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}

float adjustColor(float centralColor, float currentColor, float centralDepth, float currentDepth) 
{

	if(currentColor == 0.0) return centralColor;
	else if(abs(linearize(currentDepth) - linearize(centralDepth)) >= 0.0025) return centralColor;
	else if(currentColor <= shadowIntensity && centralColor == 1.0) return centralColor;
	else if(currentColor == 1.0 && centralColor <= shadowIntensity) return centralColor;
	else return currentColor;
	
}

vec4 blur(vec2 step, vec2 center, vec2 dir, vec4 vertex)
{

	vec4 color = texture2D(image, center);
	int count = 0;
	float sum = 0.0;
	
	float deye = -(MV * vertex).z;
	float dscreen = 1.0/(2.0 * tan(fov/2.0));
	float scaleFactor = 50;
	float kernelCenter = (dscreen * order * scaleFactor)/(deye * 2.0);
	
	for(float sample = -kernelCenter; sample <= kernelCenter; sample++) {
		vec4 currentColor = texture2D(image, vec2(center.s + dir.s * sample * step.s, center.t + dir.t * sample * step.t));
		currentColor.r = adjustColor(color.r, currentColor.r, color.g, currentColor.g);
		sum += currentColor.r;
		count++;
	}
	
	sum /= float(count);
	return vec4(sum, color.g, 0.0, 0.0);
	
}

void main()
{	

	vec4 vertex = texture2D(vertexMap, f_texcoord);	
	if(vertex.x == 0.0) discard;

	vec2 step, center, dir;
	step.s = 1.0/float(width);
	step.t = 1.0/float(height);
	center.s = f_texcoord.s;
	center.t = f_texcoord.t;
	dir.s = horizontal;
	dir.t = vertical;

	gl_FragColor = blur(step, center, dir, vertex);
	
}