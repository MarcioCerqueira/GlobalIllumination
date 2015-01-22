//References:
//Shadow Mapping - L. Willians. Casting Curved Shadows on Curved Surfaces. 1978
//Percentage-closer filtering - W. Reeves, D. Salesin and R. Cook. Rendering Antialiased Shadows with Depth Maps. 1987
//(when used)Rendering of back faces - Y. Wang and S. Molnar. Second-Depth Shadow Mapping. 1994
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

//Window size
int windowWidth = 640;
int windowHeight = 480;

int shadowMapWidth = 640 * 2;
int shadowMapHeight = 480 * 2;

//  The number of frames
int frameCount = 0;
float fps = 0;
int currentTime = 0, previousTime = 0;

MyGLTextureViewer myGLTextureViewer;
MyGLGeometryViewer myGLGeometryViewer;
Mesh *cube;
Mesh *plane;

GLuint textures[4];
GLuint vbos[4];
GLuint shadowFrameBuffer;
GLuint sceneFrameBuffer;

glm::vec3 cameraEye;
glm::vec3 cameraAt;
glm::vec3 cameraUp;

GLuint ProgramObject = 0;
GLuint VertexShaderObject = 0;
GLuint FragmentShaderObject = 0;
GLuint shaderVS, shaderFS, shaderProg[5];   // handles to objects
GLint  linked;

float translationVector[3] = {0.0, 0.0, 0.0};
float rotationAngles[3] = {0.0, 0.0, 0.0};

bool translationOn = false;
bool rotationOn = false;

int vel = 1;
int animation = -1800;
	
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

void displaySceneFromLightPOV()
{

	glViewport(0, 0, shadowMapWidth, shadowMapHeight);
	//glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	
	glm::vec4 lightEye;
	lightEye[0] = 10.0;
	lightEye[1] = 40.0;
	lightEye[2] = 40.0;
	lightEye[3] = 1.0;

	lightEye = glm::rotate((float)animation/10, glm::vec3(0, 1, 0)) * lightEye;
	
	glUseProgram(shaderProg[0]);
	//glEnable(GL_CULL_FACE);
	//glCullFace(GL_FRONT);
	glPolygonOffset(2.5f, 10.0f);
	glEnable(GL_POLYGON_OFFSET_FILL);
	myGLGeometryViewer.setShaderProg(shaderProg[0]);
	
	myGLGeometryViewer.setEye(glm::vec3(lightEye));
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

	myGLGeometryViewer.setProjectionMatrix(projection);
	myGLGeometryViewer.setViewMatrix(view);
	myGLGeometryViewer.setModelMatrix(model);
	myGLGeometryViewer.configurePhong(glm::vec3(lightEye), cameraEye);

	glColor3f(1.0, 0.0, 0.0);
	myGLGeometryViewer.loadVBOs(vbos, cube->getPointCloud(), cube->getNormalVector(), cube->getIndices(), cube->getPointCloudSize(), cube->getIndicesSize());
	myGLGeometryViewer.drawMesh(vbos, cube->getIndicesSize());
	
	glDisable(GL_CULL_FACE);
	
	model *= glm::translate(glm::vec3(0, -8, 0));
	
	myGLGeometryViewer.setProjectionMatrix(projection);
	myGLGeometryViewer.setViewMatrix(view);
	myGLGeometryViewer.setModelMatrix(model);
	myGLGeometryViewer.configurePhong(glm::vec3(lightEye), cameraEye);

	glColor3f(0.0, 0.0, 1.0);
	myGLGeometryViewer.loadVBOs(vbos, plane->getPointCloud(), plane->getNormalVector(), plane->getIndices(), plane->getPointCloudSize(), plane->getIndicesSize());
	myGLGeometryViewer.drawMesh(vbos, plane->getIndicesSize());
	
	glUseProgram(0);
	glDisable(GL_CULL_FACE);
	glDisable(GL_POLYGON_OFFSET_FILL);
	

}

void displaySceneFromCameraPOV()
{

	glViewport(0, 0, windowWidth, windowHeight);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	
	glm::vec4 lightEye;
	lightEye[0] = 10.0;
	lightEye[1] = 40.0;
	lightEye[2] = 40.0;
	lightEye[3] = 1.0;

	lightEye = glm::rotate((float)animation/10, glm::vec3(0, 1, 0)) * lightEye;
	
	glUseProgram(shaderProg[1]);
	
	myGLGeometryViewer.setShaderProg(shaderProg[1]);
	
	GLuint texLoc = glGetUniformLocation(shaderProg[1], "shadowMap");
	glUniform1i(texLoc, 0);
	
	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, textures[1]);
	
	glActiveTexture(GL_TEXTURE0);
	glDisable(GL_TEXTURE_2D);

	myGLGeometryViewer.setEye(glm::vec3(lightEye));
	myGLGeometryViewer.setLook(cameraAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(windowWidth, windowHeight);
	
	glm::mat4 projection = myGLGeometryViewer.getProjectionMatrix();
	glm::mat4 view = myGLGeometryViewer.getViewMatrix();
	glm::mat4 model = myGLGeometryViewer.getModelMatrix();
	
	model *= glm::translate(glm::vec3(translationVector[0], translationVector[1], translationVector[2]));
	model *= glm::rotate(rotationAngles[0], glm::vec3(1, 0, 0));
	model *= glm::rotate(rotationAngles[1], glm::vec3(0, 1, 0));
	model *= glm::rotate(rotationAngles[2], glm::vec3(0, 0, 1));

	glm::mat4 lightMVP = projection * view * model;

	myGLGeometryViewer.setEye(cameraEye);
	myGLGeometryViewer.setLook(cameraAt);
	myGLGeometryViewer.setUp(cameraUp);
	myGLGeometryViewer.configureAmbient(windowWidth, windowHeight);
	
	projection = myGLGeometryViewer.getProjectionMatrix();
	view = myGLGeometryViewer.getViewMatrix();
	model = myGLGeometryViewer.getModelMatrix();
	
	model *= glm::translate(glm::vec3(translationVector[0], translationVector[1], translationVector[2]));
	model *= glm::rotate(rotationAngles[0], glm::vec3(1, 0, 0));
	model *= glm::rotate(rotationAngles[1], glm::vec3(0, 1, 0));
	model *= glm::rotate(rotationAngles[2], glm::vec3(0, 0, 1));

	myGLGeometryViewer.setProjectionMatrix(projection);
	myGLGeometryViewer.setViewMatrix(view);
	myGLGeometryViewer.setModelMatrix(model);
	myGLGeometryViewer.configurePhong(glm::vec3(lightEye), cameraEye);
	myGLGeometryViewer.configureShadow(lightMVP);

	glColor3f(1.0, 0.0, 0.0);
	myGLGeometryViewer.loadVBOs(vbos, cube->getPointCloud(), cube->getNormalVector(), cube->getIndices(), cube->getPointCloudSize(), cube->getIndicesSize());
	myGLGeometryViewer.drawMesh(vbos, cube->getIndicesSize());
	
	model *= glm::translate(glm::vec3(0, -8, 0));
	
	myGLGeometryViewer.setProjectionMatrix(projection);
	myGLGeometryViewer.setViewMatrix(view);
	myGLGeometryViewer.setModelMatrix(model);
	myGLGeometryViewer.configurePhong(glm::vec3(lightEye), cameraEye);
	myGLGeometryViewer.configureShadow(lightMVP);

	glColor3f(0.0, 0.0, 1.0);
	myGLGeometryViewer.loadVBOs(vbos, plane->getPointCloud(), plane->getNormalVector(), plane->getIndices(), plane->getPointCloudSize(), plane->getIndicesSize());
	myGLGeometryViewer.drawMesh(vbos, plane->getIndicesSize());
	
	glUseProgram(0);

}

void display()
{

	glBindFramebuffer(GL_FRAMEBUFFER, shadowFrameBuffer);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
	displaySceneFromLightPOV();
	glBindFramebuffer(GL_FRAMEBUFFER, 0);	
	
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
	if(vbos[0] == 0)
		glGenBuffers(4, vbos);
	
	cube = new Mesh();
	cube->buildCube(5.0, 5.0, 5.0);

	plane = new Mesh();
	plane->buildCube(20.0, 1.0, 20.0);

	cameraEye[0] = 0.0; cameraEye[1] = 25.0; cameraEye[2] = -40.0;
	cameraAt[0] = 0.0; cameraAt[1] = 0.0; cameraAt[2] = 0.0;
	cameraUp[0] = 0.0; cameraUp[1] = 1.0; cameraUp[2] = -1.0;

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
	glUseProgram(0);

	glutMainLoop();

	delete cube;
	delete plane;
	return 0;

}