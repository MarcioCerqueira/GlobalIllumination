uniform sampler2D image;
uniform int width;
uniform int height;
varying vec2 f_texcoord;

void main()
{	

	float sum = texture2D(image, f_texcoord.st).r;
	if(sum.r == 0.63 || sum.r == 0.0 || sum.r == 4.0) discard;
	
	vec2 step = vec2(1.0/float(width), 1.0/float(height));
	for(int y = -1; y <= 1; y++)
		for(int x = -1; x <= 1; x++)
			if(sum.r != texture2D(image, vec2(x * step.x + f_texcoord.x, y * step.y + f_texcoord.y)).r)
				discard;
	
	gl_FragColor = vec4(sum.r, 0.0, 0.0, 0.0);

}