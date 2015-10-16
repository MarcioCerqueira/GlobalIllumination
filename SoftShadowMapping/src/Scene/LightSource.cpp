#include "Scene\LightSource.h"

LightSource::LightSource() {
}

glm::vec3 LightSource::getEye(int sample) {
	
	glm::vec3 sampleEye = eye;
	float halfSize = (float)size/2.0;
	float factor = sqrtf(numberOfPointLights);
	
	sampleEye[0] += (((sample % (int)factor) - ((factor - 1.0)/2.0))/((factor - 1.0)/2.0)) * halfSize;  
	sampleEye[1] += (((sample / factor) - ((factor - 1.0)/2.0))/((factor - 1.0)/2.0)) * halfSize;
	
	return sampleEye;

}

glm::vec3 LightSource::getAt(int sample) {
	
	glm::vec3 sampleAt = at;
	float halfSize = (float)size/2.0;
	float factor = sqrtf(numberOfPointLights);
	
	//0, 1, 2, 3
	//-1.5, -0.5, 0.5, 1.5
	//-1, -0.33, 0.33, 1

	//0, 1, 2, 3, 4
	//-2, -1, 0, 1, 2
	//-1, -0.5, 0. 0.5, 1

	//0, 1, 2
	//-1, 0, 1
	//-1, 0, 1

	sampleAt[0] += (((sample % (int)factor) - ((factor - 1.0)/2.0))/((factor - 1.0)/2.0)) * halfSize;  
	sampleAt[1] += (((sample / factor) - ((factor - 1.0)/2.0))/((factor - 1.0)/2.0)) * halfSize;
	
	return sampleAt;

}