uniform sampler2D image;
varying vec2 f_texcoord;
uniform int width;
uniform int height;
uniform int order;
uniform int horizontal;
uniform int vertical;
uniform float kernel[33];

vec4 blur(vec2 step, vec2 center, vec2 dir)
{

	vec4 sum = vec4(0.0);
	int kernelCenter = order/2;

	for(int sample = -kernelCenter; sample <= kernelCenter; sample++)
		sum += texture2D(image, vec2(center.s + dir.s * sample * step.s, center.t + dir.t * sample * step.t)) * kernel[kernelCenter + sample];

	return sum;
	
}

void main()
{	

	vec2 step, center, dir;
	step.s = 1.0/float(width);
	step.t = 1.0/float(height);
	center.s = f_texcoord.s;
	center.t = f_texcoord.t;
	dir.s = horizontal;
	dir.t = vertical;
	gl_FragColor = blur(step, center, dir);
	
}