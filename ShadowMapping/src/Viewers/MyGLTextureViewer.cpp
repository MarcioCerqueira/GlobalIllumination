#include "Viewers\MyGLTextureViewer.h"

void MyGLTextureViewer::loadDepthComponentTexture(float *data, GLuint *texVBO, int index, int imageWidth, int imageHeight)
{

	glBindTexture(GL_TEXTURE_2D, texVBO[index]);
	glTexEnvi(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_REPLACE);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT, imageWidth, imageHeight, 0, GL_DEPTH_COMPONENT, GL_FLOAT, data);

}

void MyGLTextureViewer::loadRGBTexture(const unsigned char *data, GLuint *texVBO, int index, int imageWidth, int imageHeight)
{

	glBindTexture(GL_TEXTURE_2D, texVBO[index]);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
	glTexEnvf(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_REPLACE);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, imageWidth, imageHeight, 0, GL_RGB, GL_UNSIGNED_BYTE, data);

}

void MyGLTextureViewer::loadShadowTextureMatrix(GLuint textureUnit) 
{

	// Moving from unit cube [-1,1] to [0,1]  
	const GLfloat bias[16] = {	
		0.5, 0.0, 0.0, 0.0, 
		0.0, 0.5, 0.0, 0.0,
		0.0, 0.0, 0.5, 0.0,
	0.5, 0.5, 0.5, 1.0};	
		
	glMatrixMode(GL_TEXTURE);
	glActiveTexture(textureUnit);
		
	glLoadIdentity();	
	//glMultMatrixf(bias);
	glMultMatrixf (lightProjection);
	glMultMatrixf (lightModelView);	
	
	/*
	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();
	glMultMatrixf (lightProjection);
	
	glMatrixMode(GL_MODELVIEW);
	glLoadIdentity();
	glMultMatrixf (lightModelView);	
	*/
	//printf("%f %f %f %f\n", lightModelView[12], lightModelView[13], lightModelView[14], lightModelView[15]);
}


void MyGLTextureViewer::drawTextureOnShader(GLuint *texVBO, int index, int windowWidth, int windowHeight, GLuint shaderProg)
{

	glUseProgram(shaderProg);
	
	gluOrtho2D( 0, windowWidth, windowHeight, 0 ); 
	glMatrixMode( GL_MODELVIEW );
	glLoadIdentity();

	GLuint texLoc = glGetUniformLocation(shaderProg, "image");
	glUniform1i(texLoc, 0);
	
	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, texVBO[index]);

	glBegin(GL_QUADS);
		glTexCoord2f(0.0f, 0.0f); 
		glVertex2f(0.0f, 0.0f);
		glTexCoord2f(1.0f, 0.0f); 
		glVertex2f(windowWidth, 0.0f);
		glTexCoord2f(1.0f, 1.0f); 
		glVertex2f(windowWidth, windowHeight);
		glTexCoord2f(0.0f, 1.0f); 
		glVertex2f(0.0f, windowHeight);
	glEnd();

	glActiveTexture(GL_TEXTURE0);
	glDisable(GL_TEXTURE_2D);
	
	glUseProgram(0);

}

void MyGLTextureViewer::drawShadow(GLuint *texVBO, int sceneColorIndex, int shadowIndex, int windowWidth, int windowHeight, GLuint shaderProg) 
{

	glUseProgram(shaderProg);
	
	gluOrtho2D( 0, windowWidth, windowHeight, 0 ); 
	glMatrixMode( GL_MODELVIEW );
	glLoadIdentity();

	GLuint texLoc = glGetUniformLocation(shaderProg, "sceneMap");
	glUniform1i(texLoc, 0);
	texLoc = glGetUniformLocation(shaderProg, "shadowMap");
	glUniform1i(texLoc, 1);
	
	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, texVBO[sceneColorIndex]);
	glActiveTexture(GL_TEXTURE1);
	glBindTexture(GL_TEXTURE_2D, texVBO[shadowIndex]);

	glBegin(GL_QUADS);
		glTexCoord2f(0.0f, 0.0f); 
		glVertex2f(0.0f, 0.0f);
		glTexCoord2f(1.0f, 0.0f); 
		glVertex2f(windowWidth, 0.0f);
		glTexCoord2f(1.0f, 1.0f); 
		glVertex2f(windowWidth, windowHeight);
		glTexCoord2f(0.0f, 1.0f); 
		glVertex2f(0.0f, windowHeight);
	glEnd();

	glActiveTexture(GL_TEXTURE0);
	glDisable(GL_TEXTURE_2D);
	glActiveTexture(GL_TEXTURE1);
	glDisable(GL_TEXTURE_2D);

	glUseProgram(0);

}

void MyGLTextureViewer::saveShadowTextureMatrix() 
{
		
	// Grab modelview and transformation matrices
	glGetFloatv(GL_MODELVIEW_MATRIX, lightModelView);
	glGetFloatv(GL_PROJECTION_MATRIX, lightProjection);	

}