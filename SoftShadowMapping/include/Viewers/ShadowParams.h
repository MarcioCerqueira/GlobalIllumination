#ifndef SHADOW_PARAMS_H
#define SHADOW_PARAMS_H

#include "glm/glm.hpp"

typedef struct ShadowParams
{
	glm::mat4 lightMVP;
	glm::mat4 lightMVPs[1024];
	glm::mat4 quadTreeLightMVPs[4];
	glm::vec4 lightTrans[1024];
	int localQuadTreeHash[4];
	int shadowMapWidth;
	int shadowMapHeight;
	int windowWidth;
	int windowHeight;
	int blockerSearchSize;
	int kernelSize;
	int lightSourceRadius;
	int maxSearch; //RBSSM
	int numberOfSamples; //monteCarlo
	int currentShadowMapSample;
	int quadTreeLevel;
	float shadowIntensity;
	float blockerThreshold; //SSSM
	float filterThreshold; //SSSM
	float depthThreshold; //RBSSM
	float HSMAlpha;
	float HSMBeta;
	float accFactor[1024]; //adaptiveSampling
	bool renderFromCamera;
	bool renderFromGBuffer;
	bool monteCarlo;
	bool adaptiveSampling;
	bool adaptiveSamplingLowerAccuracy;
	bool revectorizationBasedAdaptiveSampling;
	bool quadTreeEvaluation;
	bool revectorizationBasedQuadTreeEvaluation;
	bool RPCF;
	bool PCSS;
	bool SAVSM;
	bool VSSM;
	bool ESSM;
	bool MSSM;
	bool RBSSM;
	bool EDTSSM;
	bool SSPCSS;
	bool SSABSS;
	bool SSSM;
	bool SSRBSSM;
	bool SSEDTSSM;
	bool SAT; 
	bool useHardShadowMap;
	bool useSoftShadowMap;
	bool usePartialAverageBlockerDepthMap;
	bool useHierarchicalShadowMap;
	GLuint shadowMap;
	GLuint shadowMapArray;
	GLuint discontinuityMapArray;
	GLuint SATShadowMap;
	GLuint hierarchicalShadowMap;
	GLuint hardShadowMap;
	GLuint softShadowMap;
	GLuint partialAverageBlockerDepthMap;
	GLuint vertexMap;
	GLuint normalMap;
	GLuint colorMap;
	GLuint visibilityMap;
} ShadowParams;

#endif