#ifndef RBSM
#define RBSM

float4 computeDiscontinuity(float4 shadowCoord)
{
	float2 shadowMapStep = float2(_ShadowMapTexture_TexelSize.x, _ShadowMapTexture_TexelSize.y) * shadowCoord.w;

	float4 dir = float4(0.0, 0.0, 0.0, 0.0);
	//x = left; y = right; z = bottom; w = top

	shadowCoord.x += shadowMapStep.x;
	dir.x = UNITY_SAMPLE_SHADOW(_ShadowMapTexture, shadowCoord);
	dir.x = (dir.x > 0.0) ? 1.0 : 0.0;

	shadowCoord.x -= 2.0 * shadowMapStep.x;
	dir.y = UNITY_SAMPLE_SHADOW(_ShadowMapTexture, shadowCoord);
	dir.y = (dir.y > 0.0) ? 1.0 : 0.0;

	shadowCoord.x += shadowMapStep.x;
	shadowCoord.y -= shadowMapStep.y;
	dir.z = UNITY_SAMPLE_SHADOW(_ShadowMapTexture, shadowCoord);
	dir.z = (dir.z > 0.0) ? 1.0 : 0.0;

	shadowCoord.y += 2.0 * shadowMapStep.y;
	dir.w = UNITY_SAMPLE_SHADOW(_ShadowMapTexture, shadowCoord);
	dir.w = (dir.w > 0.0) ? 1.0 : 0.0;

	return abs(dir - 1.0);
}

float computeRelativeDistance(float4 shadowCoord, float2 dir, float c, int maxSearch)
{
	float2 shadowMapStep = dir * (float2(_ShadowMapTexture_TexelSize.x, _ShadowMapTexture_TexelSize.y) * shadowCoord.w);
	float4 tempShadowCoord = shadowCoord;
	float foundSilhouetteEnd = 0.0;
	float distance = 0.0;
	tempShadowCoord.xy += shadowMapStep;

	for (int it = 0; it < maxSearch; it++)
	{

		float center = UNITY_SAMPLE_SHADOW_PROJ(_ShadowMapTexture, tempShadowCoord);
		bool isCenterUmbra = (center > 0.0) ? false : true;

		if (isCenterUmbra)
		{
			foundSilhouetteEnd = 1.0;
			break;
		}
		else
		{
			float4 d = computeDiscontinuity(tempShadowCoord);
			if ((d.x + d.y + d.z + d.w) == 0.0) { break; }
		}
		distance++;
		tempShadowCoord.xy += shadowMapStep;

	}

	distance = distance + (1.0 - c);
	return lerp(-distance, distance, foundSilhouetteEnd);
}

float4 computeRelativeDistance(float4 shadowCoord, float2 c, int maxSearch)
{
	
	float dl = computeRelativeDistance(shadowCoord, float2(1, 0), (1.0 - c.x), maxSearch);
	float dr = computeRelativeDistance(shadowCoord, float2(-1, 0), c.x, maxSearch);
	float db = computeRelativeDistance(shadowCoord, float2(0, 1), (1.0 - c.y), maxSearch);
	float dt = computeRelativeDistance(shadowCoord, float2(0, -1), c.y, maxSearch);
	return float4(dl, dr, db, dt);

}

float normalizeRelativeDistance(float2 dist, int maxSearch) {

	float T = 1;
	if(dist.x < 0.0 && dist.y < 0.0) T = 0;
	if(dist.x > 0.0 && dist.y > 0.0) T = -2;
	
	float length = min(abs(dist.x) + abs(dist.y), float(maxSearch));
	return abs(max(T * dist.x, T * dist.y))/length;

}

float2 normalizeRelativeDistance(float4 dist, int maxSearch)
{

	float2 r;
	r.x = normalizeRelativeDistance(float2(dist.x, dist.y), maxSearch);
	r.y = normalizeRelativeDistance(float2(dist.z, dist.w), maxSearch);
	return r;

}

float revectorizeShadow(float2 r)
{

	if((r.x * r.y > 0) && (1.0 - r.x > r.y)) return _LightShadowData.r;
	else return 1.0;

}

float4 computeShadowFromRBSM(float4 shadowCoord) 
{

	int maxSearch = 2;
	half shadow = UNITY_SAMPLE_SHADOW_PROJ(_ShadowMapTexture, shadowCoord);
	if(shadow == 0.0) return _LightShadowData.r;

	float4 d = computeDiscontinuity(shadowCoord);
	if((d.r + d.g + d.b + d.a) == 0.0) return 1.0;
	else if((d.r + d.g) == 2.0 || (d.b + d.a) == 2.0) return _LightShadowData.r;
	
	float2 c = float2(frac((1.0 - shadowCoord.x / shadowCoord.w) * _ShadowMapTexture_TexelSize.z), frac((1.0 - shadowCoord.y / shadowCoord.w) * _ShadowMapTexture_TexelSize.w));
	float4 dist = computeRelativeDistance(shadowCoord, c, maxSearch);
	float2 r = normalizeRelativeDistance(dist, maxSearch);
	return revectorizeShadow(r);
					
}
#endif // RBSM