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
	GLuint fovID = glGetUniformLocation(shaderProg, "fov");
	glUniform1f(fovID, fov);
	
}

void MyGLGeometryViewer::configureMoments(ShadowParams shadowParams)
{

	glm::mat4 mQuantization, mQuantizationInverse;
	
	mQuantization[0][0] = -2.07224649;	mQuantization[0][1] = 32.2370378;	mQuantization[0][2] = -68.5710746;	mQuantization[0][3] = 39.3703274;
	mQuantization[1][0] = 13.7948857;	mQuantization[1][1] = -59.4683976;	mQuantization[1][2] = 82.035975;	mQuantization[1][3] = -35.3649032;
	mQuantization[2][0] = 0.105877704;	mQuantization[2][1] = -1.90774663;	mQuantization[2][2] = 9.34965551;	mQuantization[2][3] = -6.65434907;
	mQuantization[3][0] = 9.79240621;	mQuantization[3][1] = -33.76521106;	mQuantization[3][2] = 47.9456097;	mQuantization[3][3] = -23.9728048;
	
	mQuantization = glm::transpose(mQuantization);
	mQuantizationInverse = glm::inverse(mQuantization);
	
	GLuint shadowMapSAVSMID = glGetUniformLocation(shaderProg, "SAVSM");
	glUniform1i(shadowMapSAVSMID, shadowParams.SAVSM);
	GLuint shadowMapVSSMID = glGetUniformLocation(shaderProg, "VSSM");
	glUniform1i(shadowMapVSSMID, shadowParams.VSSM);
	GLuint shadowMapMSSMID = glGetUniformLocation(shaderProg, "MSSM");
	glUniform1i(shadowMapMSSMID, shadowParams.MSSM);

	if(shadowParams.MSSM) {
		GLuint tQuantizationID = glGetUniformLocation(shaderProg, "momentTranslationVector");
		glUniform4f(tQuantizationID, 0.0359558848, 0.0, 0.0, 0.0);
		GLuint mQuantizationID = glGetUniformLocation(shaderProg, "momentRotationMatrix");
		glUniformMatrix4fv(mQuantizationID, 1, GL_FALSE, &mQuantization[0][0]);
		GLuint mQuantizationInverseID = glGetUniformLocation(shaderProg, "momentInverseRotationMatrix");
		glUniformMatrix4fv(mQuantizationInverseID, 1, GL_FALSE, &mQuantizationInverse[0][0]);
	}

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
	GLuint inverseMVPID = glGetUniformLocation(shaderProg, "inverseMVP");
	glUniformMatrix4fv(inverseMVPID, 1, GL_FALSE, &glm::inverse(mvp)[0][0]);
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
	
	bool screenSpace = shadowParams.SSPCSS || shadowParams.SSABSS || shadowParams.SSSM || shadowParams.SSRBSSM;
	
	glm::mat4 bias;
	bias[0][0] = 0.5;	bias[0][1] = 0;		bias[0][2] = 0;		bias[0][3] = 0.0;
	bias[1][0] = 0;		bias[1][1] = 0.5;	bias[1][2] = 0;		bias[1][3] = 0.0;
	bias[2][0] = 0;		bias[2][1] = 0;		bias[2][2] = 0.5;	bias[2][3] = 0.0;
	bias[3][0] = 0.5;	bias[3][1] = 0.5;	bias[3][2] = 0.5;	bias[3][3] = 1.0;

	shadowParams.lightMVP = bias * shadowParams.lightMVP;
	GLuint lightMVPID = glGetUniformLocation(shaderProg, "lightMVP");
	glUniformMatrix4fv(lightMVPID, 1, GL_FALSE, &shadowParams.lightMVP[0][0]);
	GLuint inverseMVPID = glGetUniformLocation(shaderProg, "inverseLightMVP");
	glUniformMatrix4fv(inverseMVPID, 1, GL_FALSE, &glm::inverse(shadowParams.lightMVP)[0][0]);
	
	if(shadowParams.adaptiveSampling && shadowParams.quadTreeEvaluation) {

		GLuint indexID = glGetUniformLocation(shaderProg, "shadowMapIndices");
		glUniform1iv(indexID, 4, shadowParams.localQuadTreeHash);
		GLuint lightMVPsID = glGetUniformLocation(shaderProg, "lightMVPs");
		for(int index = 0; index < 4; index++) {
			int hashIndex = shadowParams.localQuadTreeHash[index];
			shadowParams.quadTreeLightMVPs[index] = bias * shadowParams.lightMVPs[hashIndex];
		}
		glUniformMatrix4fv(lightMVPsID, 4, GL_FALSE, &(shadowParams.quadTreeLightMVPs[0])[0][0]);
		
	} else if(shadowParams.monteCarlo || (shadowParams.adaptiveSampling && !shadowParams.quadTreeEvaluation)) {
	
		GLuint lightMVPTransID = glGetUniformLocation(shaderProg, "lightMVPTrans");
		for(int index = 0; index < shadowParams.numberOfSamples; index++) {

			shadowParams.lightMVPs[index] = bias * shadowParams.lightMVPs[index];
			shadowParams.lightTrans[index] = glm::vec4(shadowParams.lightMVPs[index][3][0], shadowParams.lightMVPs[index][3][1], shadowParams.lightMVPs[index][3][2], 
				shadowParams.lightMVPs[index][3][3]);
			if(shadowParams.adaptiveSampling) shadowParams.lightTrans[index][3] += shadowParams.accFactor[index] * 10000;
		}
		glUniform4fv(lightMVPTransID, shadowParams.numberOfSamples, &(shadowParams.lightTrans[0])[0]);

	}

	GLuint shadowMapWidthID = glGetUniformLocation(shaderProg, "shadowMapWidth");
	glUniform1i(shadowMapWidthID, shadowParams.shadowMapWidth);
	GLuint shadowMapHeightID = glGetUniformLocation(shaderProg, "shadowMapHeight");
	glUniform1i(shadowMapHeightID, shadowParams.shadowMapHeight);
	GLuint windowWidthID = glGetUniformLocation(shaderProg, "windowWidth");
	glUniform1i(windowWidthID, shadowParams.windowWidth);
	GLuint windowHeightID = glGetUniformLocation(shaderProg, "windowHeight");
	glUniform1i(windowHeightID, shadowParams.windowHeight);
	GLuint shadowIntensityID = glGetUniformLocation(shaderProg, "shadowIntensity");
	glUniform1f(shadowIntensityID, shadowParams.shadowIntensity);
	GLuint numberOfSamplesID = glGetUniformLocation(shaderProg, "numberOfSamples");
	glUniform1i(numberOfSamplesID, shadowParams.numberOfSamples);
	GLuint blockerSearchSizeID = glGetUniformLocation(shaderProg, "blockerSearchSize");
	glUniform1i(blockerSearchSizeID, shadowParams.blockerSearchSize - screenSpace);
	GLuint kernelSizeID = glGetUniformLocation(shaderProg, "kernelSize");
	glUniform1i(kernelSizeID, shadowParams.kernelSize);
	GLuint lightSourceRadiusID = glGetUniformLocation(shaderProg, "lightSourceRadius");
	glUniform1i(lightSourceRadiusID, shadowParams.lightSourceRadius);
	if(shadowParams.SSSM) {
		GLuint blockerThresholdID = glGetUniformLocation(shaderProg, "blockerThreshold");
		glUniform1f(blockerThresholdID, shadowParams.blockerThreshold);
		GLuint filterThresholdID = glGetUniformLocation(shaderProg, "filterThreshold");
		glUniform1i(filterThresholdID, shadowParams.filterThreshold);
	} else if(shadowParams.RBSSM || shadowParams.SSRBSSM) {
		GLuint maxSearch = glGetUniformLocation(shaderProg, "maxSearch");
		glUniform1i(maxSearch, shadowParams.maxSearch);
		GLuint depthThreshold = glGetUniformLocation(shaderProg, "depthThreshold");
		glUniform1f(depthThreshold, shadowParams.depthThreshold);
		GLuint shadowMapStep = glGetUniformLocation(shaderProg, "shadowMapStep");
		glUniform2f(shadowMapStep, 1.0/shadowParams.shadowMapWidth, 1.0/shadowParams.shadowMapHeight);
	}
	GLuint SATID = glGetUniformLocation(shaderProg, "SAT");
	glUniform1i(SATID, shadowParams.SAT);
	GLuint monteCarloID = glGetUniformLocation(shaderProg, "monteCarlo");
	glUniform1i(monteCarloID, shadowParams.monteCarlo);
	GLuint adaptiveSamplingID = glGetUniformLocation(shaderProg, "adaptiveSampling");
	glUniform1i(adaptiveSamplingID, shadowParams.adaptiveSampling);
	GLuint adaptiveSamplingLowerAccuracyID = glGetUniformLocation(shaderProg, "adaptiveSamplingLowerAccuracy");
	glUniform1i(adaptiveSamplingLowerAccuracyID, shadowParams.adaptiveSamplingLowerAccuracy);
	GLuint PCSSID = glGetUniformLocation(shaderProg, "PCSS");
	glUniform1i(PCSSID, shadowParams.PCSS);
	GLuint ESSMID = glGetUniformLocation(shaderProg, "ESSM");
	glUniform1i(ESSMID, shadowParams.ESSM);
	GLuint SSPCSSID = glGetUniformLocation(shaderProg, "SSPCSS");
	glUniform1i(SSPCSSID, shadowParams.SSPCSS);
	GLuint SSABSSID = glGetUniformLocation(shaderProg, "SSABSS");
	glUniform1i(SSABSSID, shadowParams.SSABSS);
	GLuint SSSMID = glGetUniformLocation(shaderProg, "SSSM");
	glUniform1i(SSSMID, shadowParams.SSSM);
	GLuint SSRBSSMID = glGetUniformLocation(shaderProg, "SSRBSSM");
	glUniform1i(SSRBSSMID, shadowParams.SSRBSSM);
	configureMoments(shadowParams);
	GLuint shadowMap = glGetUniformLocation(shaderProg, "shadowMap");
	glUniform1i(shadowMap, 0);

	if(shadowParams.monteCarlo || (shadowParams.adaptiveSampling && !shadowParams.quadTreeEvaluation)) {
		
		GLuint shadowMapArray = glGetUniformLocation(shaderProg, "shadowMapArray");
		glUniform1i(shadowMapArray, 1);

	} else if((shadowParams.adaptiveSampling && shadowParams.quadTreeEvaluation) || screenSpace) {

		GLuint vertexMap = glGetUniformLocation(shaderProg, "vertexMap");
		glUniform1i(vertexMap, 8);
		GLuint normalMap = glGetUniformLocation(shaderProg, "normalMap");
		glUniform1i(normalMap, 9);
		
		if(shadowParams.quadTreeEvaluation) {
		
			GLuint shadowMapArray = glGetUniformLocation(shaderProg, "shadowMapArray");
			glUniform1i(shadowMapArray, 10);

		} else if(shadowParams.useSoftShadowMap) {
		
			GLuint accumulationMap = glGetUniformLocation(shaderProg, "softShadowMap");
			glUniform1i(accumulationMap, 1);
		
		} else if(screenSpace && (shadowParams.useHardShadowMap || shadowParams.usePartialAverageBlockerDepthMap)) {

			GLuint hardShadowMap = glGetUniformLocation(shaderProg, "hardShadowMap");
			glUniform1i(hardShadowMap, 1);
			
		} 

	} else if(shadowParams.SAVSM || shadowParams.VSSM || shadowParams.ESSM || shadowParams.MSSM) {

		GLuint SATShadowMap = glGetUniformLocation(shaderProg, "SATShadowMap");
		glUniform1i(SATShadowMap, 1);

	} 
	
	if(shadowParams.useHierarchicalShadowMap) {
		
		GLuint hierarchicalShadowMap = glGetUniformLocation(shaderProg, "hierarchicalShadowMap");
		glUniform1i(hierarchicalShadowMap, 10);
		
	}

	configureLinearization();

	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, shadowParams.shadowMap);

	if(shadowParams.monteCarlo || (shadowParams.adaptiveSampling && !shadowParams.quadTreeEvaluation)) {

		glActiveTexture(GL_TEXTURE1);
		glBindTexture(GL_TEXTURE_2D_ARRAY, shadowParams.shadowMapArray);

	} else if((shadowParams.adaptiveSampling && shadowParams.quadTreeEvaluation) || screenSpace) {

		glActiveTexture(GL_TEXTURE8);
		glBindTexture(GL_TEXTURE_2D, shadowParams.vertexMap);

		glActiveTexture(GL_TEXTURE9);
		glBindTexture(GL_TEXTURE_2D, shadowParams.normalMap);
		
		if(shadowParams.quadTreeEvaluation) {
			
			glActiveTexture(GL_TEXTURE10);
			glBindTexture(GL_TEXTURE_2D_ARRAY, shadowParams.shadowMapArray);

		} else if(shadowParams.useSoftShadowMap) {

			glActiveTexture(GL_TEXTURE1);
			glBindTexture(GL_TEXTURE_2D, shadowParams.softShadowMap);
		
		} else if(screenSpace && (shadowParams.useHardShadowMap || shadowParams.usePartialAverageBlockerDepthMap)) {

			glActiveTexture(GL_TEXTURE1);
			glBindTexture(GL_TEXTURE_2D, shadowParams.hardShadowMap);
			 
		}

	} else if(shadowParams.SAVSM || shadowParams.VSSM || shadowParams.ESSM || shadowParams.MSSM) {

		glActiveTexture(GL_TEXTURE1);
		glBindTexture(GL_TEXTURE_2D, shadowParams.SATShadowMap);
		
	} 
	
	if(shadowParams.useHierarchicalShadowMap) {
		
		glActiveTexture(GL_TEXTURE10);
		glBindTexture(GL_TEXTURE_2D, shadowParams.hierarchicalShadowMap);
		
	}

	glActiveTexture(GL_TEXTURE0);
	glDisable(GL_TEXTURE_2D);

	if(shadowParams.monteCarlo && (shadowParams.adaptiveSampling && !shadowParams.quadTreeEvaluation)) {

		glActiveTexture(GL_TEXTURE1);
		glDisable(GL_TEXTURE_2D_ARRAY);

	} else if((shadowParams.adaptiveSampling && shadowParams.quadTreeEvaluation) || screenSpace) {

		glActiveTexture(GL_TEXTURE8);
		glDisable(GL_TEXTURE_2D);

		glActiveTexture(GL_TEXTURE9);
		glDisable(GL_TEXTURE_2D);

		if(shadowParams.quadTreeEvaluation) {

			glActiveTexture(GL_TEXTURE10);
			glDisable(GL_TEXTURE_2D_ARRAY);

		} else if((screenSpace && (shadowParams.useHardShadowMap || shadowParams.usePartialAverageBlockerDepthMap))) {
		
			glActiveTexture(GL_TEXTURE1);
			glDisable(GL_TEXTURE_2D);
		
		}

	} else if(shadowParams.SAVSM || shadowParams.VSSM || shadowParams.ESSM || shadowParams.MSSM) {
	
		glActiveTexture(GL_TEXTURE1);
		glDisable(GL_TEXTURE_2D);

	} 
	
	if(shadowParams.useHierarchicalShadowMap) {
			
		glActiveTexture(GL_TEXTURE10);
		glDisable(GL_TEXTURE_2D);
		
	}

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