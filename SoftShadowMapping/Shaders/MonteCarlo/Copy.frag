uniform sampler2D image;
varying vec2 f_texcoord;

void main()
{	

	gl_FragColor = texture2D(image, f_texcoord.st);
	
}