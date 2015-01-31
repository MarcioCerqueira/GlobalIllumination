#ifndef MYGLGEOMETRYVIEWER_H
#define MYGLGEOMETRYVIEWER_H

#include <stdlib.h>
#include <GL/glew.h>
#include <GL/glut.h>
#include "glm/glm.hpp"
#include "glm/gtc/matrix_transform.hpp"
#include "glm/gtx/transform2.hpp"
#include "glm/gtc/type_ptr.hpp"
#include "glm/gtc/matrix_inverse.hpp"

class MyGLGeometryViewer
{

public:
	MyGLGeometryViewer();
	void configureAmbient(GLfloat *eye, GLfloat *at, GLfloat *up);
	void configureAmbient(int windowWidth, int windowHeight);
	void configureLight();	
	void configurePhong(glm::vec3 lightPosition, glm::vec3 cameraPosition);
	void configureShadow(glm::mat4 lightMVP, int shadowMapWidth, int shadowMapHeight);
	void configurePSRMatrix(int xmin, int xmax, int ymin, int ymax, int width, int height);
	void drawPlane(float x, float y, float z);
	void drawMesh(GLuint *VBOs, int numberOfIndices);
	glm::mat4 getProjectionMatrix() { return projection; }
	glm::mat4 getViewMatrix() { return view; }
	glm::mat4 getModelMatrix() { return model; }
	glm::mat4 getPSRMatrix() { return psr; }
	void loadVBOs(GLuint *VBOs, float *pointCloud, float *normalVectors, int *indices, int numberOfPoints, int numberOfIndices);
	void setEye(glm::vec3 eye) { this->eye = eye; }
	void setLook(glm::vec3 look) { this->look = look; }
	void setShaderProg(GLuint shaderProg) { this->shaderProg = shaderProg; }
	void setUp(glm::vec3 up) { this->up = up; }
	void setProjectionMatrix(glm::mat4 projection) { this->projection = projection; }
	void setViewMatrix(glm::mat4 view) { this->view = view; }
	void setModelMatrix(glm::mat4 model) { this->model = model; }
	
	glm::mat4 projection;
	glm::mat4 view;
	glm::mat4 model;
	glm::mat4 psr;
	glm::vec3 eye;
	glm::vec3 look;
	glm::vec3 up;
	float fov;
	float zNear;
	float zFar;
	GLuint shaderProg;
	
};

#endif