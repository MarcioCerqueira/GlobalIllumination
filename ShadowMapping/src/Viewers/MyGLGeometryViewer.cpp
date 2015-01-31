#include "Viewers\MyGLGeometryViewer.h"

MyGLGeometryViewer::MyGLGeometryViewer()
{

	fov = 45.f;
	zNear = 1.0f;
	zFar = 5000.0f;

}

void MyGLGeometryViewer::configureAmbient(GLfloat *eye, GLfloat *at, GLfloat *up) {

	glEnable(GL_DEPTH_TEST);
	glMatrixMode(GL_PROJECTION);
	glLoadIdentity();

    gluPerspective(60.0, (GLfloat)640.f/480.f, 0.01, 5000);
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    gluLookAt(eye[0], eye[1], eye[2], at[0], at[1], at[2], up[0], up[1], up[2]);
    
	glMatrixMode(GL_TEXTURE);
	glLoadIdentity();

	glDisable(GL_LIGHTING);
	glDisable(GL_ALPHA_TEST);
	glDisable(GL_BLEND);
	glEnable(GL_DEPTH_TEST);

}

void MyGLGeometryViewer::configureAmbient(int windowWidth, int windowHeight)
{
	
	projection = glm::perspective(fov, (GLfloat)windowWidth/windowHeight, zNear, zFar);
	view = glm::lookAt(eye, look, up);
	model = glm::mat4(1.0f);

	glDisable(GL_LIGHTING);
	glDisable(GL_ALPHA_TEST);
	glDisable(GL_BLEND);
	glEnable(GL_DEPTH_TEST);
	
}

void MyGLGeometryViewer::configureLight() {
	
	GLfloat ambient[4] = {0.1, 0.1, 0.1, 1.0};
	GLfloat diffuse[4] = {0.9, 0.9, 0.9, 1.0};
	GLfloat specular[4] = {1.0, 1.0, 1.0, 1.0};
	GLfloat position[4] = {10.0, 40.0, 0.0, 1.0};

	GLfloat specularity[4] = {1.0, 1.0, 1.0, 1.0};
	GLint shininess = 60;

	glClearColor(0.0, 0, 0, 1);
	
	glShadeModel(GL_SMOOTH);

	glMaterialfv(GL_FRONT,GL_SPECULAR, specularity);
	glMateriali(GL_FRONT,GL_SHININESS, shininess);

	glLightModelfv(GL_LIGHT_MODEL_AMBIENT, ambient);

	glLightfv(GL_LIGHT0, GL_AMBIENT, ambient); 
	glLightfv(GL_LIGHT0, GL_DIFFUSE, diffuse);
	glLightfv(GL_LIGHT0, GL_SPECULAR, specular);
	glLightfv(GL_LIGHT0, GL_POSITION, position);

	glEnable(GL_COLOR_MATERIAL);
	glEnable(GL_LIGHTING);
	glEnable(GL_LIGHT0);
	glEnable(GL_DEPTH_TEST);

}

void MyGLGeometryViewer::configurePhong(glm::vec3 lightPosition, glm::vec3 cameraPosition) 
{

	glm::mat4 mvp = projection * view * model;
	glm::mat4 mv = view * model;
	glm::mat3 normalMatrix = glm::inverseTranspose(glm::mat3(mv));

	GLuint mvpId = glGetUniformLocation(shaderProg, "MVP");
	glUniformMatrix4fv(mvpId, 1, GL_FALSE, &mvp[0][0]);
	GLuint mvId = glGetUniformLocation(shaderProg, "MV");
	glUniformMatrix4fv(mvId, 1, GL_FALSE, &mv[0][0]);
	GLuint nMId = glGetUniformLocation(shaderProg, "normalMatrix");
	glUniformMatrix3fv(nMId, 1, GL_FALSE, &normalMatrix[0][0]);
	GLuint lightId = glGetUniformLocation(shaderProg, "lightPosition");
	glUniform3f(lightId, lightPosition[0], lightPosition[1], lightPosition[2]);
	GLuint cameraLightId = glGetUniformLocation(shaderProg, "cameraPosition");
	glUniform3f(cameraLightId, cameraPosition[0], cameraPosition[1], cameraPosition[2]);

}

void MyGLGeometryViewer::configureShadow(glm::mat4 lightMVP, int shadowMapWidth, int shadowMapHeight) 
{
	
	glm::mat4 bias;
	bias[0][0] = 0.5;	bias[0][1] = 0;		bias[0][2] = 0;		bias[0][3] = 0.0;
	bias[1][0] = 0;		bias[1][1] = 0.5;	bias[1][2] = 0;		bias[1][3] = 0.0;
	bias[2][0] = 0;		bias[2][1] = 0;		bias[2][2] = 0.5;	bias[2][3] = 0.0;
	bias[3][0] = 0.5;	bias[3][1] = 0.5;	bias[3][2] = 0.5;	bias[3][3] = 1.0;

	lightMVP = bias * lightMVP;
	GLuint lightMVPID = glGetUniformLocation(shaderProg, "lightMVP");
	glUniformMatrix4fv(lightMVPID, 1, GL_FALSE, &lightMVP[0][0]);
	GLuint lightMVPInvID = glGetUniformLocation(shaderProg, "lightMVPInv");
	glUniformMatrix4fv(lightMVPInvID, 1, GL_FALSE, &glm::inverse(lightMVP)[0][0]);
	GLuint shadowMapWidthID = glGetUniformLocation(shaderProg, "shadowMapWidth");
	glUniform1i(shadowMapWidthID, shadowMapWidth);
	GLuint shadowMapHeightID = glGetUniformLocation(shaderProg, "shadowMapHeight");
	glUniform1i(shadowMapHeightID, shadowMapHeight);


}

void MyGLGeometryViewer::configurePSRMatrix(int xmin, int xmax, int ymin, int ymax, int width, int height) 
{

	//In OpenGL, the interval [-1, 1] for the y-axis is from bottom to top.
	//Conventionally, we consider the interval [min, max] for the y-axis from top to bottom.

	ymin = width - ymin;
	ymax = height - ymax;

	int aux;
	aux = ymin;
	ymin = ymax;
	ymax = aux;

	float normalizedXMin = (xmin - 0.5 * width)/(0.5 * width);
	float normalizedXMax = (xmax - 0.5 * width)/(0.5 * width);
	float normalizedYMin = (ymin - 0.5 * height)/(0.5 * height);
	float normalizedYMax = (ymax - 0.5 * height)/(0.5 * height);
	
	float sx = 2.0/(normalizedXMax - normalizedXMin);
	float sy = 2.0/(normalizedYMax - normalizedYMin);
	float ox = (-sx * (normalizedXMax + normalizedXMin))/2.0;
	float oy = (-sy * (normalizedYMax + normalizedYMin))/2.0;
	ox = ceil(ox * width)/width;
	oy = ceil(oy * height)/height;

	psr[0][0] = sx;		psr[0][1] = 0;		psr[0][2] = 0;		psr[0][3] = 0.0;
	psr[1][0] = 0;		psr[1][1] = sy;		psr[1][2] = 0;		psr[1][3] = 0.0;
	psr[2][0] = 0;		psr[2][1] = 0;		psr[2][2] = 1.0;	psr[2][3] = 0.0;
	psr[3][0] = ox;		psr[3][1] = oy;		psr[3][2] = 0;		psr[3][3] = 1.0;

}
	

void MyGLGeometryViewer::drawPlane(float x, float y, float z) {
	
	glBegin(GL_QUADS);
	glVertex3f(-x, 0.0, -z);
	glVertex3f(+x, 0.0, -z);
	glVertex3f(+x, 0.0, +z);
	glVertex3f(-x, 0.0, +z);
	glEnd();

}

void MyGLGeometryViewer::drawMesh(GLuint *VBOs, int numberOfIndices)
{

	GLuint vbo_cube_texcoords;
	
	GLint attribute_vert = glGetAttribLocation(shaderProg, "vertex");
	glEnableVertexAttribArray(attribute_vert);
	glBindBuffer(GL_ARRAY_BUFFER, VBOs[0]);
	glVertexAttribPointer(attribute_vert, 3, GL_FLOAT, GL_FALSE, 0, 0);

	GLint attribute_norm = glGetAttribLocation(shaderProg, "normal");
	glEnableVertexAttribArray(attribute_norm);
	glBindBuffer(GL_ARRAY_BUFFER, VBOs[1]);
	glVertexAttribPointer(attribute_norm, 3, GL_FLOAT, GL_TRUE, 0, 0);

	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, VBOs[2]);
	glDrawElements(GL_TRIANGLES, numberOfIndices, GL_UNSIGNED_INT, 0);

	glDisableVertexAttribArray(attribute_vert);
	glDisableVertexAttribArray(attribute_norm);

}

void MyGLGeometryViewer::loadVBOs(GLuint *VBOs, float *pointCloud, float *normalVector, int *indices, int numberOfPoints, int numberOfIndices)
{

	glBindBuffer(GL_ARRAY_BUFFER, VBOs[0]);
	glBufferData(GL_ARRAY_BUFFER, numberOfPoints * sizeof(float), pointCloud, GL_DYNAMIC_DRAW);

	glBindBuffer(GL_ARRAY_BUFFER, VBOs[1]);
	glBufferData(GL_ARRAY_BUFFER, numberOfPoints * sizeof(float), normalVector, GL_DYNAMIC_DRAW);

	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, VBOs[2]);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, numberOfIndices * sizeof(int), indices, GL_DYNAMIC_DRAW);

}