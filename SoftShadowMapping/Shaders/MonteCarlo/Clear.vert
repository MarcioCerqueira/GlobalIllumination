attribute vec2 texcoord;

void main(void)
{

   gl_Position = vec4(texcoord, 0, 1);
   
}