#ifndef LIGHTSOURCE_H
#define LIGHTSOURCE_H

#include "glm/glm.hpp"

class LightSource
{
public:
	
	LightSource();

	glm::vec3 getUp() { return up; }
	glm::vec3 getEye(int sample);
	glm::vec3 getAt(int sample);
	int getNumberOfPointLights() { return numberOfPointLights; }
	int getSize() { return size; }

	void setEye(glm::vec3 eye) { this->eye = eye; }
	void setAt(glm::vec3 at) { this->at = at; }
	void setUp(glm::vec3 up) { this->up = up; }
	void setSize(int size) { this->size = size; }
	void setNumberOfPointLights(int numberOfPointLights) { this->numberOfPointLights = numberOfPointLights; }

private:
	glm::vec3 eye;
	glm::vec3 at;
	glm::vec3 up;
	int size;
	int numberOfPointLights;
};

#endif