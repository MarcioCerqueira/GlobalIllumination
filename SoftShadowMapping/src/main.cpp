//References:
//Shadow Mapping - L. Willians. Casting Curved Shadows on Curved Surfaces. 1978.
//Summed-Area Tables. F. Crow. Summed-Area Tables for Texture Mapping. 1980.
//Monte-Carlo Soft Shadow Volumes/Mapping - L. Brotman and N. Badler. Generating Soft Shadows with a Depth Buffer Algorithm. 1984.
//Accumulation Buffer - P. Haeberli and K. Akeley. The Accumulation Buffer: Hardware Support for High-Quality Rendering. 1990.
//G-Buffer - T. Saito and T. Takahashi. Comprehensible Rendering of 3-D Shapes. 1990.
//Bilateral Filter - C. Tomasi and R. Manduchi. Bilateral Filtering for Gray and Color Images. 1998.
//Percentage-Closer Soft Shadows - R. Fernando. Percentage-Closer Soft Shadows. 2005.
//Separable Bilateral Filter - T. Pham and L. van Vliet. Separable Bilateral Filtering for Fast Video Preprocessing. 2005.
//Summed-Area Tables in GPU - J. Hensley et al. Fast Summed-Area Table Generation and Its Applications. 2005.
//Hierarchical Shadow Map - G. Guennebaud et al. Real-Time Soft Shadow Mapping by Backprojection. 2006.
//Summed-Area Variance Shadow Mapping - A. Lauritzen. Summed-Area Variance Shadow Maps. 2007.
//Screen-Space Percentage-Closer Soft Shadows - M. MohammadBagher et al. Screen-Space Percentage-Closer Soft Shadows. 2010.
//Variance Soft Shadow Mapping - B. Yang et al. Variance Soft Shadow Mapping. 2010.
//Screen Space Anisotropic Blurred Soft Shadows - Z. Zheng and S. Saito. Screen Space Anisotropic Blurred Soft Shadows. 2011.
//Adaptive Light Source Sampling - M. Schwärzler et al. - Fast Accurate Soft Shadows with Adaptive Light Source Sampling. 2012.
//Exponential Soft Shadow Mapping - L. Shen et al. Exponential Soft Shadow Mapping. 2013.
//Separable Soft Shadow Mapping - J. M. Buades et al. Separable Soft Shadow Mapping. 2015.
//Moment Soft Shadow Mapping - C. Peters et al. Beyond Hard Shadows: Moment Shadow Maps for Single Scattering, Soft Shadows and Translucent Occluders. 2016.
//http://rastergrid.com/blog/2010/09/efficient-gaussian-blur-with-linear-sampling/ for gaussian mask weights
//http://www.3drender.com/challenges/ (.obj, .mtl)
//http://graphics.cs.williams.edu/data/meshes.xml (.obj, .mtl)

#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <GL/glew.h>
#include <GL/glut.h>
#include <time.h>
#include "Viewers\MyGLTextureViewer.h"
#include "Viewers\MyGLGeometryViewer.h"
#include "Viewers\shader.h"
#include "Viewers\ShadowParams.h"
#include "IO\SceneLoader.h"
#include "Scene\Mesh.h"
#include "Scene\LightSource\LightSource.h"
#include "Scene\LightSource\UniformSampledLightSource.h"
#include "Scene\LightSource\QuadTreeLightSource.h"
#include "Image.h"
#include "Filter.h"

enum 
{
	SHADOW_MAP_DEPTH = 0,
	SHADOW_MAP_COLOR = 1,
	TEMP_SHADOW_MAP_DEPTH = 2,
	TEMP_SHADOW_MAP_COLOR = 3,
	SAT_SHADOW_MAP_DEPTH = 4,
	SAT_SHADOW_MAP_COLOR = 5,
	HIERARCHICAL_SHADOW_MAP_DEPTH = 6,
	HIERARCHICAL_SHADOW_MAP_COLOR = 7,
	SOFT_SHADOW_MAP_DEPTH = 8,
	SOFT_SHADOW_MAP_COLOR = 9,
	HARD_SHADOW_MAP_DEPTH = 10,
	HARD_SHADOW_MAP_COLOR = 11,
	GBUFFER_MAP_DEPTH = 12,
	VERTEX_MAP_COLOR = 13,
	NORMAL_MAP_COLOR = 14,
	PARTIAL_BLOCKER_SEARCH_MAP_DEPTH = 15,
	PARTIAL_BLOCKER_SEARCH_MAP_COLOR = 16,
	LEFT_TOP_SHADOW_MAP_DEPTH = 17,
	LEFT_TOP_SHADOW_MAP_COLOR = 18,
	RIGHT_TOP_SHADOW_MAP_DEPTH = 19,
	RIGHT_TOP_SHADOW_MAP_COLOR = 20,
	LEFT_BOTTOM_SHADOW_MAP_DEPTH = 21,
	LEFT_BOTTOM_SHADOW_MAP_COLOR = 22,
	RIGHT_BOTTOM_SHADOW_MAP_DEPTH = 23,
	RIGHT_BOTTOM_SHADOW_MAP_COLOR = 24,
	QUAD_TREE_REPROJECTION_DEPTH = 25,
	QUAD_TREE_REPROJECTION_COLOR = 26
};

enum
{
	SCENE_SHADER = 0,
	CLEAR_IMAGE_SHADER = 1,
	COPY_IMAGE_SHADER = 2,
	GBUFFER_HARD_SHADOW_SHADER = 3,
	GBUFFER_FINAL_RENDERING_SHADER = 4,
	GBUFFER_SHADER = 5,
	GBUFFER_RSMSS_SHADER = 6,
	SOFT_SHADOW_SHADER = 7,
	MOMENT_SHADER = 8,
	EXPONENTIAL_SHADER = 9,
	SAT_HORIZONTAL_PASS_SHADER = 10,
	SAT_VERTICAL_PASS_SHADER = 11,
	PREPARE_MIN_MAX_SHADER = 12,
	MIN_MAX_SHADER = 13,
	PARTIAL_BLOCKER_SEARCH_SHADER = 14,
	PARTIAL_SHADOW_FILTERING_SHADER = 15,
	SCREEN_SPACE_SOFT_SHADOW_SHADER = 16,
	RBSSM_SHADER = 17,
	QUAD_TREE_REPROJECTION_SHADER = 18,
	QUAD_TREE_EVALUATION_SHADER = 19,
	ACCURATE_SOFT_SHADOW_SHADER = 20
};

enum
{
	SHADOW_FRAMEBUFFER = 0,
	TEMP_SHADOW_FRAMEBUFFER = 1,
	SAT_SHADOW_FRAMEBUFFER = 2,
	HIERARCHICAL_SHADOW_FRAMEBUFFER = 3,
	SOFT_SHADOW_FRAMEBUFFER = 4,
	HARD_SHADOW_FRAMEBUFFER = 5,
	GBUFFER_FRAMEBUFFER = 6,
	PARTIAL_BLOCKER_SEARCH_MAP_FRAMEBUFFER = 7,
	LEFT_TOP_SHADOW_MAP_FRAMEBUFFER = 8,
	RIGHT_TOP_SHADOW_MAP_FRAMEBUFFER = 9,
	LEFT_BOTTOM_SHADOW_MAP_FRAMEBUFFER = 10,
	RIGHT_BOTTOM_SHADOW_MAP_FRAMEBUFFER = 11,
	QUAD_TREE_REPROJECTION_FRAMEBUFFER = 12,
};

bool temp = false;
//Window size
int windowWidth = 1280;
int windowHeight = 720;

int shadowMapWidth = 512 * 2;
int shadowMapHeight = 512 * 2;

//  The number of frames
int frameCount = 0;
float fps = 0;
int currentTime = 0, previousTime = 0;
char fileName[1000];

MyGLTextureViewer myGLTextureViewer;
MyGLGeometryViewer myGLGeometryViewer;
ShadowParams shadowParams;

Mesh *scene;
SceneLoader *sceneLoader;
LightSource *lightSource;
UniformSampledLightSource *uniformSampledLightSource;
QuadTreeLightSource *quadTreeLightSource;
Filter *bilateralFilter;

GLuint textureArray[1];
GLuint textures[30];
GLuint frameBuffer[20];
GLuint sceneVBO[5];
GLuint sceneTextures[4];
GLuint queryObject[1];

glm::vec3 cameraEye;
glm::vec3 cameraAt;
glm::vec3 cameraUp;
glm::mat4 lightMVP;

GLuint ProgramObject = 0;
GLuint VertexShaderObject = 0;
GLuint FragmentShaderObject = 0;
GLuint shaderVS, shaderFS, shaderProg[25];   // handles to objects
GLint  linked;

float translationVector[3] = {0.0, 0.0, 0.0};
float lightTranslationVector[3] = {0.0, 0.0, 0.0};
float rotationAngles[3] = {0.0, 0.0, 0.0};

bool translationOn = false;
bool lightTranslationOn = false;
bool rotationOn = false;
bool animationOn = false;
bool cameraOn = false;
bool shadowIntensityOn = false;
bool changeKernelSizeOn = false;
bool changeBlockerSearchSizeOn = false;
bool stop = false;

int vel = 1;
float animation = -1800;

bool quadTreeShadowMapIndices[17][17];
int maxLevel = 4;
int quadTreeShadowMapSamples = 0;

double cpu_time(void)
{

	double value;
	value = (double) clock () / (double) CLOCKS_PER_SEC;
	return value;

}

void calculateFPS()
{

	frameCount++;
	currentTime = glutGet(GLUT_ELAPSED_TIME);

    int timeInterval = currentTime - previousTime;

    if(timeInterval > 1000)
    {
        fps = frameCount / (timeInterval / 1000.0f);
        previousTime = currentTime;
        frameCount = 0;
	
		printf("FPS: %f\n", fps);
	}

}

void reshape(int w, int h)
{
	
	windowWidth = w;
	windowHeight = h;

}

void displayScene()
{

	glm::mat4 projection = myGLGeometryViewer.getProjectionMatrix();
	glm::mat4 view = myGLGeometryViewer.getViewMatrix();
	glm::mat4 model = myGLGeometryViewer.getModelMatrix();
	
	model *= glm::translate(glm::vec3(translationVector[0], translationVector[1], translationVector[2]));
	model *= glm::rotate(rotationAngles[0], glm::vec3(1, 0, 0));
	model *= glm::rotate(rotationAngles[1], glm::vec3(0, 1, 0));
	model *= glm::rotate(rotationAngles[2], glm::vec3(0, 0, 1));

	myGLGeometryViewer.setProjectionMatrix(projection);
	myGLGeometryViewer.setViewMatrix(view);
	myGLGeometryViewer.setModelMatrix(model);
	myGLGeometryViewer.configurePhong(lightSource->getEye(), cameraEye);
	
	//glColor3f(0.0, 1.0, 0.0);
	myGLGeometryViewer.loadVBOs(sceneVBO, scene);
	myGLGeometryViewer.drawMesh(sceneVBO, scene->getIndicesSize(), scene->getTextureCoordsSize(), scene->getColorsSize(), scene->textureFromImage(), sceneTextures, 
		scene->getNumberOfTextures());

}

void updateLight()
{

	lightSource->setEye(glm::vec3(sceneLoader->getLightPosition()[0] + lightTranslationVector[0], sceneLoader->getLightPosition()[1] + lightTranslationVector[1], 
		sceneLoader->getLightPosition()[2] + lightTranslationVector[2]));
	uniformSampledLightSource->setEye(glm::vec3(sceneLoader->getLightPosition()[0] + lightTranslationVector[0], sceneLoader->getLightPosition()[1] + lightTranslationVector[1], 
		sceneLoader->getLightPosition()[2] + lightTranslationVector[2]));
	quadTreeLightSource->setEye(glm::vec3(sceneLoader->getLightPosition()[0] + lightTranslationVector[0], sceneLoader->getLightPosition()[1] + lightTranslationVector[1], 
		sceneLoader->getLightPosition()[2] + lightTranslationVector[2]));

	if(animationOn) {
		lightSource->setEye(glm::mat3(glm::rotate((float)animation/10, glm::vec3(0, 1, 0))) * lightSource->getEye());
		uniformSampledLightSource->setEye(glm::mat3(glm::rotate((float)animation/10, glm::vec3(0, 1, 0))) * ((LightSource*)uniformSampledLightSource)->getEye());
		quadTreeLightSource->setEye(glm::mat3(glm::rotate((float)animation/10, glm::vec3(0, 1, 0))) * ((LightSource*)quadTreeLightSource)->getEye());
	}

}

void displaySceneFromLightPOV()
{

	glViewport(0, 0, shadowMapWidth, shadowMapHeight);
	
	if(!shadowParams.monteCarlo && !shadowParams.adaptiveSampling) updateLight();

	if(shadowParams.SAVSM || shadowParams.VSSM || shadowParams.MSSM) {
		glUseProgram(shaderProg[MOMENT_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[MOMENT_SHADER]);
		myGLGeometryViewer.configureMoments(shadowParams);
		myGLGeometryViewer.configureLinearization();
	} else if(shadowParams.ESSM) {
		glUseProgram(shaderProg[EXPONENTIAL_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[EXPONENTIAL_SHADER]);
		myGLGeometryViewer.configureLinearization();
	} else {
		glUseProgram(shaderProg[SCENE_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[SCENE_SHADER]);
	}
	
	glPolygonOffset(4.0f, 20.0f);
	glEnable(GL_POLYGON_OFFSET_FILL);

	myGLGeometryViewer.setEye(lightSource->getEye());
	myGLGeometryViewer.setLook(lightSource->getAt());
	myGLGeometryViewer.setUp(lightSource->getUp());
	myGLGeometryViewer.configureAmbient(shadowMapWidth, shadowMapHeight);
	myGLGeometryViewer.setIsCameraViewpoint(false);

	glm::mat4 projection = myGLGeometryViewer.getProjectionMatrix();
	glm::mat4 view = myGLGeometryViewer.getViewMatrix();
	glm::mat4 model = myGLGeometryViewer.getModelMatrix();
	
	model *= glm::translate(glm::vec3(translationVector[0], translationVector[1], translationVector[2]));
	model *= glm::rotate(rotationAngles[0], glm::vec3(1, 0, 0));
	model *= glm::rotate(rotationAngles[1], glm::vec3(0, 1, 0));
	model *= glm::rotate(rotationAngles[2], glm::vec3(0, 0, 1));

	lightMVP = projection * view * model;
	
	displayScene();
	glUseProgram(0);

}

void displaySceneFromCameraPOV(GLuint shader)
{

	glViewport(0, 0, windowWidth, windowHeight);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	
	updateLight();
	lightSource->setEye(glm::mat3(glm::rotate((float)180.0, glm::vec3(0, 1, 0))) * lightSource->getEye());
	
	glUseProgram(shader);
	myGLGeometryViewer.setShaderProg(shader);
	shadowParams.shadowMap = textures[SHADOW_MAP_DEPTH];
	if(shadowParams.SAVSM || shadowParams.VSSM || shadowParams.ESSM || shadowParams.MSSM)  {
		if(shadowParams.SAT)
			shadowParams.SATShadowMap = textures[SAT_SHADOW_MAP_COLOR];
		else
			shadowParams.SATShadowMap = textures[SHADOW_MAP_COLOR];
	} else {
		shadowParams.softShadowMap = textures[SOFT_SHADOW_MAP_COLOR];
	}
	if(shadowParams.useHierarchicalShadowMap) 
		shadowParams.hierarchicalShadowMap = textures[HIERARCHICAL_SHADOW_MAP_COLOR];
	if(shadowParams.monteCarlo || shadowParams.adaptiveSampling)
		shadowParams.shadowMapArray = textureArray[0];

	shadowParams.lightMVP = lightMVP;

	myGLGeometryViewer.setEye(cameraEye);
	myGLGeometryViewer.setLook(cameraAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(windowWidth, windowHeight);
	myGLGeometryViewer.configureShadow(shadowParams);
	myGLGeometryViewer.setIsCameraViewpoint(true);

	displayScene();
	glUseProgram(0);

}

void displaySceneFromGBuffer(GLuint shader)
{

	glViewport(0, 0, windowWidth, windowHeight);
	
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	
	if(!shadowParams.adaptiveSampling) {
		updateLight();
		lightSource->setEye(glm::mat3(glm::rotate((float)180.0, glm::vec3(0, 1, 0))) * lightSource->getEye());
	}

	glUseProgram(shader);
	myGLGeometryViewer.setShaderProg(shader);
	myGLTextureViewer.setShaderProg(shader);

	shadowParams.shadowMap = textures[SHADOW_MAP_DEPTH];
	shadowParams.softShadowMap = textures[SOFT_SHADOW_MAP_COLOR];
	shadowParams.vertexMap = textures[VERTEX_MAP_COLOR];
	shadowParams.normalMap = textures[NORMAL_MAP_COLOR];
	shadowParams.lightMVP = lightMVP;
	if(shadowParams.useHardShadowMap)
		shadowParams.hardShadowMap = textures[HARD_SHADOW_MAP_COLOR];
	if(shadowParams.usePartialAverageBlockerDepthMap)
		shadowParams.hardShadowMap = textures[PARTIAL_BLOCKER_SEARCH_MAP_COLOR];
	if(shadowParams.useHierarchicalShadowMap) 
		shadowParams.hierarchicalShadowMap = textures[HIERARCHICAL_SHADOW_MAP_COLOR];
	if(shadowParams.SSPCSS || shadowParams.SSABSS || shadowParams.SSSM || shadowParams.SSRBSSM) 
		myGLTextureViewer.configureSeparableFilter(bilateralFilter->getOrder(), bilateralFilter->getKernel(), false, false, bilateralFilter->getSigmaSpace(), 
			bilateralFilter->getSigmaColor());
	
	myGLGeometryViewer.setEye(cameraEye);
	myGLGeometryViewer.setLook(cameraAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(windowWidth, windowHeight);
	myGLGeometryViewer.configureShadow(shadowParams);
	myGLGeometryViewer.setIsCameraViewpoint(true);
	
	glm::mat4 model = myGLGeometryViewer.getModelMatrix();
	
	model *= glm::translate(glm::vec3(translationVector[0], translationVector[1], translationVector[2]));
	model *= glm::rotate(rotationAngles[0], glm::vec3(1, 0, 0));
	model *= glm::rotate(rotationAngles[1], glm::vec3(0, 1, 0));
	model *= glm::rotate(rotationAngles[2], glm::vec3(0, 0, 1));

	myGLGeometryViewer.setModelMatrix(model);
	myGLGeometryViewer.configurePhong(lightSource->getEye(), cameraEye);

	myGLTextureViewer.drawTextureQuad();
	
	glUseProgram(0);

}

double qBegin, qEnd, qSum;
double qBegin2, qEnd2, qSum2;
double qBegin3, qEnd3, qSum3;

bool evaluateSubAreaLightSource(QuadTreeLightSource *quadTree, int *sampleIndices, int *frameBufferIndices)
{

	qBegin = cpu_time();
	for(int index = 0; index < 4; index++) {

		lightSource->setEye(quadTree->getEye(sampleIndices[index]));
		lightSource->setAt(quadTree->getAt(sampleIndices[index]));
		
		glClearColor(1.0f, 1.0f, 1.0f, 1.0);
		glBindFramebuffer(GL_FRAMEBUFFER, frameBufferIndices[index]);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		displaySceneFromLightPOV();
		glBindFramebuffer(GL_FRAMEBUFFER, 0);

		shadowParams.lightMVPs[index] = lightMVP;
	
	}
	glFinish();
	qEnd = cpu_time();
	qSum += qEnd - qBegin;

	lightSource->setEye(((LightSource*)quadTree)->getEye());
	lightSource->setAt(((LightSource*)quadTree)->getAt());

	glDisable(GL_CULL_FACE);
	glDisable(GL_POLYGON_OFFSET_FILL);
	
	qBegin2 = cpu_time();
	glClearColor(0.63f, 0.82f, 0.96f, 1.0);
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[QUAD_TREE_REPROJECTION_FRAMEBUFFER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromGBuffer(shaderProg[QUAD_TREE_REPROJECTION_SHADER]);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	glFinish();
	qEnd2 = cpu_time();
	qSum2 += qEnd2 - qBegin2;

	int div = 1;
	if(shadowParams.adaptiveSamplingLowerAccuracy) div = 4;

	qBegin3 = cpu_time();
	glBeginQuery(GL_ANY_SAMPLES_PASSED, queryObject[0]);
	myGLTextureViewer.setShaderProg(shaderProg[QUAD_TREE_EVALUATION_SHADER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	glViewport(0, 0, windowWidth/div, windowHeight/div);
	myGLTextureViewer.drawTextureOnShader(textures[QUAD_TREE_REPROJECTION_COLOR], windowWidth/div, windowHeight/div);
	glEndQuery(GL_ANY_SAMPLES_PASSED);
	
	GLuint output;
	glGetQueryObjectuiv(queryObject[0], GL_QUERY_RESULT, &output);
	
	glFinish();
	qEnd3 = cpu_time();
	qSum3 += qEnd3 - qBegin3;
	return (bool)output;

}

void evaluateAreaLightSource(QuadTreeLightSource *quadTree, int *sampleIndices, int *frameBufferIndices) 
{
	
	if(quadTree->getLevel() == maxLevel) return;

	QuadTreeLightSource *tempNode = NULL;
	bool isSubdivisionRequired = evaluateSubAreaLightSource(quadTree, sampleIndices, frameBufferIndices);
	
	if(isSubdivisionRequired) {

		quadTree->subdivide();
		
		for(int childNode = 0; childNode < 4; childNode++) {
			tempNode = quadTree->getChildNode(childNode);
			evaluateAreaLightSource(tempNode, sampleIndices, frameBufferIndices);
		}

	}
	
}

void renderSubAreaLightSource(QuadTreeLightSource *quadTree, int nodeIndex) 
{

	int level = quadTree->getLevel();
	int childFactor = 16/powf(2, level);
	int parentFactor = powf(2, level);
	
	for(int sample = 0; sample < 4; sample++) {

		int x = (sample % 2) * childFactor + (nodeIndex % parentFactor) * childFactor;
		int y = (sample / 2) * childFactor + (nodeIndex / parentFactor) * childFactor;
		
		if(quadTreeShadowMapIndices[x][y]) continue;
		else quadTreeShadowMapIndices[x][y] = true;
		
		lightSource->setEye(quadTree->getEye(sample));
		lightSource->setAt(quadTree->getAt(sample));
		
		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
		glFramebufferTextureLayer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, textureArray[0], 0, quadTreeShadowMapSamples);
		glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_COLOR], 0);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);

		glClearColor(1.0f, 1.0f, 1.0f, 1.0);
		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		displaySceneFromLightPOV();
		glBindFramebuffer(GL_FRAMEBUFFER, 0);
		
		shadowParams.lightMVPs[quadTreeShadowMapSamples] = lightMVP;
		shadowParams.accFactor[quadTreeShadowMapSamples] = level;
		quadTreeShadowMapSamples++;

	}

}

void renderAreaLightSource(QuadTreeLightSource *quadTree, int nodeIndex) 
{

	if(quadTree->hasAnyChildren()) {

		QuadTreeLightSource *tempNode = NULL;
		
		int childIndex[4] = {0};
		int level = quadTree->getLevel();

		int div = powf(2, level);
		int	x = nodeIndex % div;
		int	y = nodeIndex / div;
		int baseIndex = 2 * x + powf(2, level + 2) * y;
		childIndex[0] = baseIndex;
		childIndex[1] = baseIndex + 1;
		childIndex[2] = baseIndex + powf(2, level + 1);
		childIndex[3] = baseIndex + powf(2, level + 1) + 1;
		
		for(int childNode = 0; childNode < 4; childNode++) {
			tempNode = quadTree->getChildNode(childNode);
			renderAreaLightSource(tempNode, childIndex[childNode]);
		}

	} else {

		renderSubAreaLightSource(quadTree, nodeIndex);

	}
	
}

void renderHSM()
{

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[HIERARCHICAL_SHADOW_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[HIERARCHICAL_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[HIERARCHICAL_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
		
	myGLTextureViewer.setShaderProg(shaderProg[PREPARE_MIN_MAX_SHADER]);
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[HIERARCHICAL_SHADOW_FRAMEBUFFER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	glViewport(0, 0, shadowMapWidth, shadowMapHeight);
	glUseProgram(shaderProg[PREPARE_MIN_MAX_SHADER]);
	glUniform1f(glGetUniformLocation(shaderProg[PREPARE_MIN_MAX_SHADER], "HSMAlpha"), shadowParams.HSMAlpha);
	glUniform1f(glGetUniformLocation(shaderProg[PREPARE_MIN_MAX_SHADER], "HSMBeta"), shadowParams.HSMBeta);
	myGLTextureViewer.drawTextureOnShader(textures[SHADOW_MAP_DEPTH], shadowMapWidth, shadowMapHeight);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	int m = std::logf(shadowMapWidth)/std::logf(2);
	int factor;

	for(int iteration = 1; iteration < m; iteration++) {
		
		factor = powf(2.0, iteration);
		
		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
		glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_DEPTH], 0);
		glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_COLOR], iteration);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);
		
		myGLTextureViewer.setShaderProg(shaderProg[MIN_MAX_SHADER]);
		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		glViewport(0, 0, shadowMapWidth/factor, shadowMapHeight/factor);
		glUseProgram(shaderProg[MIN_MAX_SHADER]);
		glUniform1i(glGetUniformLocation(shaderProg[MIN_MAX_SHADER], "iteration"), iteration);
		myGLTextureViewer.drawTextureOnShader(textures[HIERARCHICAL_SHADOW_MAP_COLOR], shadowMapWidth/factor, shadowMapHeight/factor);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);

		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[HIERARCHICAL_SHADOW_FRAMEBUFFER]);
		glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[HIERARCHICAL_SHADOW_MAP_DEPTH], 0);
		glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[HIERARCHICAL_SHADOW_MAP_COLOR], iteration);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);
		
		myGLTextureViewer.setShaderProg(shaderProg[COPY_IMAGE_SHADER]);
		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[HIERARCHICAL_SHADOW_FRAMEBUFFER]);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		glViewport(0, 0, shadowMapWidth/factor, shadowMapHeight/factor);
		myGLTextureViewer.drawTextureOnShader(textures[TEMP_SHADOW_MAP_COLOR], shadowMapWidth/factor, shadowMapHeight/factor);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);

	}
		
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

}

void renderMonteCarlo()
{

	myGLTextureViewer.setShaderProg(shaderProg[CLEAR_IMAGE_SHADER]);
	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[SOFT_SHADOW_FRAMEBUFFER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	glViewport(0, 0, windowWidth, windowHeight);
	myGLTextureViewer.drawTextureOnShader(textures[SHADOW_MAP_COLOR], windowWidth, windowHeight);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	
	updateLight();

	lightSource->setEye(((LightSource*)uniformSampledLightSource)->getEye());
	lightSource->setAt(((LightSource*)uniformSampledLightSource)->getAt());

	int pointLightSample = 0;
	
	while(pointLightSample < uniformSampledLightSource->getNumberOfPointLights()) {

		lightSource->setEye(uniformSampledLightSource->getEye(pointLightSample));
		lightSource->setAt(uniformSampledLightSource->getAt(pointLightSample));
	
		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
		glFramebufferTextureLayer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, textureArray[0], 0, pointLightSample);
		glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_COLOR], 0);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);

		glClearColor(1.0f, 1.0f, 1.0f, 1.0);
		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		displaySceneFromLightPOV();
		glBindFramebuffer(GL_FRAMEBUFFER, 0);
		
		shadowParams.lightMVPs[pointLightSample] = lightMVP;
		pointLightSample++;

	}

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	lightSource->setEye(((LightSource*)uniformSampledLightSource)->getEye());
	lightSource->setAt(((LightSource*)uniformSampledLightSource)->getAt());

	glClearColor(0.63f, 0.82f, 0.96f, 1.0);
	displaySceneFromCameraPOV(shaderProg[ACCURATE_SOFT_SHADOW_SHADER]);

}

void renderAdaptiveLightSourceSampling()
{

	//double begin = cpu_time();
	myGLTextureViewer.setShaderProg(shaderProg[CLEAR_IMAGE_SHADER]);
	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[SOFT_SHADOW_FRAMEBUFFER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	glViewport(0, 0, windowWidth, windowHeight);
	myGLTextureViewer.drawTextureOnShader(textures[SHADOW_MAP_COLOR], windowWidth, windowHeight);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	
	updateLight();
	quadTreeLightSource->buildFirstLevel();

	lightSource->setEye(((LightSource*)quadTreeLightSource)->getEye());
	lightSource->setAt(((LightSource*)quadTreeLightSource)->getAt());
	
	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[GBUFFER_FRAMEBUFFER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromCameraPOV(shaderProg[GBUFFER_SHADER]);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	
	int sampleIndices[4] = {0, 1, 2, 3};
	int frameBufferIndices[4] = {};
	for(int x = 0; x < 17; x++) for(int y = 0; y < 17; y++) quadTreeShadowMapIndices[x][y] = false;

	frameBufferIndices[0] = frameBuffer[LEFT_TOP_SHADOW_MAP_FRAMEBUFFER];
	frameBufferIndices[1] = frameBuffer[RIGHT_TOP_SHADOW_MAP_FRAMEBUFFER];
	frameBufferIndices[2] = frameBuffer[LEFT_BOTTOM_SHADOW_MAP_FRAMEBUFFER];
	frameBufferIndices[3] = frameBuffer[RIGHT_BOTTOM_SHADOW_MAP_FRAMEBUFFER];
	
	shadowParams.shadowMaps[0] = textures[LEFT_TOP_SHADOW_MAP_DEPTH];
	shadowParams.shadowMaps[1] = textures[RIGHT_TOP_SHADOW_MAP_DEPTH];
	shadowParams.shadowMaps[2] = textures[LEFT_BOTTOM_SHADOW_MAP_DEPTH];
	shadowParams.shadowMaps[3] = textures[RIGHT_BOTTOM_SHADOW_MAP_DEPTH];
	qSum = 0;
	qSum2 = 0;
	qSum3 = 0;

	//double begin = cpu_time();
	shadowParams.quadTreeEvaluation = true;
	evaluateAreaLightSource(quadTreeLightSource, sampleIndices, frameBufferIndices);
	shadowParams.quadTreeEvaluation = false;
	//glFinish();
	//double end = cpu_time();
	//std::cout << "Evaluation: " << (end - begin) << std::endl;
	//std::cout << "	Child Shadow Maps: " << qSum << std::endl;
	//std::cout << "	Quad-Tree Reprojection: " << qSum2 << std::endl;
	//std::cout << "	Occlusion Query: " << qSum3 << std::endl;
	
	//begin = cpu_time();
	quadTreeShadowMapSamples = 0;
	renderAreaLightSource(quadTreeLightSource, quadTreeLightSource->getLevel());
	//glFinish();
	//end = cpu_time();
	//std::cout << "Build Texture Array: " << (end - begin) << std::endl;
	
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	lightSource->setEye(((LightSource*)quadTreeLightSource)->getEye());
	lightSource->setAt(((LightSource*)quadTreeLightSource)->getAt());

	//begin = cpu_time();
	glClearColor(0.63f, 0.82f, 0.96f, 1.0);
	shadowParams.numberOfSamples = quadTreeShadowMapSamples;
	displaySceneFromCameraPOV(shaderProg[ACCURATE_SOFT_SHADOW_SHADER]);
	//glFinish();
	//end = cpu_time();
	//std::cout << "Render Texture Array: " << end - begin << std::endl;
	
	//double end = cpu_time();
	//std::cout << "Adaptive Sampling: " << end - begin << std::endl;
	
	delete quadTreeLightSource;
	quadTreeLightSource = new QuadTreeLightSource(lightSource);
	
}

void renderSoftShadows() 
{

	glClearColor(0.0f, 0.0f, 0.0f, 0.0);
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[SHADOW_FRAMEBUFFER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromLightPOV();
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	
	glBindTexture(GL_TEXTURE_2D, textures[SHADOW_MAP_COLOR]);
	glGenerateMipmap(GL_TEXTURE_2D);

	if(shadowParams.SAT) {
	
		int m = std::logf(shadowMapWidth)/std::logf(2);
		for(int iteration = 0; iteration < m; iteration++) {

			glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
			glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
			glViewport(0, 0, shadowMapWidth, shadowMapHeight);
			myGLTextureViewer.setShaderProg(shaderProg[SAT_HORIZONTAL_PASS_SHADER]);
			glUseProgram(shaderProg[SAT_HORIZONTAL_PASS_SHADER]);
			glUniform1i(glGetUniformLocation(shaderProg[SAT_HORIZONTAL_PASS_SHADER], "iteration"), iteration);
			if(iteration == 0)
				myGLTextureViewer.drawTextureOnShader(textures[SHADOW_MAP_COLOR], shadowMapWidth, shadowMapHeight);
			else
				myGLTextureViewer.drawTextureOnShader(textures[SAT_SHADOW_MAP_COLOR], shadowMapWidth, shadowMapHeight);
			glBindFramebuffer(GL_FRAMEBUFFER, 0);

			glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[SAT_SHADOW_FRAMEBUFFER]);
			glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
			glViewport(0, 0, shadowMapWidth, shadowMapHeight);
			myGLTextureViewer.setShaderProg(shaderProg[SAT_VERTICAL_PASS_SHADER]);
			glUseProgram(shaderProg[SAT_VERTICAL_PASS_SHADER]);
			glUniform1i(glGetUniformLocation(shaderProg[SAT_VERTICAL_PASS_SHADER], "iteration"), iteration);
			myGLTextureViewer.drawTextureOnShader(textures[TEMP_SHADOW_MAP_COLOR], shadowMapWidth, shadowMapHeight);
			glBindFramebuffer(GL_FRAMEBUFFER, 0);
			
		}
		
	}

	if(shadowParams.useHierarchicalShadowMap) renderHSM();
	
	glDisable(GL_CULL_FACE);
	glDisable(GL_POLYGON_OFFSET_FILL);
	
	glClearColor(0.63f, 0.82f, 0.96f, 1.0);
	GLuint shader;
	if(shadowParams.RBSSM) shader = shaderProg[RBSSM_SHADER];
	else shader = shaderProg[SOFT_SHADOW_SHADER];
	displaySceneFromCameraPOV(shader);
	
}

void renderScreenSpaceSoftShadows()
{

	//bug because we use GL_TEXTURE7 here and for the VERTEX_MAP_COLOR
	myGLTextureViewer.setShaderProg(shaderProg[CLEAR_IMAGE_SHADER]);
	myGLTextureViewer.drawTextureOnShader(textures[SHADOW_MAP_COLOR], shadowMapWidth, shadowMapHeight);
	
	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[GBUFFER_FRAMEBUFFER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromCameraPOV(shaderProg[GBUFFER_SHADER]);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	
	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[SHADOW_FRAMEBUFFER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromLightPOV();
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	if(shadowParams.useHierarchicalShadowMap) renderHSM();
	
	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[HARD_SHADOW_FRAMEBUFFER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	if(shadowParams.SSRBSSM) displaySceneFromGBuffer(shaderProg[GBUFFER_RSMSS_SHADER]);
	else displaySceneFromGBuffer(shaderProg[GBUFFER_HARD_SHADOW_SHADER]);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	
	if(shadowParams.SSPCSS || shadowParams.SSSM) {
		
		shadowParams.useHardShadowMap = true;
		glClearColor(0.0f, 0.0f, 0.0f, 1.0);
		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[PARTIAL_BLOCKER_SEARCH_MAP_FRAMEBUFFER]);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		displaySceneFromGBuffer(shaderProg[PARTIAL_BLOCKER_SEARCH_SHADER]);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);
		shadowParams.useHardShadowMap = false;
	
	}

	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	if(shadowParams.SSPCSS || shadowParams.SSSM) {
		shadowParams.usePartialAverageBlockerDepthMap = true;
		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[HARD_SHADOW_FRAMEBUFFER]);
	} else {
		shadowParams.useHardShadowMap = true;
		glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[PARTIAL_BLOCKER_SEARCH_MAP_FRAMEBUFFER]);
	}
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromGBuffer(shaderProg[PARTIAL_SHADOW_FILTERING_SHADER]);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	if(shadowParams.SSPCSS || shadowParams.SSSM) shadowParams.usePartialAverageBlockerDepthMap = false;
	else shadowParams.useHardShadowMap = false;
	
	if(shadowParams.SSPCSS || shadowParams.SSSM) shadowParams.useHardShadowMap = true;
	else shadowParams.usePartialAverageBlockerDepthMap = true;	
	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[SOFT_SHADOW_FRAMEBUFFER]);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromGBuffer(shaderProg[SCREEN_SPACE_SOFT_SHADOW_SHADER]);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	if(shadowParams.SSPCSS || shadowParams.SSSM) shadowParams.useHardShadowMap = false;
	else shadowParams.usePartialAverageBlockerDepthMap = false;
	
	glDisable(GL_CULL_FACE);
	glDisable(GL_POLYGON_OFFSET_FILL);
	
	shadowParams.useSoftShadowMap = true;
	glClearColor(0.63f, 0.82f, 0.96f, 1.0);
	displaySceneFromCameraPOV(shaderProg[GBUFFER_FINAL_RENDERING_SHADER]);
	shadowParams.useSoftShadowMap = false;

}

void display()
{
	
	if(shadowParams.monteCarlo)
		renderMonteCarlo();
	else if(shadowParams.adaptiveSampling)
		renderAdaptiveLightSourceSampling();
	else if(shadowParams.SSPCSS || shadowParams.SSABSS || shadowParams.SSSM || shadowParams.SSRBSSM)
		renderScreenSpaceSoftShadows();
	else 
		renderSoftShadows();

	glutSwapBuffers();
	glutPostRedisplay();

}

void idle()
{
	
	calculateFPS();

	if(animationOn) {
		if(!stop)
			animation += 6;
		if(animation == 1800)
			animation = -1800;
	}

}	

void keyboard(unsigned char key, int x, int y) 
{

	switch(key) {
	case 27:
		exit(0);
		break;
	case 's':
		shadowParams.SAT = !shadowParams.SAT;
		break;
	case 'k':
		std::cout << shadowParams.kernelSize << std::endl;
		break;
	case 'b':
		std::cout << shadowParams.blockerSearchSize << std::endl;
		break;
	case 'q':
		std::cout << quadTreeShadowMapSamples << std::endl;
		break;
	}

}

void specialKeyboard(int key, int x, int y)
{

	float temp;
	switch(key) {
	case GLUT_KEY_UP:
		if(cameraOn) {
			if(translationOn) {
				cameraEye[1] += vel;
				cameraAt[1] += vel;
			}
			if(rotationOn) {
				temp = cameraAt[2];
				cameraAt = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(1.0, 0.0, 0.0))) * cameraAt;
				cameraAt[2] = temp;
				cameraUp = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(1.0, 0.0, 0.0))) * glm::vec3(0.0, 1.0, 0.0);
			}
		} else {
			if(translationOn)
				translationVector[1] += vel;
			if(rotationOn)
				rotationAngles[1] += 5 * vel;
		}
		if(lightTranslationOn)
			lightTranslationVector[1] += 5 * vel;
		if(shadowIntensityOn)
			shadowParams.shadowIntensity += 0.05;
		if(changeKernelSizeOn)
			shadowParams.kernelSize += 2;
		if(changeBlockerSearchSizeOn)
			shadowParams.blockerSearchSize += 2;
		break;
	case GLUT_KEY_DOWN:
		if(cameraOn) {
			if(translationOn) {
				cameraEye[1] -= vel;
				cameraAt[1] -= vel;
			}
			if(rotationOn) {
				temp = cameraAt[2];
				cameraAt = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(1.0, 0.0, 0.0))) * cameraAt;
				cameraAt[2] = temp;
				cameraUp = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(1.0, 0.0, 0.0))) * glm::vec3(0.0, 1.0, 0.0);
			}
		} else {
			if(translationOn)
				translationVector[1] -= vel;
			if(rotationOn)
				rotationAngles[1] -= 5 * vel;
		}
		if(lightTranslationOn)
			lightTranslationVector[1] -= 5 * vel;
		if(shadowIntensityOn)
			shadowParams.shadowIntensity -= 0.05;
		if(changeKernelSizeOn)
			shadowParams.kernelSize -= 2;
		if(changeBlockerSearchSizeOn)
			shadowParams.blockerSearchSize -= 2;
		break;
	case GLUT_KEY_LEFT:
		if(cameraOn) {
			if(translationOn) {
				cameraEye[0] -= vel;
				cameraAt[0] -= vel;
			}
			if(rotationOn) {
				temp = cameraAt[2];
				cameraAt = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(0.0, 1.0, 0.0))) * cameraAt;
				cameraAt[2] = temp;
				cameraUp = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(0.0, 1.0, 0.0))) * glm::vec3(0.0, 1.0, 0.0);
			}
		} else {
			if(translationOn)
				translationVector[0] -= vel;
			if(rotationOn)
				rotationAngles[0] -= 5 * vel;
		}
		if(lightTranslationOn)
			lightTranslationVector[0] -= 5 * vel;
		break;
	case GLUT_KEY_RIGHT:
		if(cameraOn) {
			if(translationOn) {
				cameraEye[0] += vel;
				cameraAt[0] += vel;
			}
			if(rotationOn) {
				temp = cameraAt[2];
				cameraAt = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(0.0, 1.0, 0.0))) * cameraAt;
				cameraAt[2] = temp;
				cameraUp = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(0.0, 1.0, 0.0))) * glm::vec3(0.0, 1.0, 0.0);
			}
		} else {
			if(translationOn)
				translationVector[0] += vel;
			if(rotationOn)
				rotationAngles[0] += 5 * vel;
		}
		if(lightTranslationOn)
			lightTranslationVector[0] += 5 * vel;
		break;
	case GLUT_KEY_PAGE_UP:
		if(cameraOn) {
			if(translationOn) {
				cameraEye[2] += vel;
				cameraAt[2] += vel;
			}
			if(rotationOn) {
				cameraAt = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(0.0, 0.0, 1.0))) * cameraAt;
				cameraUp = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(0.0, 0.0, 1.0))) * glm::vec3(0.0, 1.0, 0.0);
			}
		} else {
			if(translationOn)
				translationVector[2] += vel;
			if(rotationOn)
				rotationAngles[2] += 5 * vel;
		}
		if(lightTranslationOn)
			lightTranslationVector[2] += 5 * vel;
		break;
	case GLUT_KEY_PAGE_DOWN:
		if(cameraOn) {
			if(translationOn) {
				cameraEye[2] -= vel;
				cameraAt[2] -= vel;
			}
			if(rotationOn) {
				cameraAt = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(0.0, 0.0, 1.0))) * cameraAt;
				cameraUp = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(0.0, 0.0, 1.0))) * glm::vec3(0.0, 1.0, 0.0);
			}
		} else {
			if(translationOn)
				translationVector[2] -= vel;
			if(rotationOn)
				rotationAngles[2] -= 5 * vel;
		}
		if(lightTranslationOn)
			lightTranslationVector[2] -= 5 * vel;
		break;
	}

}

void resetShadowParameters() {
	
	shadowParams.monteCarlo = false;
	shadowParams.adaptiveSampling = false;
	shadowParams.adaptiveSamplingLowerAccuracy = false;
	shadowParams.quadTreeEvaluation = false;
	shadowParams.PCSS = false;
	shadowParams.SAVSM = false;
	shadowParams.VSSM = false;
	shadowParams.ESSM = false;
	shadowParams.MSSM = false;
	shadowParams.RBSSM = false;
	shadowParams.SSPCSS = false;
	shadowParams.SSABSS = false;
	shadowParams.SSSM = false;
	shadowParams.SSRBSSM = false;
	shadowParams.useHardShadowMap = false;
	shadowParams.useSoftShadowMap = false;
	shadowParams.usePartialAverageBlockerDepthMap = false;
	shadowParams.useHierarchicalShadowMap = false;

}

void transformationMenu(int id) {

	switch(id)
	{
		case 0:
			translationOn = true;
			rotationOn = false;
			break;
		case 1:
			rotationOn = true;
			translationOn = false;
			break;
		case 2:
			lightTranslationOn = !lightTranslationOn;
			translationOn = false;
			break;
		case 3:
			cameraOn = !cameraOn;
			break;
	}

}

void otherFunctionsMenu(int id) {

	switch(id)
	{
		case 0:
				
			if(animationOn)
				stop = true;
			else
				animationOn = !animationOn;
			/*
			animationOn = !animationOn;
			animation = 0;
			*/
			break;
		case 1:
			shadowIntensityOn = !shadowIntensityOn;
			break;
		case 2:
			printf("LightPosition: %f %f %f\n", lightSource->getEye()[0], lightSource->getEye()[1], lightSource->getEye()[2]);
			printf("LightAt: %f %f %f\n", lightSource->getAt()[0], lightSource->getAt()[1], lightSource->getAt()[2]);
			printf("CameraPosition: %f %f %f\n", cameraEye[0], cameraEye[1], cameraEye[2]);
			printf("CameraAt: %f %f %f\n", cameraAt[0], cameraAt[1], cameraAt[2]);
			printf("Global Translation: %f %f %f\n", translationVector[0], translationVector[1], translationVector[2]);
			printf("Global Rotation: %f %f %f\n", rotationAngles[0], rotationAngles[1], rotationAngles[2]);
			break;
	}

}

void accurateSoftShadowMenu(int id) {
	
	switch(id) {
	case 0:
		resetShadowParameters();
		shadowParams.monteCarlo = true;
		shadowParams.numberOfSamples = uniformSampledLightSource->getNumberOfPointLights();
		for(int s = 0; s < 289; s++) shadowParams.accFactor[s] = 1.0;
		break;
	case 1:
		resetShadowParameters();
		shadowParams.adaptiveSampling = true;
		shadowParams.adaptiveSamplingLowerAccuracy = false;
		break;
	case 2:
		resetShadowParameters();
		shadowParams.adaptiveSampling = true;
		shadowParams.adaptiveSamplingLowerAccuracy = true;
		break;
	}

}
	
void plausibleSoftShadowMenu(int id) {

	switch(id) {
	case 0:
		resetShadowParameters();
		shadowParams.PCSS = true;
		shadowParams.SAT = false;
		break;
	case 1:
		resetShadowParameters();
		shadowParams.SAVSM = true;
		break;
	case 2:
		resetShadowParameters();
		shadowParams.VSSM = true;
		shadowParams.useHierarchicalShadowMap = true;
		break;
	case 3:
		resetShadowParameters();
		shadowParams.ESSM = true;
		break;
	case 4:
		resetShadowParameters();
		shadowParams.MSSM = true;
		break;
	case 5:
		resetShadowParameters();
		shadowParams.RBSSM = true;
		shadowParams.useHierarchicalShadowMap = true;
		break;
	}
}

void screenSpaceSoftShadowMenu(int id) {

	switch(id) {
	case 0:
		resetShadowParameters();
		shadowParams.SSPCSS = true;
		break;
	case 1:
		resetShadowParameters();
		shadowParams.SSABSS = true;
		break;
	case 2:
		resetShadowParameters();
		shadowParams.SSSM = true;
		break;
	case 3:
		resetShadowParameters();
		shadowParams.SSRBSSM = true;
		shadowParams.useHierarchicalShadowMap = true;
		break;
	}
}

void softShadowParametersMenu(int id) {

	switch(id) {
	case 0:
		changeKernelSizeOn = !changeKernelSizeOn;
		break;
	case 1:
		changeBlockerSearchSizeOn = !changeBlockerSearchSizeOn;
		break;
	}
		
}

void mainMenu(int id) {

	

}

void createMenu() {

	GLint accurateSoftShadowMenuID, plausibleSoftShadowMenuID, screenSpaceSoftShadowMenuID;
	GLint transformationMenuID, softShadowParametersMenuID, otherFunctionsMenuID;

	accurateSoftShadowMenuID = glutCreateMenu(accurateSoftShadowMenu);
		glutAddMenuEntry("Monte-Carlo Sampling", 0);
		glutAddMenuEntry("Adaptive Light Source Sampling", 1);
		glutAddMenuEntry("Adaptive Light Source Sampling (Lower Accuracy)", 2);

	plausibleSoftShadowMenuID = glutCreateMenu(plausibleSoftShadowMenu);
		glutAddMenuEntry("Percentage-Closer Soft Shadow Mapping", 0);
		glutAddMenuEntry("Summed-Area Variance Shadow Mapping", 1);
		glutAddMenuEntry("Variance Soft Shadow Mapping", 2);
		glutAddMenuEntry("Exponential Soft Shadow Mapping", 3);
		glutAddMenuEntry("Moment Soft Shadow Mapping", 4);
		glutAddMenuEntry("Revectorization-based Soft Shadow Mapping", 5);	
	
	screenSpaceSoftShadowMenuID = glutCreateMenu(screenSpaceSoftShadowMenu);
		glutAddMenuEntry("Screen-Space Percentage-Closer Soft Shadow Mapping", 0);
		glutAddMenuEntry("Screen-Space Anisotropic Blurred Soft Shadow Mapping", 1);
		glutAddMenuEntry("Separable Soft Shadow Mapping", 2);
		glutAddMenuEntry("Screen-Space Revectorization-based Soft Shadow Mapping", 3);

	transformationMenuID = glutCreateMenu(transformationMenu);
		glutAddMenuEntry("Translation", 0);
		glutAddMenuEntry("Rotation", 1);
		glutAddMenuEntry("Light Translation [On/Off]", 2);
		glutAddMenuEntry("Camera Movement [On/Off]", 3);

	softShadowParametersMenuID = glutCreateMenu(softShadowParametersMenu);
		glutAddMenuEntry("Change Kernel Size", 0);
		glutAddMenuEntry("Change Blocker Search Size", 1);

	otherFunctionsMenuID = glutCreateMenu(otherFunctionsMenu);
		glutAddMenuEntry("Animation [On/Off]", 0);
		glutAddMenuEntry("Shadow Intensity [On/Off]", 1);
		glutAddMenuEntry("Print Data", 2);
		
	glutCreateMenu(mainMenu);
		glutAddSubMenu("Accurate Soft Shadow Mapping", accurateSoftShadowMenuID);
		glutAddSubMenu("Plausible Soft Shadow Mapping", plausibleSoftShadowMenuID);
		glutAddSubMenu("Screen-Space Soft Shadow Mapping", screenSpaceSoftShadowMenuID);
		glutAddSubMenu("Soft Shadow Parameters", softShadowParametersMenuID);
		glutAddSubMenu("Transformation", transformationMenuID);
		glutAddSubMenu("Other Functions", otherFunctionsMenuID);
		glutAttachMenu(GLUT_RIGHT_BUTTON);

}

void initGL(char *configurationFile) {

	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	glShadeModel(GL_SMOOTH);
	glPixelStorei(GL_UNPACK_ALIGNMENT, 1);  

	if(textureArray[0] == 0)
		glGenTextures(1, textureArray);
	if(textures[0] == 0)
		glGenTextures(30, textures);
	if(frameBuffer[0] == 0)
		glGenFramebuffers(20, frameBuffer);
	if(sceneVBO[0] == 0)
		glGenBuffers(5, sceneVBO);
	if(sceneTextures[0] == 0)
		glGenTextures(4, sceneTextures);
	if(queryObject[0] == 0)
		glGenQueries(1, queryObject);

	scene = new Mesh();
	sceneLoader = new SceneLoader(configurationFile, scene);
	sceneLoader->load();
	 
	float centroid[3];
	lightSource = new LightSource();
	
	scene->computeCentroid(centroid);
	cameraEye[0] = sceneLoader->getCameraPosition()[0]; cameraEye[1] = sceneLoader->getCameraPosition()[1]; cameraEye[2] = sceneLoader->getCameraPosition()[2];
	cameraAt[0] = sceneLoader->getCameraAt()[0]; cameraAt[1] = sceneLoader->getCameraAt()[1]; cameraAt[2] = sceneLoader->getCameraAt()[2];
	cameraUp[0] = 0.0; cameraUp[1] = 0.0; cameraUp[2] = 1.0;
	lightSource->setAt(glm::vec3(sceneLoader->getLightAt()[0], sceneLoader->getLightAt()[1], sceneLoader->getLightAt()[2]));
	lightSource->setUp(glm::vec3(0.0, 0.0, 1.0));
	lightSource->setSize(16.0);
	
	uniformSampledLightSource = new UniformSampledLightSource(lightSource, 289.0);
	quadTreeLightSource = new QuadTreeLightSource(lightSource);

	resetShadowParameters();
	shadowParams.PCSS = true;
	shadowParams.useHierarchicalShadowMap = false;
	shadowParams.SAT = false;
	shadowParams.shadowMapWidth = shadowMapWidth;
	shadowParams.shadowMapHeight = shadowMapHeight;
	shadowParams.windowWidth = windowWidth;
	shadowParams.windowHeight = windowHeight;
	shadowParams.shadowIntensity = 0.25;
	shadowParams.blockerSearchSize = 7;
	shadowParams.kernelSize = 7;
	shadowParams.lightSourceRadius = lightSource->getSize()/2;
	shadowParams.blockerThreshold = 0.0075;
	shadowParams.filterThreshold = 1.0;
	shadowParams.maxSearch = 16;
	shadowParams.depthThreshold = sceneLoader->getDepthThreshold();
	shadowParams.HSMAlpha = sceneLoader->getHSMAlpha();
	shadowParams.HSMBeta = sceneLoader->getHSMBeta();

	bilateralFilter = new Filter();
	bilateralFilter->buildBilateralKernel(shadowParams.kernelSize);
	bilateralFilter->setSigmaColor(10.0);
	bilateralFilter->setSigmaSpace(0.01);

	myGLTextureViewer.loadQuad();
	createMenu();

	if(scene->textureFromImage())
		for(int num = 0; num < scene->getNumberOfTextures(); num++)
			myGLTextureViewer.loadRGBTexture(scene->getTexture()[num]->getData(), sceneTextures, num, scene->getTexture()[num]->getWidth(), scene->getTexture()[num]->getHeight());

	myGLTextureViewer.createDepthComponentTextureArray(textureArray, 0, shadowMapWidth, shadowMapHeight, 289);

	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, TEMP_SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, SAT_SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, HIERARCHICAL_SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, SOFT_SHADOW_MAP_COLOR, windowWidth, windowHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, HARD_SHADOW_MAP_COLOR, windowWidth, windowHeight, GL_NEAREST_MIPMAP_NEAREST);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, VERTEX_MAP_COLOR, windowWidth, windowHeight, GL_NEAREST);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, NORMAL_MAP_COLOR, windowWidth, windowHeight, GL_NEAREST);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, PARTIAL_BLOCKER_SEARCH_MAP_COLOR, windowWidth, windowHeight, GL_NEAREST);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, LEFT_TOP_SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, RIGHT_TOP_SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, LEFT_BOTTOM_SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, RIGHT_BOTTOM_SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, QUAD_TREE_REPROJECTION_COLOR, windowWidth, windowHeight, GL_NEAREST);

	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, TEMP_SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, SAT_SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, HIERARCHICAL_SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, SOFT_SHADOW_MAP_DEPTH, windowWidth, windowHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, HARD_SHADOW_MAP_DEPTH, windowWidth, windowHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, GBUFFER_MAP_DEPTH, windowWidth, windowHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, PARTIAL_BLOCKER_SEARCH_MAP_DEPTH, windowWidth, windowHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, LEFT_TOP_SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, RIGHT_TOP_SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, LEFT_BOTTOM_SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, RIGHT_BOTTOM_SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, QUAD_TREE_REPROJECTION_DEPTH, windowWidth, windowHeight);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[SHADOW_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[TEMP_SHADOW_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[TEMP_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[SAT_SHADOW_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[SAT_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[SAT_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[SOFT_SHADOW_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[SOFT_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[SOFT_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[HARD_SHADOW_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[HARD_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[HARD_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[GBUFFER_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[GBUFFER_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[VERTEX_MAP_COLOR], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT1, GL_TEXTURE_2D, textures[NORMAL_MAP_COLOR], 0);
	GLenum bufs[2];
	bufs[0] = GL_COLOR_ATTACHMENT0;
	bufs[1] = GL_COLOR_ATTACHMENT1;
	glDrawBuffers(2,bufs);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[PARTIAL_BLOCKER_SEARCH_MAP_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[PARTIAL_BLOCKER_SEARCH_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[PARTIAL_BLOCKER_SEARCH_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[LEFT_TOP_SHADOW_MAP_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[LEFT_TOP_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[LEFT_TOP_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[RIGHT_TOP_SHADOW_MAP_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[RIGHT_TOP_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[RIGHT_TOP_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[LEFT_BOTTOM_SHADOW_MAP_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[LEFT_BOTTOM_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[LEFT_BOTTOM_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[RIGHT_BOTTOM_SHADOW_MAP_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[RIGHT_BOTTOM_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[RIGHT_BOTTOM_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	glBindFramebuffer(GL_FRAMEBUFFER, frameBuffer[QUAD_TREE_REPROJECTION_FRAMEBUFFER]);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[QUAD_TREE_REPROJECTION_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[QUAD_TREE_REPROJECTION_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);

}

int main(int argc, char **argv) {

	glutInit(&argc, argv);
	glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH | GLUT_ALPHA);
	glutInitWindowSize(windowWidth, windowHeight);
	glutCreateWindow("Soft Shadow Mapping");

	glutReshapeFunc(reshape);
	glutDisplayFunc(display);
	glutIdleFunc(idle);
	glutKeyboardFunc(keyboard);
	glutSpecialFunc(specialKeyboard);

	glewInit();
	initGL(argv[1]);

	initShader("Shaders/Scene", SCENE_SHADER);
	initShader("Shaders/Image/Clear", CLEAR_IMAGE_SHADER);
	initShader("Shaders/Image/Copy", COPY_IMAGE_SHADER);
	initShader("Shaders/GBuffer/HardShadow", GBUFFER_HARD_SHADOW_SHADER);
	initShader("Shaders/GBuffer/FinalRendering", GBUFFER_FINAL_RENDERING_SHADER);
	initShader("Shaders/GBuffer/GBuffer", GBUFFER_SHADER);
	initShader("Shaders/GBuffer/RSMSS", GBUFFER_RSMSS_SHADER);
	initShader("Shaders/SoftShadow", SOFT_SHADOW_SHADER);
	initShader("Shaders/Exponential", EXPONENTIAL_SHADER);
	initShader("Shaders/Moments/Moments", MOMENT_SHADER);
	initShader("Shaders/Moments/SATHorizontalPass", SAT_HORIZONTAL_PASS_SHADER);
	initShader("Shaders/Moments/SATVerticalPass", SAT_VERTICAL_PASS_SHADER);
	initShader("Shaders/Moments/PrepareMinMax", PREPARE_MIN_MAX_SHADER);
	initShader("Shaders/Moments/MinMax", MIN_MAX_SHADER);
	initShader("Shaders/ScreenSpace/PartialAverageBlockerDepth", PARTIAL_BLOCKER_SEARCH_SHADER);
	initShader("Shaders/ScreenSpace/PartialShadowFiltering", PARTIAL_SHADOW_FILTERING_SHADER);
	initShader("Shaders/ScreenSpace/ScreenSpaceSoftShadow", SCREEN_SPACE_SOFT_SHADOW_SHADER);
	initShader("Shaders/Revectorization/RBSSM", RBSSM_SHADER);
	initShader("Shaders/QuadTree/Reprojection", QUAD_TREE_REPROJECTION_SHADER);
	initShader("Shaders/QuadTree/Evaluation", QUAD_TREE_EVALUATION_SHADER);
	initShader("Shaders/AccurateSoftShadow", ACCURATE_SOFT_SHADOW_SHADER);
	glUseProgram(0); 

	glutMainLoop();

	delete scene;
	delete sceneLoader;
	delete lightSource;
	delete uniformSampledLightSource;
	delete quadTreeLightSource;
	delete bilateralFilter;
	return 0;

}
