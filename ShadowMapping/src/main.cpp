//References:
//Shadow Mapping - L. Willians. Casting Curved Shadows on Curved Surfaces. 1978
//Percentage-closer filtering - W. Reeves, D. Salesin and R. Cook. Rendering Antialiased Shadows with Depth Maps. 1987
//Rendering of back faces - Y. Wang and S. Molnar. Second-Depth Shadow Mapping. 1994
//Post-perspective shadow mapping - M. Stamminger and G. Drettakis. Perspective Shadow Maps. 2002
//Possible shadow receivers - Adaptation from S. Brabec et al. Practical Shadow Mapping. 2002
//http://codeflow.org/entries/2013/feb/15/soft-shadow-mapping/
//Reference book - E. Eisemann et al. Real-Time Shadows. 2011

#include <stdlib.h>
#include <GL/glew.h>
#include <GL/glut.h>
#include <stdio.h>
#include "Viewers\MyGLTextureViewer.h"
#include "Viewers\MyGLGeometryViewer.h"
#include "Viewers\shader.h"
#include "Mesh.h"
#include "Image.h"

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

Mesh *cube;
Mesh *plane;
Mesh *suzanne;
Mesh *scene;

Image *lightView;

GLuint textures[4];
GLuint sceneVBO[4];
GLuint shadowFrameBuffer;
GLuint sceneFrameBuffer;

glm::vec3 cameraEye;
glm::vec3 cameraAt;
glm::vec3 cameraUp;
glm::vec3 lightEye;
glm::mat4 lightMVP;	
glm::mat4 lightMV;

GLuint ProgramObject = 0;
GLuint VertexShaderObject = 0;
GLuint FragmentShaderObject = 0;
GLuint shaderVS, shaderFS, shaderProg[5];   // handles to objects
GLint  linked;

float translationVector[3] = {0.0, 0.0, 0.0};
float rotationAngles[3] = {0.0, 0.0, 0.0};

bool translationOn = false;
bool rotationOn = false;
bool psrOn = false;

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
		printf("%f\n", fps);
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
	
	glColor3f(0.0, 1.0, 0.0);
	myGLGeometryViewer.loadVBOs(sceneVBO, scene->getPointCloud(), scene->getNormalVector(), scene->getIndices(), scene->getPointCloudSize(), scene->getIndicesSize());
	myGLGeometryViewer.drawMesh(sceneVBO, scene->getIndicesSize());

}

void updateLight()
{

	lightEye[0] = 10.0 + translationVector[0];
	lightEye[1] = 100.0 + translationVector[1];
	lightEye[2] = 100.0 + translationVector[2];
	
	lightEye = glm::mat3(glm::rotate((float)animation/10, glm::vec3(0, 1, 0))) * lightEye;
	
}

void displaySceneFromLightPOV()
{

	glViewport(0, 0, shadowMapWidth, shadowMapHeight);
	
	updateLight();
	
	glUseProgram(shaderProg[0]);

	glEnable(GL_CULL_FACE);
	glCullFace(GL_FRONT);
	glPolygonOffset(2.5f, 10.0f);
	glEnable(GL_POLYGON_OFFSET_FILL);
	
	myGLGeometryViewer.setShaderProg(shaderProg[0]);
	myGLGeometryViewer.setEye(lightEye);
	myGLGeometryViewer.setLook(cameraAt);
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
	
	displayScene();
	glUseProgram(0);

}

void displaySceneFromCameraPOV()
{

	glViewport(0, 0, windowWidth, windowHeight);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	
	updateLight();
	lightEye = glm::mat3(glm::rotate((float)180.0, glm::vec3(0, 1, 0))) * lightEye;

	glUseProgram(shaderProg[1]);
	
	myGLGeometryViewer.setShaderProg(shaderProg[1]);
	
	GLuint texLoc = glGetUniformLocation(shaderProg[1], "shadowMap");
	glUniform1i(texLoc, 0);
	
	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, textures[1]);
	
	glActiveTexture(GL_TEXTURE0);
	glDisable(GL_TEXTURE_2D);
	
	myGLGeometryViewer.setEye(cameraEye);
	myGLGeometryViewer.setLook(cameraAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(windowWidth, windowHeight);
	myGLGeometryViewer.configureShadow(lightMVP, shadowMapWidth, shadowMapHeight);
	
	displayScene();
	glUseProgram(0);

}

void computePSR()
{

	glViewport(0, 0, PSRMapWidth, PSRMapHeight);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	
	updateLight();
	
	glUseProgram(shaderProg[2]);

	glEnable(GL_CULL_FACE);
	glCullFace(GL_FRONT);
	glPolygonOffset(2.5f, 10.0f);
	glEnable(GL_POLYGON_OFFSET_FILL);
	
	myGLGeometryViewer.setShaderProg(shaderProg[2]);
	myGLGeometryViewer.setEye(lightEye);
	myGLGeometryViewer.setLook(cameraAt);
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
	myGLGeometryViewer.configurePSRMatrix(lightView->getXMin(), lightView->getXMax(), lightView->getYMin(), lightView->getYMax(), PSRMapWidth, PSRMapHeight);
		
}

void display()
{
	
	if(psrOn)
		computePSR();
	
	glBindFramebuffer(GL_FRAMEBUFFER, shadowFrameBuffer);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromLightPOV();
	glBindFramebuffer(GL_FRAMEBUFFER, 0);	
	
	glDisable(GL_CULL_FACE);
	glDisable(GL_POLYGON_OFFSET_FILL);
	displaySceneFromCameraPOV();
	
	glutSwapBuffers();
	glutPostRedisplay();

}

void idle()
{
	calculateFPS();
	animation += 6;
	if(animation == 1800)
		animation = -1800;
}

void keyboard(unsigned char key, int x, int y) 
{

	translationOn = false;
	rotationOn = false;
	
	switch(key) {
	case 27:
		exit(0);
		break;
	case 't':
		translationOn = true;
		break;
	case 'r':
		rotationOn = true;
		break;
	case 'p':
		psrOn = !psrOn;
		break;
	}


}

void specialKeyboard(int key, int x, int y)
{

	switch(key) {
	
	case GLUT_KEY_UP:
		if(translationOn)
			translationVector[1] += vel;
		if(rotationOn)
			rotationAngles[1] += 5 * vel;
		break;
	case GLUT_KEY_DOWN:
		if(translationOn)
			translationVector[1] -= vel;
		if(rotationOn)
			rotationAngles[1] -= 5 * vel;
		break;
	case GLUT_KEY_LEFT:
		if(translationOn)
			translationVector[0] -= vel;
		if(rotationOn)
			rotationAngles[0] -= 5 * vel;
		break;
	case GLUT_KEY_RIGHT:
		if(translationOn)
			translationVector[0] += vel;
		if(rotationOn)
			rotationAngles[0] += 5 * vel;
		break;
	case GLUT_KEY_PAGE_UP:
		if(translationOn)
			translationVector[2] += vel;
		if(rotationOn)
			rotationAngles[2] += 5 * vel;
		break;
	case GLUT_KEY_PAGE_DOWN:
		if(translationOn)
			translationVector[2] -= vel;
		if(rotationOn)
			rotationAngles[2] -= 5 * vel;
		break;

	}

}

void initGL() {

	glClearColor(0.0f, 0.0f, 0.0f, 1.0);
	glShadeModel(GL_SMOOTH);
	glPixelStorei( GL_UNPACK_ALIGNMENT, 1);  

	if(textures[0] == 0)
		glGenTextures(4, textures);
	if(shadowFrameBuffer == 0)
		glGenFramebuffers(1, &shadowFrameBuffer);
	if(sceneFrameBuffer == 0)
		glGenFramebuffers(1, &sceneFrameBuffer);
	if(sceneVBO[0] == 0)
		glGenBuffers(4, sceneVBO);

	cube = new Mesh();
	cube->buildCube(5.0, 5.0, 5.0);

	scene = new Mesh();
	scene->addObject(cube);
	
	plane = new Mesh();
	plane->buildCube(40.0, 1.0, 40.0);
	plane->translate(-8.0, false, true, false);
	scene->addObject(plane);
	
	suzanne = new Mesh();
	suzanne->loadOBJFile("OBJ/suzanne.obj");
	suzanne->computeNormals();
	suzanne->scale(5.0);
	suzanne->translate(-15.0, true, false, false);	
	scene->addObject(suzanne);
	
	cube->translate(15.0, true, false, false);
	scene->addObject(cube);
	
	lightView = new Image(PSRMapWidth, PSRMapHeight, 3);

	cameraEye[0] = 0.0; cameraEye[1] = 25.0; cameraEye[2] = -40.0;
	cameraAt[0] = 0.0; cameraAt[1] = 0.0; cameraAt[2] = 0.0;
	cameraUp[0] = 0.0; cameraUp[1] = 0.0; cameraUp[2] = 1.0;

	myGLTextureViewer.loadRGBTexture((unsigned char*)NULL, textures, 0, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadRGBTexture((unsigned char*)NULL, textures, 2, windowWidth, windowHeight);
	
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, 1, shadowMapWidth, shadowMapHeight);
	myGLTextureViewer.loadDepthComponentTexture(NULL, textures, 3, windowWidth, windowHeight);
	
	glBindFramebuffer(GL_FRAMEBUFFER, shadowFrameBuffer);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[1], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[0], 0);
	glBindFramebuffer(GL_FRAMEBUFFER, 0);
	if(glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE)
		printf("FBO OK\n");

	glBindFramebuffer(GL_FRAMEBUFFER, sceneFrameBuffer);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, textures[3], 0);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textures[2], 0);
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
	initGL();

	initShader("Shaders/Phong", 0);
	initShader("Shaders/Shadow", 1);
	initShader("Shaders/PSR", 2);
	glUseProgram(0);

	glutMainLoop();

	delete cube;
	delete plane;
	delete suzanne;
	delete scene;
	
	delete lightView;
	
	return 0;

}