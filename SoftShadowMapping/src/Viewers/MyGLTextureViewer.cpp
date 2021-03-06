#include "Viewers\MyGLTextureViewer.h"

void MyGLTextureViewer::createDepthComponentTextureArray(GLuint *texVBO, int index, int imageWidth, int imageHeight, int size)
{

	glBindTexture(GL_TEXTURE_2D_ARRAY, texVBO[index]);
	glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER); 
	glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
	
	glTexStorage3D(GL_TEXTURE_2D_ARRAY, 1, GL_DEPTH_COMPONENT32F_NV, imageWidth, imageHeight, size);

}

void MyGLTextureViewer::createRGBATextureArray(GLuint *texVBO, int index, int imageWidth, int imageHeight, int size)
{

	glBindTexture(GL_TEXTURE_2D_ARRAY, texVBO[index]);
	glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER); 
	glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
	
	glTexStorage3D(GL_TEXTURE_2D_ARRAY, 1, GL_RGBA8, imageWidth, imageHeight, size);

}

void MyGLTextureViewer::loadDepthComponentTexture(float *data, GLuint *texVBO, int index, int imageWidth, int imageHeight)
{

	glBindTexture(GL_TEXTURE_2D, texVBO[index]);
	glTexEnvi(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_REPLACE);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER); 
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
	//glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_COMPARE_MODE, GL_COMPARE_REF_TO_TEXTURE);
   // glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_COMPARE_FUNC, GL_LEQUAL);
   
	/*
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_BASE_LEVEL, 0);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAX_LEVEL, 0);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_COMPARE_MODE, GL_COMPARE_REF_TO_TEXTURE);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_COMPARE_FUNC, GL_LEQUAL);
	*/
	//glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH32F_STENCIL8_NV, imageWidth, imageHeight, 0, GL_DEPTH_STENCIL_EXT, GL_FLOAT_32_UNSIGNED_INT_24_8_REV_NV, data);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT32F_NV, imageWidth, imageHeight, 0, GL_DEPTH_COMPONENT, GL_FLOAT, data);

}

void MyGLTextureViewer::loadRGBTexture(const unsigned char *data, GLuint *texVBO, int index, int imageWidth, int imageHeight)
{

	glBindTexture(GL_TEXTURE_2D, texVBO[index]);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
	glTexEnvf(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_REPLACE);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, imageWidth, imageHeight, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
	
}

void MyGLTextureViewer::loadRGBTexture(float *data, GLuint *texVBO, int index, int imageWidth, int imageHeight, GLint params)
{

	
	glBindTexture(GL_TEXTURE_2D, texVBO[index]);
	//glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
	//glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, params);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, params);
	glTexParameteri(GL_TEXTURE_2D, GL_GENERATE_MIPMAP, GL_TRUE);
	glTexEnvf(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_REPLACE);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB32F, imageWidth, imageHeight, 0, GL_RGB, GL_FLOAT, data);
	glGenerateMipmap(GL_TEXTURE_2D);
	
}

void MyGLTextureViewer::loadRGBATexture(float *data, GLuint *texVBO, int index, int imageWidth, int imageHeight, GLint param)
{

	glBindTexture(GL_TEXTURE_2D, texVBO[index]);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, param);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, param);
	glTexParameteri(GL_TEXTURE_2D, GL_GENERATE_MIPMAP, GL_TRUE);
	
	glTexEnvf(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_REPLACE);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, imageWidth, imageHeight, 0, GL_RGBA, GL_FLOAT, data);
	glGenerateMipmap(GL_TEXTURE_2D);
	
}

void MyGLTextureViewer::loadRGBATexture(int *data, GLuint *texVBO, int index, int imageWidth, int imageHeight, GLint param)
{

	glBindTexture(GL_TEXTURE_2D, texVBO[index]);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, param);
	glTexParameteri(GL_TEXTURE_2D, GL_GENERATE_MIPMAP, GL_TRUE);
	glTexEnvf(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_REPLACE);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32I_EXT, imageWidth, imageHeight, 0, GL_RGBA_INTEGER_EXT, GL_INT, data);
	glGenerateMipmap(GL_TEXTURE_2D);
	
}

void MyGLTextureViewer::loadFrameBufferTexture(int x, int y, int width, int height, unsigned char *frameBuffer) {

	glReadPixels(x, y, width, height, GL_RGB, GL_UNSIGNED_BYTE, frameBuffer);

}

void MyGLTextureViewer::loadQuad()
{

	/* init_resources */
    GLfloat cube_texcoords[] = {
      // front
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      1.0, 1.0
    };
    glGenBuffers(1, &vbo_cube_texcoords);
    glBindBuffer(GL_ARRAY_BUFFER, vbo_cube_texcoords);
    glBufferData(GL_ARRAY_BUFFER, sizeof(cube_texcoords), cube_texcoords, GL_STATIC_DRAW);

	GLuint cube_elements[] = {
	  // front
	  3, 1, 0, 
	  2, 3, 0
	};
	glGenBuffers(1, &ibo_cube_elements);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ibo_cube_elements);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(cube_elements), cube_elements, GL_STATIC_DRAW);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);

}

void MyGLTextureViewer::configureSeparableFilter(int order, float *kernel, bool horizontal, bool vertical, float sigmaSpace, float sigmaColor) 
{

	glUseProgram(shaderProg);

	GLuint orderID = glGetUniformLocation(shaderProg, "order");
	glUniform1i(orderID, order);
	
	GLuint horizontalID = glGetUniformLocation(shaderProg, "horizontal");
	glUniform1i(horizontalID, (int)horizontal);
	
	GLuint verticalID = glGetUniformLocation(shaderProg, "vertical");
	glUniform1i(verticalID, (int)vertical);
	
	GLuint filterID = glGetUniformLocation(shaderProg, "kernel");
	glUniform1fv(filterID, order, kernel);

	GLuint sigmaSpaceID = glGetUniformLocation(shaderProg, "sigmaSpace");
	glUniform1f(sigmaSpaceID, sigmaSpace);
	
	GLuint sigmaColorID = glGetUniformLocation(shaderProg, "sigmaColor");
	glUniform1f(sigmaColorID, sigmaColor);
	
}


void MyGLTextureViewer::configureSeparableFilter(int order, bool horizontal, bool vertical, float shadowIntensity)
{

	glUseProgram(shaderProg);

	GLuint orderID = glGetUniformLocation(shaderProg, "order");
	glUniform1i(orderID, order);
	
	GLuint horizontalID = glGetUniformLocation(shaderProg, "horizontal");
	glUniform1i(horizontalID, (int)horizontal);
	
	GLuint verticalID = glGetUniformLocation(shaderProg, "vertical");
	glUniform1i(verticalID, (int)vertical);

	GLuint shadowIntensityID = glGetUniformLocation(shaderProg, "shadowIntensity");
	glUniform1f(shadowIntensityID, shadowIntensity);

	GLuint separableFilterID = glGetUniformLocation(shaderProg, "separableFilter");
	if(horizontal && vertical) glUniform1i(separableFilterID, 0);
	else glUniform1i(separableFilterID, 1);

}

void MyGLTextureViewer::drawTextureQuad() 
{

	GLuint attribute_texcoord = glGetAttribLocation(shaderProg, "texcoord");
    glEnableVertexAttribArray(attribute_texcoord);
    glBindBuffer(GL_ARRAY_BUFFER, vbo_cube_texcoords);
    glVertexAttribPointer(attribute_texcoord, 2, GL_FLOAT, GL_FALSE, 0, 0);
	
	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ibo_cube_elements);
	glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);

	glDisableVertexAttribArray(attribute_texcoord);
 
}

void MyGLTextureViewer::drawTextureOnShader(GLuint texture, int imageWidth, int imageHeight)
{

	glUseProgram(shaderProg);

	GLuint width = glGetUniformLocation(shaderProg, "width");
	glUniform1i(width, imageWidth);
	GLuint height = glGetUniformLocation(shaderProg, "height");
	glUniform1i(height, imageHeight);

	GLuint shadowMap = glGetUniformLocation(shaderProg, "image");
	glUniform1i(shadowMap, 7);
	
	glActiveTexture(GL_TEXTURE7);
	glBindTexture(GL_TEXTURE_2D, texture);
	  
	drawTextureQuad();

	glActiveTexture(GL_TEXTURE7);
	glDisable(GL_TEXTURE_2D);

	glUseProgram(0);

}

void MyGLTextureViewer::drawTexturesForBilateralFiltering(GLuint lightDepthTexture, GLuint eyeDepthTexture, GLuint shadowTexture, int imageWidth, int imageHeight)
{

	glUseProgram(shaderProg);

	GLuint width = glGetUniformLocation(shaderProg, "width");
	glUniform1i(width, imageWidth);
	GLuint height = glGetUniformLocation(shaderProg, "height");
	glUniform1i(height, imageHeight);

	GLuint lightDepthTextureID = glGetUniformLocation(shaderProg, "lightDepthTexture");
	glUniform1i(lightDepthTextureID, 7);
	
	glActiveTexture(GL_TEXTURE7);
	glBindTexture(GL_TEXTURE_2D, lightDepthTexture);
	glGenerateMipmap(GL_TEXTURE_2D);
	
	GLuint eyeDepthTextureID = glGetUniformLocation(shaderProg, "eyeDepthTexture");
	glUniform1i(eyeDepthTextureID, 8);
	
	glActiveTexture(GL_TEXTURE8);
	glBindTexture(GL_TEXTURE_2D, eyeDepthTexture);
	glGenerateMipmap(GL_TEXTURE_2D);
	
	GLuint shadowTextureID = glGetUniformLocation(shaderProg, "shadowTexture");
	glUniform1i(shadowTextureID, 9);
	
	glActiveTexture(GL_TEXTURE9);
	glBindTexture(GL_TEXTURE_2D, shadowTexture);
	glGenerateMipmap(GL_TEXTURE_2D);
	
	//drawTextureQuad()
    
	glActiveTexture(GL_TEXTURE7);
	glDisable(GL_TEXTURE_2D);

	glActiveTexture(GL_TEXTURE8);
	glDisable(GL_TEXTURE_2D);

	glActiveTexture(GL_TEXTURE9);
	glDisable(GL_TEXTURE_2D);

	//glUseProgram(0);

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