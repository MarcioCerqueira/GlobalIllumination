uniform sampler2D image;
uniform sampler2D vertexMap;
uniform mat4 MV;
uniform float fov;
uniform int width;
uniform int height;
uniform int order;
uniform int horizontal;
uniform int vertical;
uniform int zNear;
uniform int zFar;
uniform int separableFilter;
varying vec2 f_texcoord;

float linearize(float depth) {

	float n = float(zNear);
	float f = float(zFar);
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}

vec4 morphology(vec2 step, vec2 center, vec2 dir, vec4 vertex)
{
	
	vec4 color = texture2D(image, f_texcoord);
	//if(color.b != 1.0) return vec4(0.0);
	if(color.r == 0.5 && separableFilter == 1) return vec4(color.rg, 0.0, 0.0);

	float deye = -(MV * vertex).z;
	float dscreen = 1.0/(2.0 * tan(fov/2.0));
	float scaleFactor = 50;
	float kernelCenter = (dscreen * order * scaleFactor)/(deye * 2.0);
	
	if(separableFilter == 1) {

		for(float sample = -kernelCenter; sample <= kernelCenter; sample++) {
			vec3 currentColor = texture2D(image, vec2(center.s + dir.s * sample * step.s, center.t + dir.t * sample * step.t)).rgb;
			if(currentColor.r != color.r && currentColor.r > 0.0 && currentColor.b == 1.0 && abs(linearize(currentColor.g) - linearize(color.g)) < 0.0025)
				return vec4(0.5, color.gb, 0.0);
		}
	
	} else {

		vec2 sample = vec2(0.0);
		for(sample.s = -kernelCenter; sample.s <= kernelCenter; sample.s++) {
			for(sample.t = -kernelCenter; sample.t <= kernelCenter; sample.t++) {
				vec3 currentColor = texture2D(image, vec2(center.s + sample.s * step.s, center.t + sample.t * step.t)).rgb;
				if(currentColor.r != color.r && currentColor.r > 0.0 && currentColor.b == 1.0 && abs(linearize(currentColor.g) - linearize(color.g)) < 0.0025)
					return vec4(0.5, color.g, 0.0, 0.0);
			}
		}

	}

	if(separableFilter == 1) return vec4(color.rgb, 0.0);
	else return vec4(clamp(color.r * 2.0 - 0.5, 0.0, 1.0), color.g, 0.0, 0.0);

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

	vec4 color = morphology(step, center, dir, vertex);
	
	if(dir.s == 1.0 && dir.t == 0.0) {
		color.r = clamp(color.r * 2.0 - 0.5, 0.0, 1.0);
		color.b = 0.0;
	}

	gl_FragColor = color;

}