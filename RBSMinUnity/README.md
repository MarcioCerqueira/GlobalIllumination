# Hard Shadow Anti-Aliasing for Spot Lights in a Game Engine

by Márcio Macedo, Almir Teixeira, Antônio Apolinário and Karl Agüero.

### Introduction

Here, we provide two shader files for hard shadow anti-aliasing in the Unity game engine. 

The first shader file <b> UnityShadowLibrary.cginc </b> was tested in Unity version 5.6.0.f3 and provides anti-aliasing for spot lights. To test it on your own Unity engine, you need to (1) replace the original file in the Unity install location or (2) replace only the part of the original UnityShadowLibrary.cginc file that is related to spot light shadows. In Unity version 5.6.0.f3, the UnityShadowLibrary.cginc file can be found at the directory \Unity\Editor\Data\CGIncludes\. We strongly recommend a backup of the original UnityShadowLibrary.cginc file before any update. <b> UnityShadowLibrary.cginc </b> was developed in collaboration with <b> Almir Teixeira</b>.

The second shader file <b> RBSM.cginc </b> was tested in Unity 2019.2.17 and provides anti-aliasing for directional lights. To add the revectorization in your shadows, you may call the function <i>computeShadowFromRBSM</i> in the fragment shader, passing the shadow coordinates as input parameter to the function. <b> RBSM.cginc </b> was developed in collaboration with [Matthieu Ostertag.](http://blackfire-studio.com/) 

## Citation

The provided source codes are in public domain and can be downloaded for free. If this work is useful for your research, please consider citing:

  ```shell
  @inproceedings{Macedo2017,
  author={Macedo, Marcio and Teixeira, Almir and Apolinario, Antonio and Aguero, Karl},
  title={Hard Shadow Anti-Aliasing for Spot Lights in a Game Engine},
  booktitle={Proceedings of the 16th Brazilian Symposium on Computer Games and Digital Entertainment (SBGAMES)},
  year={2017},
  pages={106-115},
  doi={10.1109/SBGames.2017.00020},
  publisher={IEEE}
  }
  ```
