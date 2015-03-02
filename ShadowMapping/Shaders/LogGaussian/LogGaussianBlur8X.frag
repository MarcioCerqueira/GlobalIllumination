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

	float kernel[8];
	kernel[0] = 0.0078125;
	kernel[1] = 0.0546875;
	kernel[2] = 0.1640625;
	kernel[3] = 0.2734375;
	kernel[4] = 0.2734375;
	kernel[5] = 0.1640625;
	kernel[6] = 0.0546875;
	kernel[7] = 0.0078125;

	vec4 sample[8];
	sample[0] = texture2D(image, vec2(center.s - 4 * step.s, center.t));
	sample[1] = texture2D(image, vec2(center.s - 3 * step.s, center.t));
	sample[2] = texture2D(image, vec2(center.s - 2 * step.s, center.t));
	sample[3] = texture2D(image, vec2(center.s - 1 * step.s, center.t));
	sample[4] = texture2D(image, vec2(center.s + 1 * step.s, center.t));
	sample[5] = texture2D(image, vec2(center.s + 2 * step.s, center.t));
	sample[6] = texture2D(image, vec2(center.s + 3 * step.s, center.t));
	sample[7] = texture2D(image, vec2(center.s + 4 * step.s, center.t));
	
	vec4 sum;
	sum = log_conv(kernel[0], sample[0], kernel[1], sample[1]);
	for(int i = 2; i < 8; i++)
		sum = log_conv(1.0, sum, kernel[i], sample[i]);

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