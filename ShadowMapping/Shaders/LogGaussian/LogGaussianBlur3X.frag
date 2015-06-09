uniform sampler2D image;
varying vec2 f_texcoord;
uniform int width;
uniform int height;

float log_conv ( float x0, vec4 X, float y0, vec4 Y )
{
    return ( X + log( x0 + (y0 * exp(Y - X) ) ) );
}

vec4 blur(vec2 step, vec2 center)
{
	
	float kernel[3];
	kernel[0] = 0.25;
	kernel[1] = 0.5;
	kernel[2] = 0.25;

	float sample[3];
	sample[0] = texture2D(image, vec2(center.s - 1.0 * step.s, center.t)).x;
	sample[1] = texture2D(image, vec2(center.s, center.t)).x;
	sample[2] = texture2D(image, vec2(center.s + 1.0 * step.s, center.t)).x;
	
	vec4 sum;
	sum = vec4(log_conv(kernel[0], vec4(sample[0]), kernel[1], vec4(sample[1])));
	for(int i = 2; i < 3; i++)
		sum = vec4(log_conv(1.0, sum, kernel[i], vec4(sample[i])));

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