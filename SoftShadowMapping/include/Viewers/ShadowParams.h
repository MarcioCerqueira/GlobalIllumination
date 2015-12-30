#ifndef SHADOW_PARAMS_H
#define SHADOW_PARAMS_H

#include "glm/glm.hpp"

typedef struct ShadowParams
{
	glm::mat4 lightMVP;
	glm::mat4 lightMV;
	glm::mat4 lightP;
	int shadowMapWidth;
	int shadowMapHeight;
	int windowWidth;
	int windowHeight;
	int blockerSearchSize;
	int kernelSize;
	int lightSourceRadius;
	float shadowIntensity;
	float accFactor;
	bool monteCarlo;
	bool PCSS;
	bool SAVSM;
	bool VSSM;
	bool ESSM;
	bool MSSM;
	bool SSPCSS;
	bool SAT; 
	bool useHardShadowMap;
	bool useSoftShadowMap;
	bool usePartialAverageBlockerDepthMap;
	GLuint shadowMap;
	GLuint SATShadowMap;
	GLuint hierarchicalShadowMap;
	GLuint hardShadowMap;
	GLuint softShadowMap;
	GLuint partialAverageBlockerDepthMap;
	GLuint vertexMap;
	GLuint normalMap;
} ShadowParams;

#endif