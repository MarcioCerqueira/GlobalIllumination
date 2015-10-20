#include "Scene\LightSource.h"

LightSource::LightSource() {
}

glm::vec3 LightSource::getEye(int sample) {
	
	if(sample == -1) return eye;

	glm::vec3 sampleEye = eye;
	float halfSize = (float)size/2.0;
	float factor = sqrtf(numberOfPointLights);
	
	sampleEye[0] += (((sample % (int)factor) - ((factor - 1.0)/2.0))/((factor - 1.0)/2.0)) * halfSize;  
	sampleEye[1] += (((sample / factor) - ((factor - 1.0)/2.0))/((factor - 1.0)/2.0)) * halfSize;
	
	return sampleEye;

}

glm::vec3 LightSource::getAt(int sample) {
	
	if(sample == -1) return at;

	glm::vec3 sampleAt = at;
	float halfSize = (float)size/2.0;
	float factor = sqrtf(numberOfPointLights);
	
	sampleAt[0] += (((sample % (int)factor) - ((factor - 1.0)/2.0))/((factor - 1.0)/2.0)) * halfSize;  
	sampleAt[1] += (((sample / factor) - ((factor - 1.0)/2.0))/((factor - 1.0)/2.0)) * halfSize;
	
	return sampleAt;

}