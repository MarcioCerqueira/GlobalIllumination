attribute vec2 texcoord;
varying vec2 f_texcoord;

void main(void)
{

   gl_Position = vec4(texcoord, 0, 1);
   f_texcoord = texcoord * 0.5 + 0.5;
	
}