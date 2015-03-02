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
	bool tricubicPCF;
	bool poissonPCF;
	bool bilinearPCF;
	bool edgePCF;
	bool VSM;
	bool ESM;
	bool EVSM;
	bool MSM; //Hamburger
	bool naive;
	bool adaptiveDepthBias;
	GLuint shadowMap;
	GLuint edgeMap;
} ShadowParams;

#endif