#include "Viewers\MyGLGeometryViewer.h"

MyGLGeometryViewer::MyGLGeometryViewer()
{

	fov = 45.f;
	zNear = 1.0f;
	zFar = 1000.0f;
	normalMatrix = glm::mat3(1.0);
	hasNormalMatrixBeenSet = false;

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

	if(isCameraViewpoint && !hasNormalMatrixBeenSet) {
		normalMatrix = glm::inverseTranspose(glm::mat3(mv));
		hasNormalMatrixBeenSet = true;
	} 

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
	GLuint lightMVID = glGetUniformLocation(shaderProg, "lightMV");
	glUniformMatrix4fv(lightMVID, 1, GL_FALSE, &shadowParams.lightMV[0][0]);
	GLuint lightPID = glGetUniformLocation(shaderProg, "lightP");
	glUniformMatrix4fv(lightPID, 1, GL_FALSE, &shadowParams.lightP[0][0]);
	GLuint lightMVPInvID = glGetUniformLocation(shaderProg, "lightMVPInv");
	glUniformMatrix4fv(lightMVPInvID, 1, GL_FALSE, &glm::inverse(shadowParams.lightMVP)[0][0]);
	GLuint shadowMapWidthID = glGetUniformLocation(shaderProg, "shadowMapWidth");
	glUniform1i(shadowMapWidthID, shadowParams.shadowMapWidth);
	GLuint shadowMapHeightID = glGetUniformLocation(shaderProg, "shadowMapHeight");
	glUniform1i(shadowMapHeightID, shadowParams.shadowMapHeight);
	GLuint shadowIntensityID = glGetUniformLocation(shaderProg, "shadowIntensity");
	glUniform1f(shadowIntensityID, shadowParams.shadowIntensity);
	GLuint shadowMapBilinearID = glGetUniformLocation(shaderProg, "bilinearPCF");
	glUniform1i(shadowMapBilinearID, shadowParams.bilinearPCF);
	GLuint shadowMapTriCubicID = glGetUniformLocation(shaderProg, "tricubicPCF");
	glUniform1i(shadowMapTriCubicID, shadowParams.tricubicPCF);
	GLuint shadowMapESMID = glGetUniformLocation(shaderProg, "ESM");
	glUniform1i(shadowMapESMID, shadowParams.ESM);
	GLuint shadowMapEVSMID = glGetUniformLocation(shaderProg, "EVSM");
	glUniform1i(shadowMapEVSMID, shadowParams.EVSM);
	configureMoments(shadowParams);
	GLuint shadowMapNaiveID = glGetUniformLocation(shaderProg, "naive");
	glUniform1i(shadowMapNaiveID, shadowParams.naive);
	GLuint shadowMapDepthBiasID = glGetUniformLocation(shaderProg, "useAdaptiveDepthBias");
	glUniform1i(shadowMapDepthBiasID, shadowParams.adaptiveDepthBias);
	GLuint shadowMap = glGetUniformLocation(shaderProg, "shadowMap");
	glUniform1i(shadowMap, 0);

	configureLinearization();

	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, shadowParams.shadowMap);

	glActiveTexture(GL_TEXTURE0);
	glDisable(GL_TEXTURE_2D);

}

void MyGLGeometryViewer::configureMoments(ShadowParams shadowParams)
{

	glm::mat4 mQuantization, mQuantizationInverse;
	/*
	mQuantization[0][0] = -2.07224649;	mQuantization[0][1] = 32.2370378;	mQuantization[0][2] = -68.5710746;	mQuantization[0][3] = 39.3703274;
	mQuantization[1][0] = 13.7948857;	mQuantization[1][1] = -59.4683976;	mQuantization[1][2] = 82.035975;	mQuantization[1][3] = -35.3649032;
	mQuantization[2][0] = 0.105877704;	mQuantization[2][1] = -1.90774663;	mQuantization[2][2] = 9.34965551;	mQuantization[2][3] = -6.65434907;
	mQuantization[3][0] = 9.79240621;	mQuantization[3][1] = -33.76521106;	mQuantization[3][2] = 47.9456097;	mQuantization[3][3] = -23.9728048;
	*/
	mQuantization[0][0] = 4;	mQuantization[0][1] = 0;	mQuantization[0][2] = 0;	mQuantization[0][3] = 0;
	mQuantization[1][0] = 4;	mQuantization[1][1] = 4;	mQuantization[1][2] = 0;	mQuantization[1][3] = 0;
	mQuantization[2][0] = 4;	mQuantization[2][1] = 0;	mQuantization[2][2] = 4;	mQuantization[2][3] = 0;
	mQuantization[3][0] = 4;	mQuantization[3][1] = 0;	mQuantization[3][2] = 0;	mQuantization[3][3] = 4;
	
	mQuantization = glm::transpose(mQuantization);
	mQuantizationInverse = glm::inverse(mQuantization);
	
	GLuint shadowMapVSMID = glGetUniformLocation(shaderProg, "VSM");
	glUniform1i(shadowMapVSMID, shadowParams.VSM);
	GLuint shadowMapMSMID = glGetUniformLocation(shaderProg, "MSM");
	glUniform1i(shadowMapMSMID, shadowParams.MSM);

	if(shadowParams.MSM) {
		GLuint tQuantizationID = glGetUniformLocation(shaderProg, "tQuantization");
		glUniform4f(tQuantizationID, 0.0359558848, 0.0, 0.0, 0.0);
		GLuint mQuantizationID = glGetUniformLocation(shaderProg, "mQuantization");
		glUniformMatrix4fv(mQuantizationID, 1, GL_FALSE, &mQuantization[0][0]);
		GLuint mQuantizationInverseID = glGetUniformLocation(shaderProg, "mQuantizationInverse");
		glUniformMatrix4fv(mQuantizationInverseID, 1, GL_FALSE, &mQuantizationInverse[0][0]);
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

void MyGLGeometryViewer::configureRevectorization(ShadowParams shadowParams, int imageWidth, int imageHeight)
{

	glm::mat4 bias;
	bias[0][0] = 0.5;	bias[0][1] = 0;		bias[0][2] = 0;		bias[0][3] = 0.0;
	bias[1][0] = 0;		bias[1][1] = 0.5;	bias[1][2] = 0;		bias[1][3] = 0.0;
	bias[2][0] = 0;		bias[2][1] = 0;		bias[2][2] = 0.5;	bias[2][3] = 0.0;
	bias[3][0] = 0.5;	bias[3][1] = 0.5;	bias[3][2] = 0.5;	bias[3][3] = 1.0;
	
	shadowParams.lightMVP = bias * shadowParams.lightMVP;
	glm::mat4 inverseMVP = glm::inverse(shadowParams.lightMVP);
	
	GLuint width = glGetUniformLocation(shaderProg, "width");
	glUniform1i(width, imageWidth);
	GLuint height = glGetUniformLocation(shaderProg, "height");
	glUniform1i(height, imageHeight);
	GLuint shadowMapWidth = glGetUniformLocation(shaderProg, "shadowMapWidth");
	glUniform1i(shadowMapWidth, shadowParams.shadowMapWidth);
	GLuint shadowMapHeight = glGetUniformLocation(shaderProg, "shadowMapHeight");
	glUniform1i(shadowMapHeight, shadowParams.shadowMapHeight);
	GLuint shadowMapStep = glGetUniformLocation(shaderProg, "shadowMapStep");
	glUniform2f(shadowMapStep, 1.0/shadowParams.shadowMapWidth, 1.0/shadowParams.shadowMapHeight);
	GLuint maxSearch = glGetUniformLocation(shaderProg, "maxSearch");
	glUniform1i(maxSearch, shadowParams.maxSearch);
	GLuint depthThreshold = glGetUniformLocation(shaderProg, "depthThreshold");
	glUniform1f(depthThreshold, shadowParams.depthThreshold);
	GLuint shadowIntensityID = glGetUniformLocation(shaderProg, "shadowIntensity");
	glUniform1f(shadowIntensityID, shadowParams.shadowIntensity);
	GLuint lightMVPID = glGetUniformLocation(shaderProg, "lightMVP");
	glUniformMatrix4fv(lightMVPID, 1, GL_FALSE, &shadowParams.lightMVP[0][0]);
	GLuint inverseLightMVPID = glGetUniformLocation(shaderProg, "inverseLightMVP");
	glUniformMatrix4fv(inverseLightMVPID, 1, GL_FALSE, &inverseMVP[0][0]);
	
	GLuint showEnteringDiscontinuityMapID = glGetUniformLocation(shaderProg, "showEnteringDiscontinuity");
	glUniform1i(showEnteringDiscontinuityMapID, shadowParams.showEnteringDiscontinuityMap);
	GLuint showExitingDiscontinuityMapID = glGetUniformLocation(shaderProg, "showExitingDiscontinuity");
	glUniform1i(showExitingDiscontinuityMapID, shadowParams.showExitingDiscontinuityMap);
	GLuint showONDSID = glGetUniformLocation(shaderProg, "showONDS");
	glUniform1i(showONDSID, shadowParams.showONDS);
	GLuint showClippedONDSID = glGetUniformLocation(shaderProg, "showClippedONDS");
	glUniform1i(showClippedONDSID, shadowParams.showClippedONDS);
	GLuint showSubCoordID = glGetUniformLocation(shaderProg, "showSubCoord");
	glUniform1i(showSubCoordID, shadowParams.showSubCoord);
	GLuint RSMSSID = glGetUniformLocation(shaderProg, "RSMSS");
	glUniform1i(RSMSSID, shadowParams.RSMSS);
	GLuint SMSRID = glGetUniformLocation(shaderProg, "SMSR");
	glUniform1i(SMSRID, shadowParams.SMSR);
	GLuint RPCFID = glGetUniformLocation(shaderProg, "RPCFPlusSMSR");
	glUniform1i(RPCFID, shadowParams.RPCFPlusSMSR);
	GLuint RPCFSubCoordID = glGetUniformLocation(shaderProg, "RPCFPlusRSMSS");
	glUniform1i(RPCFSubCoordID, shadowParams.RPCFPlusRSMSS);
	
	GLuint shadowID = glGetUniformLocation(shaderProg, "shadowMap");
	glUniform1i(shadowID, 7);
	
	glActiveTexture(GL_TEXTURE7);
	glBindTexture(GL_TEXTURE_2D, shadowParams.shadowMap);
	glGenerateMipmap(GL_TEXTURE_2D);

	glActiveTexture(GL_TEXTURE7);
	glDisable(GL_TEXTURE_2D);

}

void MyGLGeometryViewer::drawPlane(float x, float y, float z) {
	
	glBegin(GL_QUADS);
	glVertex3f(-x, 0.0, -z);
	glVertex3f(+x, 0.0, -z);
	glVertex3f(+x, 0.0, +z);
	glVertex3f(-x, 0.0, +z);
	glEnd();

}

void MyGLGeometryViewer::drawMesh(GLuint *VBOs, int numberOfIndices, int numberOfTexCoords, int numberOfColors, bool textureFromImage, GLuint *texture, 
	int numberOfTextures)
{
	
	GLuint textureFromImageID = glGetUniformLocation(shaderProg, "useTextureForColoring");
	glUniform1i(textureFromImageID, (int)textureFromImage);

	GLuint colorID = glGetUniformLocation(shaderProg, "useMeshColor");
	glUniform1i(colorID, numberOfColors > 0 ? 1 : 0);

	if(textureFromImage) {
		
		GLuint *textureID = (GLuint*)malloc(numberOfTextures * sizeof(GLuint));
		char textureName[50];

		for(int tex = 0; tex < numberOfTextures; tex++) {

			sprintf(textureName, "texture%d", tex);
			textureID[tex] = glGetUniformLocation(shaderProg, textureName);
			glUniform1i(textureID[tex], 2 + tex);
			glActiveTexture(GL_TEXTURE2 + tex);
			glBindTexture(GL_TEXTURE_2D, texture[tex]);
		
		}

		delete [] textureID;
	
	}

	GLint attribute_vert = glGetAttribLocation(shaderProg, "vertex");
	glEnableVertexAttribArray(attribute_vert);
	glBindBuffer(GL_ARRAY_BUFFER, VBOs[0]);
	glVertexAttribPointer(attribute_vert, 3, GL_FLOAT, GL_FALSE, 0, 0);

	GLint attribute_norm = glGetAttribLocation(shaderProg, "normal");
	glEnableVertexAttribArray(attribute_norm);
	glBindBuffer(GL_ARRAY_BUFFER, VBOs[1]);
	glVertexAttribPointer(attribute_norm, 3, GL_FLOAT, GL_TRUE, 0, 0);
	
	GLint attribute_uv; 
	if(numberOfTexCoords > 0) {

		attribute_uv = glGetAttribLocation(shaderProg, "uv");
		glEnableVertexAttribArray(attribute_uv);
		glBindBuffer(GL_ARRAY_BUFFER, VBOs[2]);
		glVertexAttribPointer(attribute_uv, 3, GL_FLOAT, GL_FALSE, 0, 0);
	
	}

	GLint attribute_color;
	if(numberOfColors > 0) {

		attribute_color = glGetAttribLocation(shaderProg, "color");
		glEnableVertexAttribArray(attribute_color);
		glBindBuffer(GL_ARRAY_BUFFER, VBOs[3]);
		glVertexAttribPointer(attribute_color, 3, GL_FLOAT, GL_FALSE, 0, 0);
	
	}

	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, VBOs[4]);
	glDrawElements(GL_TRIANGLES, numberOfIndices, GL_UNSIGNED_INT, 0);

	glDisableVertexAttribArray(attribute_vert);
	glDisableVertexAttribArray(attribute_norm);
	
	if(numberOfTexCoords > 0)
		glDisableVertexAttribArray(attribute_uv);
	if(numberOfColors > 0)
		glDisableVertexAttribArray(attribute_color);
	
	if(textureFromImage) {
		
		for(int tex = 0; tex < numberOfTextures; tex++) {
			
			glActiveTexture(GL_TEXTURE2 + tex);
			glDisable(GL_TEXTURE_2D);
		
		}

	}

}

void MyGLGeometryViewer::loadVBOs(GLuint *VBOs, Mesh *scene)
{

	glBindBuffer(GL_ARRAY_BUFFER, VBOs[0]);
	glBufferData(GL_ARRAY_BUFFER, scene->getPointCloudSize() * sizeof(float), scene->getPointCloud(), GL_DYNAMIC_DRAW);

	glBindBuffer(GL_ARRAY_BUFFER, VBOs[1]);
	glBufferData(GL_ARRAY_BUFFER, scene->getPointCloudSize() * sizeof(float), scene->getNormalVector(), GL_DYNAMIC_DRAW);

	if(scene->getTextureCoordsSize() > 0) {
		glBindBuffer(GL_ARRAY_BUFFER, VBOs[2]);
		glBufferData(GL_ARRAY_BUFFER, scene->getTextureCoordsSize() * sizeof(float), scene->getTextureCoords(), GL_DYNAMIC_DRAW);
	}

	if(scene->getColorsSize() > 0) {
		glBindBuffer(GL_ARRAY_BUFFER, VBOs[3]);
		glBufferData(GL_ARRAY_BUFFER, scene->getColorsSize() * sizeof(float), scene->getColors(), GL_DYNAMIC_DRAW);
	}

	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, VBOs[4]);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, scene->getIndicesSize() * sizeof(int), scene->getIndices(), GL_DYNAMIC_DRAW);

}