//References:
//Shadow Mapping - L. Willians. Casting Curved Shadows on Curved Surfaces. 1978
//Percentage-closer filtering - W. Reeves, D. Salesin and R. Cook. Rendering Antialiased Shadows with Depth Maps. 1987
//Rendering of back faces - Y. Wang and S. Molnar. Second-Depth Shadow Mapping. 1994
//Post-perspective shadow mapping - M. Stamminger and G. Drettakis. Perspective Shadow Maps. 2002
//Potential shadow receivers and linear depth values - Adaptation from S. Brabec et al. Practical Shadow Mapping. 2002
//Bicubic filtering - C. Sigg and M. Hadwiger. Fast third-order texture filtering. 2006
//Variance shadow maps - W. Donnelly and A. Lauritzen. Variance shadow maps. 2006
//Solving bias and light-bleeding reduction in variance shadow maps - A. Lauritzen. Summed-area variance shadow maps. 2007
//Exponential shadow maps. T. Annen et al. Exponential Shadow Maps. 2008
//Exponential variance shadow maps. A. Lauritzen and Michael McCool. Layered Variance Shadow Maps. 2008
//Solving temporal aliasing for fitting - F. Zhang et al. Practical Cascaded Shadow Maps. 2009
//Reference book - E. Eisemann et al. Real-Time Shadows. 2011
//Shadow Map Silhouette Revectorization - V. Boundarev. Shadow Map Silhouette Revectorization. 2014
//Moment shadow mapping - C. Peters and R. Klein. Moment shadow mapping. 2015
//http://rastergrid.com/blog/2010/09/efficient-gaussian-blur-with-linear-sampling/ for gaussian mask weights
//http://www.3drender.com/challenges/ (.obj, .mtl)
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
	DISCONTINUITY_MAP_DEPTH = 8,
	DISCONTINUITY_MAP_COLOR = 9
};

enum
{
	PHONG_SHADER = 0,
	SHADOW_MAPPING_SHADER = 1,
	PSR_SHADER = 2,
	MOMENTS_SHADER = 3,
	GAUSSIAN_X_SHADER = 4,
	GAUSSIAN_Y_SHADER = 5,
	LOG_GAUSSIAN_X_SHADER = 6,
	LOG_GAUSSIAN_Y_SHADER = 7,
	EXPONENTIAL_SHADER = 8,
	EXPONENTIAL_MOMENT_SHADER = 9,
	DISCONTINUITY_SHADER = 10,
	REVECTORIZATION_SHADER = 11
};

bool temp = false;
//Window size
int windowWidth = 640;
int windowHeight = 480;

int shadowMapWidth = 640;
int shadowMapHeight = 480;

int PSRMapWidth = 640;
int PSRMapHeight = 480;

//  The number of frames
int frameCount = 0;
float fps = 0;
int currentTime = 0, previousTime = 0;

MyGLTextureViewer myGLTextureViewer;
MyGLGeometryViewer myGLGeometryViewer;
ShadowParams shadowParams;

Mesh *scene;
SceneLoader *sceneLoader;

Image *lightView;

GLuint textures[10];
GLuint sceneVBO[5];
GLuint sceneTextures[4];

GLuint shadowFrameBuffer;
GLuint gaussianXFrameBuffer;
GLuint gaussianYFrameBuffer;
GLuint sceneFrameBuffer;
GLuint discontinuityFrameBuffer;

glm::vec3 cameraEye;
glm::vec3 cameraAt;
glm::vec3 cameraUp;
glm::vec3 lightEye;
glm::vec3 lightAt;
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
bool psrOn = false;
bool animationOn = false;
bool cameraOn = false;
bool shadowIntensityOn = false;

int vel = 1;
//+900 
//-150
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
	myGLGeometryViewer.drawMesh(sceneVBO, scene->getIndicesSize(), scene->getTextureCoordsSize(), scene->getColorsSize(), scene->textureFromImage(), sceneTextures[0]);

}

void updateLight()
{

	lightEye[0] = sceneLoader->getLightPosition()[0] + lightTranslationVector[0];
	lightEye[1] = sceneLoader->getLightPosition()[1] + lightTranslationVector[1];
	lightEye[2] = sceneLoader->getLightPosition()[2] + lightTranslationVector[2];

	if(animationOn)
		lightEye = glm::mat3(glm::rotate((float)animation/10, glm::vec3(0, 1, 0))) * lightEye;

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
		glUseProgram(shaderProg[PHONG_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[PHONG_SHADER]);
	}
	
	//if(!shadowParams.ESM) {
		//glEnable(GL_CULL_FACE);
		//glCullFace(GL_BACK);
	//}

	glPolygonOffset(4.0f, 20.0f);
	glEnable(GL_POLYGON_OFFSET_FILL);
	
	myGLGeometryViewer.setEye(lightEye);
	myGLGeometryViewer.setLook(lightAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(shadowMapWidth, shadowMapHeight);
	myGLGeometryViewer.setIsCameraViewpoint(false);

	glm::mat4 projection = myGLGeometryViewer.getProjectionMatrix();
	glm::mat4 view = myGLGeometryViewer.getViewMatrix();
	glm::mat4 model = myGLGeometryViewer.getModelMatrix();
	
	model *= glm::translate(glm::vec3(translationVector[0], translationVector[1], translationVector[2]));
	model *= glm::rotate(rotationAngles[0], glm::vec3(1, 0, 0));
	model *= glm::rotate(rotationAngles[1], glm::vec3(0, 1, 0));
	model *= glm::rotate(rotationAngles[2], glm::vec3(0, 0, 1));
	
	if(psrOn) {
	
		glm::mat4 psr = myGLGeometryViewer.getPSRMatrix();
		projection = psr * projection;
		myGLGeometryViewer.setProjectionMatrix(projection);
	
	}

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

void renderSMSR(bool computeDiscontinuity)
{


	glViewport(0, 0, windowWidth, windowHeight);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	
	if(computeDiscontinuity || shadowParams.RPCF || shadowParams.RPCFSubCoordAccuracy) {
		updateLight();
		lightEye = glm::mat3(glm::rotate((float)180.0, glm::vec3(0, 1, 0))) * lightEye;
	}

	if(computeDiscontinuity) {
		glUseProgram(shaderProg[DISCONTINUITY_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[DISCONTINUITY_SHADER]);
	} else if(shadowParams.SMSR || shadowParams.RPCF || shadowParams.RSMSF || shadowParams.RPCFSubCoordAccuracy){
		glUseProgram(shaderProg[REVECTORIZATION_SHADER]);
		myGLGeometryViewer.setShaderProg(shaderProg[REVECTORIZATION_SHADER]);
	}

	shadowParams.shadowMap = textures[SHADOW_MAP_DEPTH];
	shadowParams.discontinuityMap = textures[DISCONTINUITY_MAP_COLOR];

	shadowParams.lightMVP = lightMVP;
	shadowParams.lightMV = lightMV;
	shadowParams.lightP = lightP;
	myGLGeometryViewer.setEye(cameraEye);
	myGLGeometryViewer.setLook(cameraAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(windowWidth, windowHeight);
	myGLGeometryViewer.configureRevectorization(shadowParams, windowWidth, windowHeight, computeDiscontinuity);
	myGLGeometryViewer.setIsCameraViewpoint(true);

	displayScene();
	glUseProgram(0);

}

void computePSR()
{

	glViewport(0, 0, PSRMapWidth, PSRMapHeight);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	
	updateLight();
	
	glUseProgram(shaderProg[PSR_SHADER]);

	glEnable(GL_CULL_FACE);
	glCullFace(GL_FRONT);
	glPolygonOffset(2.5f, 10.0f);
	glEnable(GL_POLYGON_OFFSET_FILL);
	
	myGLGeometryViewer.setShaderProg(shaderProg[PSR_SHADER]);
	myGLGeometryViewer.setEye(lightEye);
	myGLGeometryViewer.setLook(lightAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(PSRMapWidth, PSRMapHeight);
	
	glm::mat4 projection = myGLGeometryViewer.getProjectionMatrix();
	glm::mat4 view = myGLGeometryViewer.getViewMatrix();
	glm::mat4 model = myGLGeometryViewer.getModelMatrix();
	
	model *= glm::translate(glm::vec3(translationVector[0], translationVector[1], translationVector[2]));
	model *= glm::rotate(rotationAngles[0], glm::vec3(1, 0, 0));
	model *= glm::rotate(rotationAngles[1], glm::vec3(0, 1, 0));
	model *= glm::rotate(rotationAngles[2], glm::vec3(0, 0, 1));

	displayScene();
	glUseProgram(0);

	glReadPixels(0, 0, PSRMapWidth, PSRMapHeight, GL_RGB, GL_UNSIGNED_BYTE, lightView->getData());
	lightView->computeBoundingBoxFromOpenGLImage();
	myGLGeometryViewer.configurePSRMatrix(lightView->getXMin(), lightView->getXMax(), lightView->getYMin(), lightView->getYMax(), 6, PSRMapWidth, PSRMapHeight);
	
}

void display()
{
	
	if(psrOn)
		computePSR();
	
	//Rob Basler in http://fabiensanglard.net/shadowmappingVSM/ found out that the color buffer, 
	//when used to store depth, should be cleared to 1.0 to run properly
	
	glClearColor(1.0f, 1.0f, 1.0f, 1.0);
	glBindFramebuffer(GL_FRAMEBUFFER, shadowFrameBuffer);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromLightPOV();
	glBindFramebuffer(GL_FRAMEBUFFER, 0);	
	
	
	if(shadowParams.VSM || shadowParams.ESM || shadowParams.EVSM || shadowParams.MSM) {

		glBindFramebuffer(GL_FRAMEBUFFER, gaussianXFrameBuffer);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		glViewport(0, 0, windowWidth, windowHeight);
		if(shadowParams.VSM || shadowParams.MSM)
			myGLTextureViewer.setShaderProg(shaderProg[GAUSSIAN_X_SHADER]);
		else
			myGLTextureViewer.setShaderProg(shaderProg[LOG_GAUSSIAN_X_SHADER]);
		myGLTextureViewer.drawTextureOnShader(textures[SHADOW_MAP_COLOR], windowWidth, windowHeight);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);		
		
		glBindFramebuffer(GL_FRAMEBUFFER, gaussianYFrameBuffer);
		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
		glViewport(0, 0, windowWidth, windowHeight);
		if(shadowParams.VSM || shadowParams.MSM)
			myGLTextureViewer.setShaderProg(shaderProg[GAUSSIAN_Y_SHADER]);
		else
			myGLTextureViewer.setShaderProg(shaderProg[LOG_GAUSSIAN_Y_SHADER]);
		myGLTextureViewer.drawTextureOnShader(textures[GAUSSIAN_X_MAP_COLOR], windowWidth, windowHeight);
		glBindFramebuffer(GL_FRAMEBUFFER, 0);		
		
		//we must build the mip-map version of the final blurred map in order to VSM run correctly
		glBindTexture(GL_TEXTURE_2D, textures[GAUSSIAN_Y_MAP_COLOR]);
		glGenerateMipmap(GL_TEXTURE_2D);

	}
	
	glDisable(GL_CULL_FACE);
	glDisable(GL_POLYGON_OFFSET_FILL);
	
	if(shadowParams.SMSR || shadowParams.RPCF || shadowParams.RSMSF || shadowParams.RPCFSubCoordAccuracy) {
		
		if(shadowParams.SMSR || shadowParams.RSMSF) {
		
			glBindFramebuffer(GL_FRAMEBUFFER, discontinuityFrameBuffer);
			glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
			renderSMSR(true);
			glBindFramebuffer(GL_FRAMEBUFFER, 0);		
		
		}

		glClearColor(0.0f, 0.0f, 0.0f, 1.0);
		renderSMSR(false);
		
	} else {

		glClearColor(0.0f, 0.0f, 0.0f, 1.0);
		displaySceneFromCameraPOV();
		
	}
	
	glutSwapBuffers();
	glutPostRedisplay();

}

void idle()
{
	
	calculateFPS();

	if(animationOn) {
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
	shadowParams.RPCF = false;
	shadowParams.RPCFSubCoordAccuracy = false;
	shadowParams.RSMSF = false;

}

void keyboard(unsigned char key, int x, int y) 
{

	switch(key) {
	case 27:
		exit(0);
		break;
	}

}

void specialKeyboard(int key, int x, int y)
{

	switch(key) {
	
	case GLUT_KEY_UP:
		if(cameraOn) {
			if(translationOn) {
				cameraEye[1] += vel;
				cameraAt[1] += vel;
			}
			if(rotationOn) {
				cameraEye = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(0, 1, 0))) * cameraEye;
				cameraAt = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(0, 1, 0))) * cameraAt;
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
		break;
	case GLUT_KEY_DOWN:
		if(cameraOn) {
			if(translationOn) {
				cameraEye[1] -= vel;
				cameraAt[1] -= vel;
			}
			if(rotationOn) {
				cameraEye = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(0, 1, 0))) * cameraEye;
				cameraAt = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(0, 1, 0))) * cameraAt;
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
		break;
	case GLUT_KEY_LEFT:
		if(cameraOn) {
			if(translationOn) {
				cameraEye[0] -= vel;
				cameraAt[0] -= vel;
			}
			if(rotationOn) {
				cameraEye = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(1, 0, 0))) * cameraEye;
				cameraAt = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(1, 0, 0))) * cameraAt;
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
				cameraEye = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(1, 0, 0))) * cameraEye;
				cameraAt = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(1, 0, 0))) * cameraAt;
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
				cameraEye = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(0, 0, 1))) * cameraEye;
				cameraAt = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(0, 0, 1))) * cameraAt;
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
				cameraEye = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(0, 0, 1))) * cameraEye;
				cameraAt = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(0, 0, 1))) * cameraAt;
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
			shadowParams.RPCF = true;
			//TODO
			//cameraEye[0] = -17.0; cameraEye[1] = 3.1; cameraEye[2] = -6.5;
			//cameraAt[0] = -17.0; cameraAt[1] = -44.0; cameraAt[2] = -4.0;
			break;
		case 1:
			resetShadowParams();
			shadowParams.RPCFSubCoordAccuracy = true;
			break;
		case 2:
			resetShadowParams();
			shadowParams.RSMSF = true;
			//TODO
			//cameraEye[0] = 1.0; cameraEye[1] = -6.0; cameraEye[2] = 8.0;
			//cameraAt[0] = 1.0; cameraAt[1] = -31.0; cameraAt[2] = 48.0;
			//cameraEye[0] = -2.0; cameraEye[1] = -5.0; cameraEye[2] = -36.0;
			//cameraAt[0] = -2.0; cameraAt[1] = -30.0; cameraAt[2] = 4.0;
			
			break;
	}
}

void shadowRevectorizationMenu(int id) {

	switch(id)
	{
		case 0:
			resetShadowParams();
			shadowParams.SMSR = true;
			//TODO
			//discontinuity break
			//cameraEye[0] = -17.0;	cameraEye[1] = 4.0;	cameraEye[2] = -23;
			//cameraAt[0] = -17.0;	cameraAt[1] = -42.0;	cameraAt[2] = -12.0;
			//filtering
			//cameraEye[0] = -17.0; cameraEye[1] = 3.1; cameraEye[2] = -6.5;
			//cameraAt[0] = -17.0; cameraAt[1] = -44.0; cameraAt[2] = -4.0;
			break;
		case 1:
			shadowParams.showEnteringDiscontinuityMap = true;
			shadowParams.showExitingDiscontinuityMap = false;
			shadowParams.showONDS = false;
			shadowParams.showClippedONDS = false;
			shadowParams.showSubCoord = false;
			//cameraEye[0] = -17.0; cameraEye[1] = 3.1; cameraEye[2] = -6.5;
			//cameraAt[0] = -17.0; cameraAt[1] = -44.0; cameraAt[2] = -4.0;
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
			animationOn = !animationOn;
			animation = 0;
			break;
		case 1:
			shadowParams.adaptiveDepthBias = !shadowParams.adaptiveDepthBias;
			break;
		case 2:
			shadowIntensityOn = !shadowIntensityOn;
			break;
		case 3:
			psrOn = !psrOn;
			break;
		case 4:
			printf("LightPosition: %f %f %f\n", sceneLoader->getLightPosition()[0] + lightTranslationVector[0], sceneLoader->getLightPosition()[1] + lightTranslationVector[1], 
				sceneLoader->getLightPosition()[2] + lightTranslationVector[2]);
			printf("LightPosition: %f %f %f\n", lightEye[0], lightEye[1], lightEye[2]);
			printf("CameraPosition: %f %f %f\n", cameraEye[0], cameraEye[1], cameraEye[2]);
			printf("CameraAt: %f %f %f\n", cameraAt[0], cameraAt[1], cameraAt[2]);
			printf("Global Translation: %f %f %f\n", translationVector[0], translationVector[1], translationVector[2]);
			printf("Global Rotation: %f %f %f\n", rotationAngles[0], rotationAngles[1], rotationAngles[2]);
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
		glutAddMenuEntry("Focus on Potential Shadow Receiver [On/Off]", 3);
		glutAddMenuEntry("Print Data", 4);
		
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
	if(discontinuityFrameBuffer == 0)
		glGenFramebuffers(1, &discontinuityFrameBuffer);
	if(sceneVBO[0] == 0)
		glGenBuffers(5, sceneVBO);
	if(sceneTextures[0] == 0)
		glGenTextures(4, sceneTextures);

	scene = new Mesh();
	sceneLoader = new SceneLoader(configurationFile, scene);
	sceneLoader->load();

	lightView = new Image(PSRMapWidth, PSRMapHeight, 3);

	float centroid[3];
	scene->computeCentroid(centroid);
	cameraEye[0] = sceneLoader->getCameraPosition()[0]; cameraEye[1] = sceneLoader->getCameraPosition()[1]; cameraEye[2] = sceneLoader->getCameraPosition()[2];
	cameraAt[0] = 0.0; cameraAt[1] = 0.0; cameraAt[2] = 0.0;
	lightAt[0] = 0.0; lightAt[1] = 0.0; lightAt[2] = 0.0;
	cameraUp[0] = 0.0; cameraUp[1] = 0.0; cameraUp[2] = 1.0;

	
	shadowParams.shadowMapWidth = shadowMapWidth;
	shadowParams.shadowMapHeight = shadowMapHeight;
	shadowParams.maxSearch = 256;
	resetShadowParams();
	shadowParams.naive = true;
	shadowParams.adaptiveDepthBias = true;
	shadowParams.shadowIntensity = 0.25;

	myGLTextureViewer.loadQuad();
	createMenu();

	if(scene->textureFromImage())
		for(int num = 0; num < scene->getNumberOfTextures(); num++)
			myGLTextureViewer.loadRGBTexture(scene->getTexture()[num]->getData(), sceneTextures, num, scene->getTexture()[num]->getWidth(), scene->getTexture()[num]->getHeight());
	
	myGLTextureViewer.loadRGBTexture((float*)NULL, textures, SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBTexture((float*)NULL, textures, GAUSSIAN_X_MAP_COLOR, windowWidth, windowHeight);
	myGLTextureViewer.loadRGBTexture((float*)NULL, textures, GAUSSIAN_Y_MAP_COLOR, windowWidth, windowHeight);
	myGLTextureViewer.loadRGBTexture((float*)NULL, textures, RESULTING_SHADOW_MAP_COLOR, windowWidth, windowHeight, GL_NEAREST);
	myGLTextureViewer.loadRGBTexture((float*)NULL, textures, DISCONTINUITY_MAP_COLOR, windowWidth, windowHeight, GL_NEAREST);

	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, GAUSSIAN_X_MAP_DEPTH, windowWidth, windowHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, GAUSSIAN_Y_MAP_DEPTH, windowWidth, windowHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, RESULTING_SHADOW_MAP_DEPTH, windowWidth, windowHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, DISCONTINUITY_MAP_DEPTH, windowWidth, windowHeight);

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

	glBindFramebuffer(GL_FRAMEBUFFER, discontinuityFrameBuffer);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[DISCONTINUITY_MAP_DEPTH], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[DISCONTINUITY_MAP_COLOR], 0);
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

	initShader("Shaders/Phong", PHONG_SHADER);
	initShader("Shaders/Shadow", SHADOW_MAPPING_SHADER);
	initShader("Shaders/PSR", PSR_SHADER);
	initShader("Shaders/Moments", MOMENTS_SHADER);
	initShader("Shaders/Exponential", EXPONENTIAL_SHADER);
	initShader("Shaders/ExponentialMoments", EXPONENTIAL_MOMENT_SHADER);
	initShader("Shaders/Gaussian/GaussianBlur3X", GAUSSIAN_X_SHADER);
	initShader("Shaders/Gaussian/GaussianBlur3Y", GAUSSIAN_Y_SHADER);
	initShader("Shaders/LogGaussian/LogGaussianBlur3X", LOG_GAUSSIAN_X_SHADER);
	initShader("Shaders/LogGaussian/LogGaussianBlur3Y", LOG_GAUSSIAN_Y_SHADER);
	initShader("Shaders/Discontinuity", DISCONTINUITY_SHADER);
	initShader("Shaders/Revectorization", REVECTORIZATION_SHADER);
	glUseProgram(0);

	glutMainLoop();

	delete scene;
	delete sceneLoader;
	delete lightView;

	return 0;

}