# Referencias · transición del hero a «La repisa» (27-09-2026)

URLs verificadas al abrirlas. Ninguna referencia hace exactamente lo que buscamos; cada una resuelve una pieza.

## Letras que viajan de titular a titular
- Codrops · SplitText a MorphSVG, 5 demos: https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/ (titular que se desintegra en letras con física)
- GSAP Flip (shared element): https://gsap.com/docs/v3/Plugins/Flip/ · demo: https://codepen.io/GreenSock/pen/ExyzePZ
- Codrops · un elemento, varias animaciones de scroll seguidas: https://tympanus.net/codrops/2024/11/20/consecutive-scroll-animations-with-one-element/
- Técnica propuesta: SplitText en ambos titulares + Flip por carácter dentro de un ScrollTrigger con scrub

## Cambio de plano (ventanilla → mesa)
- Awwwards · 3D hero con inclinación de cámara al hacer scroll: https://www.awwwards.com/inspiration/3d-home-hero-custom-three-js-3d-header-with-camera-tilt-on-scroll-we-enable-digital-engineers
- Codrops · portfolio con una sola toma de cámara ligada al scroll (abr 2026): https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/

## Tren sobre una vía ligada al scroll
- GSAP MotionPathPlugin: https://gsap.com/docs/v3/Plugins/MotionPathPlugin/
- Frontend Horse · nadador que sigue un trazado SVG: https://frontend.horse/articles/swimming-on-scroll-with-gsap/
- Codrops · recorrido por un mapa SVG con scroll (may 2026): https://tympanus.net/codrops/2026/05/21/creating-scroll-driven-svg-map-animations-with-gsap/
- Codrops · recorrido por curvas entre posiciones fijas (dic 2025, estilo web de Lando Norris): https://tympanus.net/codrops/2025/12/17/building-responsive-scroll-triggered-curved-path-animations-with-gsap/

## Papel en web
- Aimee's Papercraft World (Three.js, ilustración sobre geometría, cámara por scroll): https://www.webgpu.com/showcase/aimees-papercraft-world-threejs-papercraft-portfolio/
- Codrops · PFold, desplegado tipo papel (2012): https://tympanus.net/codrops/2012/10/17/pfold-paper-like-unfolding-effect/
- CodePen · aviones de papel con scroll: https://codepen.io/anacoxta/pen/dEVvGJ

## Herramientas
- GSAP 3.13+: todos los plugins gratis (SplitText, Flip, MotionPath, MorphSVG, ScrollSmoother): https://gsap.com/pricing/ · en cdnjs: `cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/`
- CSS `animation-timeline`: Chrome y Safari 26 sí; Firefox tras flag → solo como mejora opcional
- View Transitions (mismo documento): Baseline desde oct 2025
- Lenis (scroll suave, <8 KB): https://lenis.dev/ · compite por CPU con el canvas en móvil; de entrada, no
