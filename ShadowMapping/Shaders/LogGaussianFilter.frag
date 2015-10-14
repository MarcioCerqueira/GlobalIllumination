uniform sampler2D image;
varying vec2 f_texcoord;
uniform int width;
uniform int height;
uniform int order;
uniform int horizontal;
uniform int vertical;
uniform float kernel[25];

float log_conv ( float x0, vec4 X, float y0, vec4 Y )
{
    return ( X + log( x0 + (y0 * exp(Y - X) ) ) );
}

vec4 blur(vec2 step, vec2 center, vec2 dir)
{

	vec4 sum = vec4(0.0);
	int kernelCenter = order/2;
	int kernelStep = -kernelCenter;
	
	float sample[2];
	sample[0] = texture2D(image, vec2(center.s + dir.s * kernelStep * step.s, center.t + dir.t * kernelStep * step.t)).x;
	kernelStep++;
	sample[1] = texture2D(image, vec2(center.s + dir.s * kernelStep * step.s, center.t + dir.t * kernelStep * step.t)).x;
	
	sum = vec4(log_conv(kernel[0], vec4(sample[0]), kernel[1], vec4(sample[1])));

	for(int i = 2; i < order; i++) {
		kernelStep++;
		sum = vec4(log_conv(1.0, sum, kernel[i], vec4(texture2D(image, vec2(center.s + dir.s * kernelStep * step.s, center.t + dir.t * kernelStep * step.t)).x)));
	}

	return sum;
	
}

void main()
{	

	vec2 step, center, dir;
	step.s = 1.0/float(width);
	step.t = 1.0/float(height);
	center.s = f_texcoord.s;
	center.t = f_texcoord.t;
	dir.s = horizontal ? 1.0 : 0.0;
	dir.t = vertical ? 1.0 : 0.0;
	gl_FragColor = blur(step, center, dir);
	
}