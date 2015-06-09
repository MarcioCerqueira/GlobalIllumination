uniform sampler2D image;
varying vec2 f_texcoord;
uniform int width;
uniform int height;

vec4 blur(vec2 step, vec2 center)
{
	
	vec4 sum = vec4(0.0);
	sum += texture2D(image, vec2(center.s - 4.0 * step.s, center.t)) * 0.04;
	sum += texture2D(image, vec2(center.s - 3.0 * step.s, center.t)) * 0.08;
	sum += texture2D(image, vec2(center.s - 2.0 * step.s, center.t)) * 0.12;
	sum += texture2D(image, vec2(center.s - 1.0 * step.s, center.t)) * 0.16;
	sum += texture2D(image, vec2(center.s, center.t)) * 0.2;
	sum += texture2D(image, vec2(center.s + 1.0 * step.s, center.t)) * 0.16;
	sum += texture2D(image, vec2(center.s + 2.0 * step.s, center.t)) * 0.12;
	sum += texture2D(image, vec2(center.s + 3.0 * step.s, center.t)) * 0.08;
	sum += texture2D(image, vec2(center.s + 4.0 * step.s, center.t)) * 0.04;

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