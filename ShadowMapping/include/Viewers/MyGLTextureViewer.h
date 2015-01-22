#ifndef MYGLTEXTUREVIEWER_H
#define MYGLTEXTUREVIEWER_H


#include <stdlib.h>
#include <GL/glew.h>
#include <GL/glut.h>
#include <stdio.h>

class MyGLTextureViewer
{

public:
	void loadDepthComponentTexture(float *data, GLuint *texVBO, int index, int imageWidth, int imageHeight);
	void loadRGBTexture(const unsigned char *data, GLuint *texVBO, int index, int imageWidth, int imageHeight);
	void loadShadowTextureMatrix(GLuint textureUnit);
	void drawTextureOnShader(GLuint *texVBO, int index, int windowWidth, int windowHeight, GLuint shaderProg);
	void drawShadow(GLuint *texVBO, int sceneColorIndex, int shadowIndex, int windowWidth, int windowHeight, GLuint shaderProg);
	void saveShadowTextureMatrix();
	void sendData(GLuint shaderProg) {
		GLuint texLoc = glGetUniformLocation(shaderProg, "model");
		glUniformMatrix4fv(texLoc, 1, GL_FALSE, &lightModelView[0]);
	}
	
	
private:
	GLfloat lightModelView[16];
	GLfloat lightProjection[16];

};

#endif