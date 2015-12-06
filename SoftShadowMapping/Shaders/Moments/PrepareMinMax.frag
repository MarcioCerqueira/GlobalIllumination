uniform sampler2D image;
varying vec2 f_texcoord;

void main()
{	

	float shadow = texture2D(image, f_texcoord.st).x;
	gl_FragColor = vec4(shadow + 0.001, shadow, 0.0, 1.0);
	// 
}