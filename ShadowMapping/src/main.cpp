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
	GAUSSIAN_Y_MAP_COLOR = 5
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
	EXPONENTIAL_MOMENT_SHADER = 9
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
GLuint sceneFrameBuffer;
GLuint gaussianXFrameBuffer;
GLuint gaussianYFrameBuffer;

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

int vel = 1;
int animation = -1800;
	
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
	glPolygonOffset(2.5f, 10.0f);
	glEnable(GL_POLYGON_OFFSET_FILL);
	
	myGLGeometryViewer.setEye(lightEye);
	myGLGeometryViewer.setLook(lightAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(shadowMapWidth, shadowMapHeight);
	
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
	
	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	displaySceneFromCameraPOV();
	
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
	shadowParams.poissonPCF = false;
	shadowParams.edgePCF = false;
	shadowParams.VSM = false;
	shadowParams.ESM = false;
	shadowParams.EVSM = false;
	shadowParams.MSM = false;
	shadowParams.naive = false;
		
}

void keyboard(unsigned char key, int x, int y) 
{

	
	switch(key) {
	case 27:
		exit(0);
		break;
	case 't':
		translationOn = true;
		rotationOn = false;
		break;
	case 'r':
		rotationOn = true;
		translationOn = false;
		break;
	case 'q':
		lightTranslationOn = !lightTranslationOn;
		translationOn = false;
		break;
	case 'p':
		psrOn = !psrOn;
		break;
	case 'a':
		animationOn = !animationOn;
		animation = 0;
		break;
	case 'b':
		resetShadowParams();
		shadowParams.bilinearPCF = true;
		break;
	case 'h':
		resetShadowParams();
		shadowParams.tricubicPCF = true;
		break;
	case 'o':
		resetShadowParams();
		shadowParams.poissonPCF = true;
		break;
	case 'e':
		resetShadowParams();
		shadowParams.ESM = true;
		break;
	case 'v':
		resetShadowParams();
		shadowParams.VSM = true;
		break;
	case 'l':
		resetShadowParams();
		shadowParams.EVSM = true;
		break;
	case 'm':
		resetShadowParams();
		shadowParams.MSM = true;
		break;
	case 'n':
		resetShadowParams();
		shadowParams.naive = true;
		break;
	case 'd':
		shadowParams.adaptiveDepthBias = !shadowParams.adaptiveDepthBias;
		break;
	case 'w':
		printf("LightPosition: %f %f %f\n", sceneLoader->getLightPosition()[0] + lightTranslationVector[0], sceneLoader->getLightPosition()[1] + lightTranslationVector[1], 
			sceneLoader->getLightPosition()[2] + lightTranslationVector[2]);
		printf("LightPosition: %f %f %f\n", lightEye[0], lightEye[1], lightEye[2]);
		printf("CameraPosition: %f %f %f\n", cameraEye[0], cameraEye[1], cameraEye[2]);
		printf("Global Translation: %f %f %f\n", translationVector[0], translationVector[1], translationVector[2]);
		printf("Global Rotation: %f %f %f\n", rotationAngles[0], rotationAngles[1], rotationAngles[2]);
		break;
	case 'c':
		cameraOn = !cameraOn;
		break;
	}

}

void specialKeyboard(int key, int x, int y)
{

	switch(key) {
	
	case GLUT_KEY_UP:
		if(cameraOn) {
			if(translationOn)
				cameraEye[1] += vel;
			if(rotationOn)
				cameraEye = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(0, 1, 0))) * cameraEye;
		} else {
			if(translationOn)
				translationVector[1] += vel;
			if(rotationOn)
				rotationAngles[1] += 5 * vel;
		}
		if(lightTranslationOn)
			lightTranslationVector[1] += 5 * vel;
		
		break;
	case GLUT_KEY_DOWN:
		if(cameraOn) {
			if(translationOn)
				cameraEye[1] -= vel;
			if(rotationOn)
				cameraEye = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(0, 1, 0))) * cameraEye;
		} else {
			if(translationOn)
				translationVector[1] -= vel;
			if(rotationOn)
				rotationAngles[1] -= 5 * vel;
		}
		if(lightTranslationOn)
			lightTranslationVector[1] -= 5 * vel;
		break;
	case GLUT_KEY_LEFT:
		if(cameraOn) {
			if(translationOn)
				cameraEye[0] -= vel;
			if(rotationOn)
				cameraEye = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(1, 0, 0))) * cameraEye;
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
			if(translationOn)
				cameraEye[0] += vel;
			if(rotationOn)
				cameraEye = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(1, 0, 0))) * cameraEye;
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
			if(translationOn)
				cameraEye[2] += vel;
			if(rotationOn)
				cameraEye = glm::mat3(glm::rotate((float)5 * vel, glm::vec3(0, 0, 1))) * cameraEye;
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
			if(translationOn)
				cameraEye[2] -= vel;
			if(rotationOn)
				cameraEye = glm::mat3(glm::rotate((float)-5 * vel, glm::vec3(0, 0, 1))) * cameraEye;
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
	//cameraAt[0] = centroid[0]; cameraAt[1] = centroid[1]; cameraAt[2] = centroid[2];
	cameraAt[0] = 0.0; cameraAt[1] = 0.0; cameraAt[2] = 0.0;
	lightAt[0] = 0.0; lightAt[1] = 0.0; lightAt[2] = 0.0;
	cameraUp[0] = 0.0; cameraUp[1] = 0.0; cameraUp[2] = 1.0;

	shadowParams.shadowMapWidth = shadowMapWidth;
	shadowParams.shadowMapHeight = shadowMapHeight;
	resetShadowParams();
	shadowParams.naive = true;
	shadowParams.adaptiveDepthBias = true;

	myGLTextureViewer.loadQuad();

	if(scene->textureFromImage())
		for(int num = 0; num < scene->getNumberOfTextures(); num++)
			myGLTextureViewer.loadRGBTexture(scene->getTexture()[num]->getData(), sceneTextures, num, scene->getTexture()[num]->getWidth(), scene->getTexture()[num]->getHeight());
	
	myGLTextureViewer.loadRGBTexture((float*)NULL, textures, SHADOW_MAP_COLOR, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBTexture((float*)NULL, textures, GAUSSIAN_X_MAP_COLOR, windowWidth, windowHeight);
	myGLTextureViewer.loadRGBTexture((float*)NULL, textures, GAUSSIAN_Y_MAP_COLOR, windowWidth, windowHeight);
	
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, SHADOW_MAP_DEPTH, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, GAUSSIAN_X_MAP_DEPTH, windowWidth, windowHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, GAUSSIAN_Y_MAP_DEPTH, windowWidth, windowHeight);
	
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
	initShader("Shaders/Gaussian/GaussianBlur5X", GAUSSIAN_X_SHADER);
	initShader("Shaders/Gaussian/GaussianBlur5Y", GAUSSIAN_Y_SHADER);
	initShader("Shaders/LogGaussian/LogGaussianBlur5X", LOG_GAUSSIAN_X_SHADER);
	initShader("Shaders/LogGaussian/LogGaussianBlur5Y", LOG_GAUSSIAN_Y_SHADER);
	glUseProgram(0);

	glutMainLoop();

	delete scene;
	delete sceneLoader;
	delete lightView;

	return 0;

}