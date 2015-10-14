//References:
//Shadow Mapping - L. Willians. Casting Curved Shadows on Curved Surfaces. 1978
//Percentage-closer filtering - W. Reeves, D. Salesin and R. Cook. Rendering Antialiased Shadows with Depth Maps. 1987
//Rendering of back faces - Y. Wang and S. Molnar. Second-Depth Shadow Mapping. 1994
//Post-perspective shadow mapping - M. Stamminger and G. Drettakis. Perspective Shadow Maps. 2002
//Potential shadow receivers and linear depth values - Adaptation from S. Brabec et al. Practical Shadow Mapping. 2002
//Bicubic filtering - C. Sigg and M. Hadwiger. Fast third-order texture filtering. 2006
//Variance shadow maps - W. Donnelly and A. Lauritzen. Variance shadow maps. 2006
//Solving bias and light-bleeding reduction in variance shadow maps - A. Lauritzen. Summed-area variance shadow maps. 2007
//Exponential shadow maps - T. Annen et al. Exponential Shadow Maps. 2008
//Exponential variance shadow maps - A. Lauritzen and Michael McCool. Layered Variance Shadow Maps. 2008
//Solving temporal aliasing for fitting - F. Zhang et al. Practical Cascaded Shadow Maps. 2009
//Reference book - E. Eisemann et al. Real-Time Shadows. 2011
//Shadow Map Silhouette Revectorization - V. Boundarev. Shadow Map Silhouette Revectorization. 2014
//Moment shadow mapping - C. Peters and R. Klein. Moment shadow mapping. 2015
//http://rastergrid.com/blog/2010/09/efficient-gaussian-blur-with-linear-sampling/ for gaussian mask weights
//http://www.3drender.com/challenges/ (.obj, .mtl)
//http://graphics.cs.williams.edu/data/meshes.xml (.obj, .mtl)
//http://pt.slideshare.net/march1n0/probabilistic-approaches-to-shadow-maps-filtering-presentation for 32-bits ESM

#include <stdlib.h>
#include <GL/glew.h>
#include <GL/glut.h>
#include <stdio.h>
#include "Viewers\MyGLTextureViewer.h"
#include "Viewers\MyGLGeometryViewer.h"
#include "Viewers\shader.h"
#include "Viewers\ShadowParams.h"
#include "IO\SceneLoader.h"
#include "Mesh.h"
#include "Image.h"
#include "Filter.h"

enum 
{
	SHADOW_MAP_DEPTH = 0,
	SHADOW_MAP_COLOR = 1,
	GAUSSIAN_X_MAP_DEPTH = 2,
	GAUSSIAN_X_MAP_COLOR = 3,
	GAUSSIAN_Y_MAP_DEPTH = 4,
	GAUSSIAN_Y_MAP_COLOR = 5,
	RESULTING_SHADOW_MAP_DEPTH = 6,
	RESULTING_SHADOW_MAP_COLOR = 7,
};

enum
{
	SCENE_SHADER = 0,
	SHADOW_MAPPING_SHADER = 1,
	MOMENTS_SHADER = 2,
	GAUSSIAN_FILTER_SHADER = 3,
	LOG_GAUSSIAN_FILTER_SHADER = 4,
	EXPONENTIAL_SHADER = 5,
	EXPONENTIAL_MOMENT_SHADER = 6,
	SMSR_SHADER = 7,
	RSMSS_SHADER = 8
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

Image *framebufferImage;
Filter *gaussianFilter;

GLuint textures[10];
GLuint sceneVBO[5];
GLuint sceneTextures[4];

GLuint shadowFrameBuffer;
GLuint gaussianXFrameBuffer;
GLuint gaussianYFrameBuffer;
GLuint sceneFrameBuffer;

glm::vec3 cameraEye;
glm::vec3 cameraAt;
glm::vec3 cameraUp;
glm::vec3 lightEye;
glm::vec3 lightAt;
glm::vec3 lightUp;
glm::mat4 lightMVP;	
glm::mat4 lightMV;
glm::mat4 lightP;

GLuint ProgramObject = 0;
GLuint VertexShaderObject = 0;
GLuint FragmentShaderObject = 0;
GLuint shaderVS, shaderFS, shaderProg[15];   // handles to objects
GLint  linked;

float translationVector[3] = {0.0, 0.0, 0.0};
float lightTranslationVector[3] = {0.0, 0.0, 0.0};
float rotationAngles[3] = {0.0, 0.0, 0.0};

bool translationOn = false;
bool lightTranslationOn = false;
bool rotationOn = false;
bool changeKernelSizeOn = false;
bool animationOn = false;
bool cameraOn = false;
bool shadowIntensityOn = false;
bool stop = false;
int vel = 1;
float animation = -1800;

float xmin, xmax, ymin, ymax;

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
	myGLGeometryViewer.configurePhong(lightEye, cameraEye);
	
	//glColor3f(0.0, 1.0, 0.0);
	myGLGeometryViewer.loadVBOs(sceneVBO, scene);
	myGLGeometryViewer.drawMesh(sceneVBO, scene->getIndicesSize(), scene->getTextureCoordsSize(), scene->getColorsSize(), scene->textureFromImage(), sceneTextures, 
		scene->getNumberOfTextures());

}

void updateLight()
{

	lightEye[0] = sceneLoader->getLightPosition()[0] + lightTranslationVector[0];
	lightEye[1] = sceneLoader->getLightPosition()[1] + lightTranslationVector[1];
	lightEye[2] = sceneLoader->getLightPosition()[2] + lightTranslationVector[2];

	if(animationOn)
		lightEye = glm::mat3(glm::rotate((float)animation/10, glm::vec3(0, 1, 0))) * lightEye;

}

void debugVisualization()
{

	if(animationOn)
	{
		myGLTextureViewer.loadFrameBufferTexture(0, 0, windowWidth, windowHeight, framebufferImage->getData());
		framebufferImage->splitSMSR();
		/*
		sprintf(fileName, "images/%d.png", (int)(animation/6) + 300);	
		std::cout << "Saving ..." << fileName << std::endl;
		framebufferImage->save(fileName);
		*/

		if(animation == 1794) {
			animationOn = false;
			framebufferImage->printSMSR();
		}

	}

}

void displaySceneFromLightPOV()
{

	glViewport(0, 0, shadowMapWidth, shadowMapHeight);
	
	updateLight();
	
	if(shadowParams.VSM || shadowParams.MSM) {
		glUseProgram(shaderProg[MOMENTS_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[MOMENTS_SHADER]);
		myGLGeometryViewer.configureMoments(shadowParams);
		myGLGeometryViewer.configureLinearization();
	} else if(shadowParams.ESM) {
		glUseProgram(shaderProg[EXPONENTIAL_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[EXPONENTIAL_SHADER]);
		myGLGeometryViewer.configureLinearization();
	} else if(shadowParams.EVSM) {
		glUseProgram(shaderProg[EXPONENTIAL_MOMENT_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[EXPONENTIAL_MOMENT_SHADER]);
		myGLGeometryViewer.configureLinearization();		
	} else {
		glUseProgram(shaderProg[SCENE_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[SCENE_SHADER]);
	}
	
	//if(!shadowParams.ESM) {
		//glEnable(GL_CULL_FACE);
		//glCullFace(GL_BACK);
	//}

	glPolygonOffset(4.0f, 20.0f);
	glEnable(GL_POLYGON_OFFSET_FILL);
	
	myGLGeometryViewer.setEye(lightEye);
	myGLGeometryViewer.setLook(lightAt);
	myGLGeometryViewer.setUp(lightUp);
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
	lightMV = view * model;
	lightP = projection;

	displayScene();
	glUseProgram(0);

}

void displaySceneFromCameraPOV()
{

	glViewport(0, 0, windowWidth, windowHeight);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	
	updateLight();
	lightEye = glm::mat3(glm::rotate((float)180.0, glm::vec3(0, 1, 0))) * lightEye;

	glUseProgram(shaderProg[SHADOW_MAPPING_SHADER]);
	myGLGeometryViewer.setShaderProg(shaderProg[SHADOW_MAPPING_SHADER]);
	if(shadowParams.VSM || shadowParams.ESM || shadowParams.EVSM || shadowParams.MSM) 
		shadowParams.shadowMap = textures[GAUSSIAN_Y_MAP_COLOR];
	else
		shadowParams.shadowMap = textures[SHADOW_MAP_DEPTH];
	
	shadowParams.lightMVP = lightMVP;
	shadowParams.lightMV = lightMV;
	shadowParams.lightP = lightP;
	myGLGeometryViewer.setEye(cameraEye);
	myGLGeometryViewer.setLook(cameraAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(windowWidth, windowHeight);
	myGLGeometryViewer.configureShadow(shadowParams);
	myGLGeometryViewer.setIsCameraViewpoint(true);

	displayScene();
	glUseProgram(0);

}

void renderSMSR()
{

	glViewport(0, 0, windowWidth, windowHeight);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	
	updateLight();
	lightEye = glm::mat3(glm::rotate((float)180.0, glm::vec3(0, 1, 0))) * lightEye;
	
	if(shadowParams.SMSR || shadowParams.RPCFPlusSMSR){
		glUseProgram(shaderProg[SMSR_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[SMSR_SHADER]);
	} else if(shadowParams.RSMSS || shadowParams.RPCFPlusRSMSS) {
		glUseProgram(shaderProg[RSMSS_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[RSMSS_SHADER]);
	}

	shadowParams.shadowMap = textures[SHADOW_MAP_DEPTH];

	shadowParams.lightMVP = lightMVP;
	shadowParams.lightMV = lightMV;
	shadowParams.lightP = lightP;
	myGLGeometryViewer.setEye(cameraEye);
	myGLGeometryViewer.setLook(cameraAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(windowWidth, windowHeight);
	myGLGeometryViewer.configureRevectorization(shadowParams, windowWidth, windowHeight);
	myGLGeometryViewer.setIsCameraViewpoint(true);

	displayScene();
	glUseProgram(0);

}

void display()
{
	
	//Rob Basler in http://fabiensanglard.net/shadowmappingVSM/ found out that the color buffer, 
	//when used to store depth, should be cleared to 1.0 to run properly
	
	glClearColor(1.0f, 1.0f, 1.0f, 1.0);
	glBindFramebuffer(GL_FRAMEBUFFER, shadowFrameBuffer);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromLightPOV();
	glBindFramebuffer(GL_FRAMEBUFFER, 0);	
	
	if(shadowParams.VSM || shadowParams.ESM || shadowParams.EVSM || shadowParams.MSM) {

		if(shadowParams.VSM || shadowParams.MSM || shadowParams.EVSM)
			myGLTextureViewer.setShaderProg(shaderProg[GAUSSIAN_FILTER_SHADER]);
		else
			myGLTextureViewer.setShaderProg(shaderProg[LOG_GAUSSIAN_FILTER_SHADER]);
		
		glBindFramebuffer(GL_FRAMEBUFFER, gaussianXFrameBuffer);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		glViewport(0, 0, windowWidth, windowHeight);
		myGLTextureViewer.configureSeparableFilter(gaussianFilter->getOrder(), gaussianFilter->getKernel(), true, false);
		myGLTextureViewer.drawTextureOnShader(textures[SHADOW_MAP_COLOR], windowWidth, windowHeight);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);		
		
		glBindFramebuffer(GL_FRAMEBUFFER, gaussianYFrameBuffer);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		glViewport(0, 0, windowWidth, windowHeight);
		myGLTextureViewer.configureSeparableFilter(gaussianFilter->getOrder(), gaussianFilter->getKernel(), false, true);
		myGLTextureViewer.drawTextureOnShader(textures[GAUSSIAN_X_MAP_COLOR], windowWidth, windowHeight);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);		
		
		//we must build the mip-map version of the final blurred map in order to VSM run correctly
		glBindTexture(GL_TEXTURE_2D, textures[GAUSSIAN_Y_MAP_COLOR]);
		glGenerateMipmap(GL_TEXTURE_2D);

	}
	
	
	glDisable(GL_CULL_FACE);
	glDisable(GL_POLYGON_OFFSET_FILL);
	
	if(shadowParams.SMSR || shadowParams.RPCFPlusSMSR || shadowParams.RSMSS || shadowParams.RPCFPlusRSMSS) {
				
		glClearColor(0.63f, 0.82f, 0.96f, 1.0);
		renderSMSR();

	} else {

		glClearColor(0.63f, 0.82f, 0.96f, 1.0);
		displaySceneFromCameraPOV();
		
	}
	
	if(shadowParams.debug)
		debugVisualization();
	
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

void resetShadowParams()
{
	
	shadowParams.bilinearPCF = false;
	shadowParams.tricubicPCF = false;
	shadowParams.VSM = false;
	shadowParams.ESM = false;
	shadowParams.EVSM = false;
	shadowParams.MSM = false;
	shadowParams.naive = false;
	shadowParams.SMSR = false;
	shadowParams.showEnteringDiscontinuityMap = false;
	shadowParams.showExitingDiscontinuityMap = false;
	shadowParams.showONDS = false;
	shadowParams.showClippedONDS = false;
	shadowParams.showSubCoord = false;	
	shadowParams.RPCFPlusSMSR = false;
	shadowParams.RPCFPlusRSMSS = false;
	shadowParams.RSMSS = false;

}

void keyboard(unsigned char key, int x, int y) 
{

	switch(key) {
	case 27:
		exit(0);
		break;
	case 's':
		animationOn = true;
		debugVisualization();
		animationOn = false;
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
			gaussianFilter->buildGaussianKernel(gaussianFilter->getOrder() + 2);
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
		if(changeKernelSizeOn) {
			if(gaussianFilter->getOrder() > 3)
				gaussianFilter->buildGaussianKernel(gaussianFilter->getOrder() - 2);
		}
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

void shadowFilteringMenu(int id) {

	switch(id)
	{
		case 0:
			resetShadowParams();
			shadowParams.bilinearPCF = true;
			break;
		case 1:
			resetShadowParams();
			shadowParams.tricubicPCF = true;
			break;
		case 2:
			resetShadowParams();
			shadowParams.VSM = true;
			break;
		case 3:
			resetShadowParams();
			shadowParams.ESM = true;
			break;
		case 4:
			resetShadowParams();
			shadowParams.EVSM = true;
			break;
		case 5:
			resetShadowParams();
			shadowParams.MSM = true;
			break;
	}

}

void shadowRevectorizationBasedFilteringMenu(int id) {

	switch(id)
	{
		case 0:
			resetShadowParams();
			shadowParams.RPCFPlusSMSR = true;
			break;
		case 1:
			resetShadowParams();
			shadowParams.RPCFPlusRSMSS = true;
			break;
		case 2:
			resetShadowParams();
			shadowParams.RSMSS = true;
			break;
	}
}

void shadowRevectorizationMenu(int id) {

	switch(id)
	{
		case 0:
			resetShadowParams();
			shadowParams.SMSR = true;
			break;
		case 1:
			shadowParams.showEnteringDiscontinuityMap = true;
			shadowParams.showExitingDiscontinuityMap = false;
			shadowParams.showONDS = false;
			shadowParams.showClippedONDS = false;
			shadowParams.showSubCoord = false;
			break;
		case 2:
			shadowParams.showEnteringDiscontinuityMap = false;
			shadowParams.showExitingDiscontinuityMap = true;
			shadowParams.showONDS = false;
			shadowParams.showClippedONDS = false;
			shadowParams.showSubCoord = false;
			break;
		case 3:
			shadowParams.showEnteringDiscontinuityMap = false;
			shadowParams.showExitingDiscontinuityMap = false;
			shadowParams.showONDS = true;
			shadowParams.showClippedONDS = false;
			shadowParams.showSubCoord = false;
			break;
		case 4:
			shadowParams.showEnteringDiscontinuityMap = false;
			shadowParams.showExitingDiscontinuityMap = false;
			shadowParams.showONDS = false;
			shadowParams.showClippedONDS = true;
			shadowParams.showSubCoord = false;
			break;
		case 5:
			shadowParams.showEnteringDiscontinuityMap = false;
			shadowParams.showExitingDiscontinuityMap = false;
			shadowParams.showONDS = false;
			shadowParams.showClippedONDS = false;
			shadowParams.showSubCoord = true;
			break;
	}

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
				
			if(animationOn) {
				stop = true;
				std::cout << animation << std::endl;
			} else
				animationOn = !animationOn;
			/*
			animationOn = !animationOn;
			animation = 0;
			*/
			break;
		case 1:
			shadowParams.adaptiveDepthBias = !shadowParams.adaptiveDepthBias;
			break;
		case 2:
			shadowIntensityOn = !shadowIntensityOn;
			break;
		case 3:
			changeKernelSizeOn = !changeKernelSizeOn;
			break;
		case 4:
			printf("LightPosition: %f %f %f\n", lightEye[0], lightEye[1], lightEye[2]);
			printf("LightAt: %f %f %f\n", lightAt[0], lightAt[1], lightAt[2]);
			printf("CameraPosition: %f %f %f\n", cameraEye[0], cameraEye[1], cameraEye[2]);
			printf("CameraAt: %f %f %f\n", cameraAt[0], cameraAt[1], cameraAt[2]);
			printf("Global Translation: %f %f %f\n", translationVector[0], translationVector[1], translationVector[2]);
			printf("Global Rotation: %f %f %f\n", rotationAngles[0], rotationAngles[1], rotationAngles[2]);
			break;
		case 5:
			shadowParams.debug = !shadowParams.debug;
			break;
	}

}

void mainMenu(int id) {

	switch(id)
	{
		case 0:
			resetShadowParams();
			shadowParams.naive = true;
		break;
	}

}

void createMenu() {

	GLint shadowFilteringMenuID, shadowRevectorizationMenuID, shadowRevectorizationBasedFilteringMenuID, transformationMenuID, otherFunctionsMenuID;

	shadowFilteringMenuID = glutCreateMenu(shadowFilteringMenu);
		glutAddMenuEntry("Bilinear Percentage-Closer Filtering", 0);
		glutAddMenuEntry("Tricubic Percentage-Closer Filtering", 1);
		glutAddMenuEntry("Variance Shadow Mapping", 2);
		glutAddMenuEntry("Exponential Shadow Mapping", 3);
		glutAddMenuEntry("Exponential Variance Shadow Mapping", 4);
		glutAddMenuEntry("Moment Shadow Mapping", 5);

	shadowRevectorizationMenuID = glutCreateMenu(shadowRevectorizationMenu);
		glutAddMenuEntry("Silhouette Revectorization", 0);
		glutAddMenuEntry("Entering Discontinuity Map", 1);
		glutAddMenuEntry("Exiting Discontinuity Map", 2);
		glutAddMenuEntry("Normalized Discontinuity", 3);
		glutAddMenuEntry("Clipped Discontinuity", 4);
		glutAddMenuEntry("Light Sub Coordinates", 5);
		
	shadowRevectorizationBasedFilteringMenuID = glutCreateMenu(shadowRevectorizationBasedFilteringMenu);
		glutAddMenuEntry("Percentage-Closer Filtering", 0);
		glutAddMenuEntry("Percentage-Closer Filtering (Sub-Coord Accuracy)", 1);
		glutAddMenuEntry("Shadow Map Silhouette Filtering", 2);

	transformationMenuID = glutCreateMenu(transformationMenu);
		glutAddMenuEntry("Translation", 0);
		glutAddMenuEntry("Rotation", 1);
		glutAddMenuEntry("Light Translation [On/Off]", 2);
		glutAddMenuEntry("Camera Movement [On/Off]", 3);

	otherFunctionsMenuID = glutCreateMenu(otherFunctionsMenu);
		glutAddMenuEntry("Animation [On/Off]", 0);
		glutAddMenuEntry("Adaptive Depth Bias [On/Off]", 1);
		glutAddMenuEntry("Shadow Intensity [On/Off]", 2);
		glutAddMenuEntry("Change Kernel Size", 3);
		glutAddMenuEntry("Print Data", 4);
		glutAddMenuEntry("Debug Visualization", 5);
		
	glutCreateMenu(mainMenu);
		glutAddMenuEntry("Shadow Mapping", 0);
		glutAddSubMenu("Shadow Filtering", shadowFilteringMenuID);
		glutAddSubMenu("Shadow Revectorization", shadowRevectorizationMenuID);
		glutAddSubMenu("Revectorization-based Shadow Filtering", shadowRevectorizationBasedFilteringMenuID);
		glutAddSubMenu("Transformation", transformationMenuID);
		glutAddSubMenu("Other Functions", otherFunctionsMenuID);
		glutAttachMenu(GLUT_RIGHT_BUTTON);

}

void initGL(char *configurationFile) {

	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	glShadeModel(GL_SMOOTH);
	glPixelStorei( GL_UNPACK_ALIGNMENT, 1);  

	if(textures[0] == 0)
		glGenTextures(10, textures);
	if(shadowFrameBuffer == 0)
		glGenFramebuffers(1, &shadowFrameBuffer);
	if(gaussianXFrameBuffer == 0)
		glGenFramebuffers(1, &gaussianXFrameBuffer);
	if(gaussianYFrameBuffer == 0)
		glGenFramebuffers(1, &gaussianYFrameBuffer);
	if(sceneFrameBuffer == 0)
		glGenFramebuffers(1, &sceneFrameBuffer);
	if(sceneVBO[0] == 0)
		glGenBuffers(5, sceneVBO);
	if(sceneTextures[0] == 0)
		glGenTextures(4, sceneTextures);

	scene = new Mesh();
	sceneLoader = new SceneLoader(configurationFile, scene);
	sceneLoader->load();
	
	framebufferImage = new Image(windowWidth, windowHeight, 3);

	gaussianFilter = new Filter();
	gaussianFilter->buildGaussianKernel(3);

	float centroid[3];
	scene->computeCentroid(centroid);
	cameraEye[0] = sceneLoader->getCameraPosition()[0]; cameraEye[1] = sceneLoader->getCameraPosition()[1]; cameraEye[2] = sceneLoader->getCameraPosition()[2];
	cameraAt[0] = sceneLoader->getCameraAt()[0]; cameraAt[1] = sceneLoader->getCameraAt()[1]; cameraAt[2] = sceneLoader->getCameraAt()[2];
	lightAt[0] = sceneLoader->getLightAt()[0]; lightAt[1] = sceneLoader->getLightAt()[1]; lightAt[2] = sceneLoader->getLightAt()[2];
	cameraUp[0] = 0.0; cameraUp[1] = 0.0; cameraUp[2] = 1.0;
	lightUp[0] = 0.0; lightUp[1] = 0.0; lightUp[2] = 1.0;

	shadowParams.shadowMapWidth = shadowMapWidth;
	shadowParams.shadowMapHeight = shadowMapHeight;
	shadowParams.maxSearch = 256;
	shadowParams.depthThreshold = sceneLoader->getDepthThreshold();
	resetShadowParams();
	shadowParams.naive = true;
	shadowParams.adaptiveDepthBias = true;
	shadowParams.shadowIntensity = 0.25;
	shadowParams.debug = false;

	myGLTextureViewer.loadQuad();
	createMenu();

	if(scene->textureFromImage())
		for(int num = 0; num < scene->getNumberOfTextures(); num++)
			myGLTextureViewer.loadRGBTexture(scene->getTexture()[num]->getData(), sceneTextures, num, scene->getTexture()[num]->getWidth(), scene->getTexture()[num]->getHeight());
	
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, GAUSSIAN_X_MAP_COLOR, windowWidth, windowHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, GAUSSIAN_Y_MAP_COLOR, windowWidth, windowHeight);
	myGLTextureViewer.loadRGBATexture((float*)NULL, textures, RESULTING_SHADOW_MAP_COLOR, windowWidth, windowHeight);

	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, GAUSSIAN_X_MAP_DEPTH, windowWidth, windowHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, GAUSSIAN_Y_MAP_DEPTH, windowWidth, windowHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, RESULTING_SHADOW_MAP_DEPTH, windowWidth, windowHeight);

	glBindFramebuffer(GL_FRAMEBUFFER, shadowFrameBuffer);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	if(glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE)
		printf("FBO OK\n");

	glBindFramebuffer(GL_FRAMEBUFFER, gaussianXFrameBuffer);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[GAUSSIAN_X_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[GAUSSIAN_X_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	if(glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE)
		printf("FBO OK\n");

	glBindFramebuffer(GL_FRAMEBUFFER, gaussianYFrameBuffer);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[GAUSSIAN_Y_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[GAUSSIAN_Y_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	if(glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE)
		printf("FBO OK\n");

	glBindFramebuffer(GL_FRAMEBUFFER, sceneFrameBuffer);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[RESULTING_SHADOW_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[RESULTING_SHADOW_MAP_COLOR], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	if(glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE)
		printf("FBO OK\n");
	
}



int main(int argc, char **argv) {

	glutInit(&argc, argv);
	glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH | GLUT_ALPHA);
	glutInitWindowSize(windowWidth, windowHeight);
	glutCreateWindow("Shadow Mapping");

	glutReshapeFunc(reshape);
	glutDisplayFunc(display);
	glutIdleFunc(idle);
	glutKeyboardFunc(keyboard);
	glutSpecialFunc(specialKeyboard);

	glewInit();
	initGL(argv[1]);

	initShader("Shaders/Scene", SCENE_SHADER);
	initShader("Shaders/Shadow", SHADOW_MAPPING_SHADER);
	initShader("Shaders/Moments", MOMENTS_SHADER);
	initShader("Shaders/Exponential", EXPONENTIAL_SHADER);
	initShader("Shaders/ExponentialMoments", EXPONENTIAL_MOMENT_SHADER);
	initShader("Shaders/GaussianFilter", GAUSSIAN_FILTER_SHADER);
	initShader("Shaders/LogGaussianFilter", LOG_GAUSSIAN_FILTER_SHADER);
	initShader("Shaders/SMSR", SMSR_SHADER);
	initShader("Shaders/RSMSS", RSMSS_SHADER);
	glUseProgram(0); 

	glutMainLoop();

	delete scene;
	delete sceneLoader;
	delete framebufferImage;
	delete gaussianFilter;
	return 0;

}
