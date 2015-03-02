uniform sampler2D image;
varying vec2 f_texcoord;
uniform int width;
uniform int height;

vec4 blur(vec2 step, vec2 center)
{

	vec4 sum = vec4(0.0);
	sum += texture2D(image, vec2(center.s - 2 * step.s, center.t)) * 0.0625;
	sum += texture2D(image, vec2(center.s - 1 * step.s, center.t)) * 0.25;
	sum += texture2D(image, vec2(center.s, center.t)) * 0.375;
	sum += texture2D(image, vec2(center.s + 1 * step.s, center.t)) * 0.25;
	sum += texture2D(image, vec2(center.s + 2 * step.s, center.t)) * 0.0625;
	return sum;
	
}

void main()
{	

	vec2 step, center;
	step.s = 1.0/float(width);
	step.t = 1.0/float(height);
	center.s = f_texcoord.s;
	center.t = f_texcoord.t;
	gl_FragColor = blur(step, center);
	
}