#ifndef MYGLGEOMETRYVIEWER_H
#define MYGLGEOMETRYVIEWER_H

#include <stdlib.h>
#include <GL/glew.h>
#include <GL/glut.h>
#include "Viewers/ShadowParams.h"
#include "Mesh.h"
#include "glm/glm.hpp"
#include "glm/gtc/matrix_transform.hpp"
#include "glm/gtx/transform2.hpp"
#include "glm/gtc/type_ptr.hpp"
#include "glm/gtc/matrix_inverse.hpp"

class MyGLGeometryViewer
{

public:
	MyGLGeometryViewer();
	void configureAmbient(int windowWidth, int windowHeight);
	void configureGBuffer(ShadowParams shadowParams);
	void configureLight();	
	void configureLinearization();
	void configurePhong(glm::vec3 lightPosition, glm::vec3 cameraPosition);
	void configureShadow(ShadowParams shadowParams);
	void configureMoments(ShadowParams shadowParams);
	void configureRevectorization(ShadowParams shadowParams, int imageWidth, int imageHeight);
	void drawPlane(float x, float y, float z);
	void drawMesh(GLuint *VBOs, int numberOfIndices, int numberOfTexCoords, int numberOfColors, bool textureFromImage, GLuint *textures, int numberOfTextures);
	glm::mat4 getProjectionMatrix() { return projection; }
	glm::mat4 getViewMatrix() { return view; }
	glm::mat4 getModelMatrix() { return model; }
	glm::mat4 getPSRMatrix() { return psr; }
	float* getMVMatrix();
	void loadVBOs(GLuint *VBOs, Mesh *scene);
	void setEye(glm::vec3 eye) { this->eye = eye; }
	void setLook(glm::vec3 look) { this->look = look; }
	void setShaderProg(GLuint shaderProg) { this->shaderProg = shaderProg; }
	void setUp(glm::vec3 up) { this->up = up; }
	void setProjectionMatrix(glm::mat4 projection) { this->projection = projection; }
	void setViewMatrix(glm::mat4 view) { this->view = view; }
	void setModelMatrix(glm::mat4 model) { this->model = model; }
	void setIsCameraViewpoint(bool isCameraViewpoint) { this->isCameraViewpoint = isCameraViewpoint; }
	
	glm::mat4 projection;
	glm::mat4 view;
	glm::mat4 model;
	glm::mat4 psr;
	glm::mat3 normalMatrix;
	glm::vec3 eye;
	glm::vec3 look;
	glm::vec3 up;
	float fov;
	float zNear;
	float zFar;
	GLuint shaderProg;
	bool hasNormalMatrixBeenSet;
	bool isCameraViewpoint;
};

#endif