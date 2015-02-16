#include "Viewers\MyGLGeometryViewer.h"

MyGLGeometryViewer::MyGLGeometryViewer()
{

	fov = 45.f;
	zNear = 1.0f;
	zFar = 5000.0f;

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

void MyGLGeometryViewer::configureLinearization()
{

	GLuint zNearID = glGetUniformLocation(shaderProg, "zNear");
	glUniform1i(zNearID, zNear);
	GLuint zFarID = glGetUniformLocation(shaderProg, "zFar");
	glUniform1i(zFarID, zFar);
	
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

void MyGLGeometryViewer::configureShadow(ShadowParams shadowParams) 
{
	
	glm::mat4 bias;
	bias[0][0] = 0.5;	bias[0][1] = 0;		bias[0][2] = 0;		bias[0][3] = 0.0;
	bias[1][0] = 0;		bias[1][1] = 0.5;	bias[1][2] = 0;		bias[1][3] = 0.0;
	bias[2][0] = 0;		bias[2][1] = 0;		bias[2][2] = 0.5;	bias[2][3] = 0.0;
	bias[3][0] = 0.5;	bias[3][1] = 0.5;	bias[3][2] = 0.5;	bias[3][3] = 1.0;

	shadowParams.lightMVP = bias * shadowParams.lightMVP;
	GLuint lightMVPID = glGetUniformLocation(shaderProg, "lightMVP");
	glUniformMatrix4fv(lightMVPID, 1, GL_FALSE, &shadowParams.lightMVP[0][0]);
	GLuint lightMVPInvID = glGetUniformLocation(shaderProg, "lightMVPInv");
	glUniformMatrix4fv(lightMVPInvID, 1, GL_FALSE, &glm::inverse(shadowParams.lightMVP)[0][0]);
	GLuint shadowMapWidthID = glGetUniformLocation(shaderProg, "shadowMapWidth");
	glUniform1i(shadowMapWidthID, shadowParams.shadowMapWidth);
	GLuint shadowMapHeightID = glGetUniformLocation(shaderProg, "shadowMapHeight");
	glUniform1i(shadowMapHeightID, shadowParams.shadowMapHeight);
	GLuint shadowMapBilinearID = glGetUniformLocation(shaderProg, "bilinearPCF");
	glUniform1i(shadowMapBilinearID, shadowParams.bilinearPCF);
	GLuint shadowMapTriCubicID = glGetUniformLocation(shaderProg, "tricubicPCF");
	glUniform1i(shadowMapTriCubicID, shadowParams.tricubicPCF);
	GLuint shadowMapPoissonID = glGetUniformLocation(shaderProg, "poissonPCF");
	glUniform1i(shadowMapPoissonID, shadowParams.poissonPCF);
	GLuint shadowMapEdgeID = glGetUniformLocation(shaderProg, "edgePCF");
	glUniform1i(shadowMapEdgeID, shadowParams.edgePCF);
	GLuint shadowMapVSMID = glGetUniformLocation(shaderProg, "VSM");
	glUniform1i(shadowMapVSMID, shadowParams.VSM);
	GLuint shadowMapESMID = glGetUniformLocation(shaderProg, "ESM");
	glUniform1i(shadowMapESMID, shadowParams.ESM);
	GLuint shadowMapEVSMID = glGetUniformLocation(shaderProg, "EVSM");
	glUniform1i(shadowMapEVSMID, shadowParams.EVSM);
	GLuint shadowMapNaiveID = glGetUniformLocation(shaderProg, "naive");
	glUniform1i(shadowMapNaiveID, shadowParams.naive);
	GLuint shadowMap = glGetUniformLocation(shaderProg, "shadowMap");
	glUniform1i(shadowMap, 0);
	if(shadowParams.edgePCF) {
		GLuint edgeMap = glGetUniformLocation(shaderProg, "edgeMap");
		glUniform1i(edgeMap, 1);
	}
	configureLinearization();

	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, shadowParams.shadowMap);
	if(shadowParams.edgePCF) {
		glActiveTexture(GL_TEXTURE1);
		glBindTexture(GL_TEXTURE_2D, shadowParams.edgeMap);
		glGenerateMipmap(GL_TEXTURE_2D);
	}

	glActiveTexture(GL_TEXTURE0);
	glDisable(GL_TEXTURE_2D);
	if(shadowParams.edgePCF) {
		glActiveTexture(GL_TEXTURE1);
		glDisable(GL_TEXTURE_2D);
	}


}

void MyGLGeometryViewer::configurePSRMatrix(int xmin, int xmax, int ymin, int ymax, int scaleRange, int width, int height) 
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
	
	sx = 1.0f / ceil(1.0f / sx * scaleRange) * scaleRange;
	sy = 1.0f / ceil(1.0f / sy * scaleRange) * scaleRange;

	ox = ceil(ox * (width/2))/(width/2);
	oy = ceil(oy * (height/2))/(height/2);

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