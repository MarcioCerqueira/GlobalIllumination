	
	This is the shader file for hard shadow anti-aliasing of spot lights in the Unity game engine. We have tested it in Unity version 5.6.0.f3. To test it on your own Unity engine, you need to:

	- Replace the original UnityShadowLibrary.cginc file in the Unity install location;
	
	or...
	
	- Replace only the part of the original UnityShadowLibrary.cginc file that is related to spot light shadows

	In Unity version 5.6.0.f3, the UnityShadowLibrary.cginc can be found at the directory \Unity\Editor\Data\CGIncludes\. We strongly recommend a backup of the original UnityShadowLibrary.cginc file before any update.

	The provided shader code is in the public domain and can be downloaded for free. In return, whenever you use it on your own application or research, please let me know or cite my work "Hard Shadow Anti-Aliasing for Spot Lights in a Game Engine", published in the SBGames 2017 conference.

	The code was developed in collaboration with Almir V. Teixeira.