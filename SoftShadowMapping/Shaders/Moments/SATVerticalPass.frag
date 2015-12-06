uniform sampler2D image;
varying vec2 f_texcoord;
uniform int width;
uniform int height;
uniform int iteration;

void main()
{	

	vec2 step = vec2(1.0/width, 1.0/height);
	vec4 currentPixel = texture2D(image, f_texcoord.st);
	vec4 topPixel = texture2D(image, vec2(f_texcoord.s, f_texcoord.t - exp2(iteration) * step.t));
	gl_FragColor = currentPixel + topPixel;

}