This is a C++/GLSL application for shadow computation through soft shadow mapping.

It was implemented based on the following papers:

	- Shadow Mapping proposed in "Casting Curved Shadows on Curved Surfaces" by L. Willians in 1978;

	- Summed-Area Tables proposed in "Summed-Area Tables for Texture Mapping" by F. Crow in 1980;

	- Monte-Carlo Soft Shadow Volumes/Shadow Mapping proposed in "Generating Soft Shadows with a Depth Buffer Algorithm" by L. Brotman and N. Badler in 1984;

	- Accumulation Buffer proposed in "The Accumulation Buffer: Hardware Support for High-Quality Rendering" by P. Haeberli and K. Akeley in 1990;

	- G-Buffer proposed in "Comprehensible Rendering of 3-D Shapes" by T. Saito and T. Takahashi in 1990;

	- Bilateral Filter proposed in "Bilateral Filtering for Gray and Color Images" by C. Tomasi and R. Manduchi in 1998;

	- Percentage-Closer Soft Shadows proposed in "Percentage-Closer Soft Shadows" by R. Fernando in 2005;

	- Separable Bilateral Filter  proposed in "Separable Bilateral Filtering for Fast Video Preprocessing" by T.Pham and L. van Vliet in 2005;

	- Summed-Area Tables in GPU proposed in "Fast Summed-Area Table Generation and Its Applications" by J. Hensley et al. in 2005;

	- Hierarchical Shadow Map proposed in "Real-Time Soft Shadow Mapping by Backprojection" by G. Guennebaud et al. in 2006;

	- Summed-Area Variance Shadow Mapping proposed in "Summed-Area Variance Shadow Mapping" by A. Lauritzen in 2007;

	- Screen-Space Percentage-Closer Soft Shadows proposed in "Screen-Space Percentage-Closer Soft Shadows" by M. MohammadBagher et al. in 2010;

	- Variance Soft Shadow Mapping proposed in "Variance Soft Shadow Mapping" by B. Yang et al. in 2010;

	- Screen Space Anisotropic Blurred Soft Shadows proposed in "Screen Space Anisotropic Blurred Soft Shadows" by Z. Zheng and S. Saito in 2011;

	- Adaptive Light Source Sampling proposed in "Fast Accurate Soft Shadows with Adaptive Light Source Sampling" by M. Schwarzler et al. in 2012;

	- Exponential Soft Shadow Mapping proposed in "Exponential Soft Shadow Mapping" by L. Shen et al. in 2013;
	
	- Separable Soft Shadow Mapping proposed in "Separable Soft Shadow Mapping" by J. Buades et al. in 2015;

	- Moment Soft Shadow Mapping proposed in "Beyond Hard Shadows: Moment Shadow Maps for Single Scattering, Soft Shadows and Translucent Occluders" by C. Peters et al. in 2016;

	- Revectorization-based Accurate Soft Shadowing proposed in "Revectorization-based Accurate Soft Shadow using Adaptive Area Light Source Sampling" by M. Macedo and A. Apolinario in 2017;

	- Euclidean Distance Transform Soft Shadow Mapping proposed in "Euclidean Distance Transform Soft Shadow Mapping" by M. Macedo and A. Apolinario in 2017;