#ifndef LIGHTSOURCE_H
#define LIGHTSOURCE_H

#include "glm/glm.hpp"

class LightSource
{
public:
	
	LightSource();

	glm::vec3 getUp() { return up; }
	glm::vec3 getEye() { return eye; }
	glm::vec3 getAt() { return at; }
	int getSize() { return size; }
	
	void setEye(glm::vec3 eye) { this->eye = eye; }
	void setAt(glm::vec3 at) { this->at = at; }
	void setUp(glm::vec3 up) { this->up = up; }
	void setSize(int size) { this->size = size; }

private:
	glm::vec3 eye;
	glm::vec3 at;
	glm::vec3 up;
	int size;
};

#endif