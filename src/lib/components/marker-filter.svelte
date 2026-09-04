<svg class="absolute size-0" width="0" height="0" aria-hidden="true">
  <filter
    id="marker-stroke"
    x="-5%"
    y="-50%"
    width="110%"
    height="200%"
    color-interpolation-filters="sRGB"
  >
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.9 0.9"
      numOctaves="2"
      seed="4"
      result="grain"
    />
    <feColorMatrix
      in="grain"
      type="matrix"
      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.2 -0.5"
      result="grain-mask"
    />
    <feComposite in="SourceGraphic" in2="grain-mask" operator="in" />
  </filter>
</svg>
