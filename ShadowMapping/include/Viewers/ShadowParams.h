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
	int maxSearch;
	bool tricubicPCF;
	bool bilinearPCF;
	bool VSM;
	bool ESM;
	bool EVSM;
	bool MSM; //Hamburger
	bool naive;
	bool adaptiveDepthBias;
	bool SMSR;
	bool showDiscontinuityMap; //SMSR
	bool showONDS; //SMSR
	bool showClippedONDS; //SMSR
	bool showSubCoord; //SMSR
	bool RPCF; //SMSR
	GLuint shadowMap;
} ShadowParams;

#endif