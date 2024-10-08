const dataMap = new WeakMap();

/**
 * Normalizes a Float32Array to Array(m): We use this to draw amplitudes on a graph
 * If we're rendering the same audio data, then we'll often be using
 * the same (data, m, downsamplePeaks) triplets so we give option to memoize
 */
const normalizeArray = (
  data: Float32Array,
  m: number,
  downsamplePeaks: boolean = false,
  memoize: boolean = false
) => {
  let cache, mKey, dKey;
  if (memoize) {
    mKey = m.toString();
    dKey = downsamplePeaks.toString();
    cache = dataMap.has(data) ? dataMap.get(data) : {};
    dataMap.set(data, cache);
    cache[mKey] = cache[mKey] || {};
    if (cache[mKey][dKey]) {
      return cache[mKey][dKey];
    }
  }
  const n = data.length;
  const result = new Array(m);
  if (m <= n) {
    // Downsampling
    result.fill(0);
    const count = new Array(m).fill(0);
    for (let i = 0; i < n; i++) {
      const index = Math.floor(i * (m / n));
      if (downsamplePeaks) {
        // take highest result in the set
        result[index] = Math.max(result[index], Math.abs(data[i]));
      } else {
        result[index] += Math.abs(data[i]);
      }
      count[index]++;
    }
    if (!downsamplePeaks) {
      for (let i = 0; i < result.length; i++) {
        result[i] = result[i] / count[i];
      }
    }
  } else {
    for (let i = 0; i < m; i++) {
      const index = (i * (n - 1)) / (m - 1);
      const low = Math.floor(index);
      const high = Math.ceil(index);
      const t = index - low;
      if (high >= n) {
        result[i] = data[n - 1];
      } else {
        result[i] = data[low] * (1 - t) + data[high] * t;
      }
    }
  }
  if (memoize) {
    cache[mKey as string][dKey as string] = result;
  }
  return result;
};

export const WavRenderer = {
  /**
   * Renders a point-in-time snapshot of an audio sample, usually frequency values
   * @param canvas
   * @param ctx
   * @param data
   * @param color
   * @param pointCount number of bars to render
   * @param barWidth width of bars in px
   * @param barSpacing spacing between bars in px
   * @param center vertically center the bars
   */
  drawBars: (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    color: string,
    pointCount: number = 0,
    barWidth: number = 0,
    barSpacing: number = 0,
    center: boolean = false
  ) => {
    pointCount = Math.floor(
      Math.min(
        pointCount,
        (canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing)
      )
    );
    if (!pointCount) {
      pointCount = Math.floor(
        (canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing)
      );
    }
    if (!barWidth) {
      barWidth = (canvas.width - barSpacing) / pointCount - barSpacing;
    }
    const points = normalizeArray(data, pointCount, true);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - barSpacing;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);

    const startAngle = Math.PI / 4; // Ajusta este valor para cambiar el punto de inicio

    let nextX: number = 0;
    let nextY: number = 0;

    for (let i = 0; i < pointCount; i++) {
      const amplitude = Math.abs(points[i]);
      const radius = Math.max(1, amplitude * maxRadius);
      const angle = startAngle + (i / pointCount) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const nextIndex = (i + 1) % pointCount;
      const nextAmplitude = Math.abs(points[nextIndex]);
      const nextRadius = Math.max(1, nextAmplitude * maxRadius);
      const nextAngle = startAngle + (nextIndex / pointCount) * 2 * Math.PI;
      nextX = centerX + nextRadius * Math.cos(nextAngle);
      nextY = centerY + nextRadius * Math.sin(nextAngle);

      const controlX = (x + nextX) / 2;
      const controlY = (y + nextY) / 2;

      ctx.quadraticCurveTo(x, y, controlX, controlY);
    }

    // Conectar el último punto con el primero
    const firstAmplitude = Math.abs(points[0]);
    const firstRadius = Math.max(1, firstAmplitude * maxRadius);
    const firstAngle = startAngle;
    const firstX = centerX + firstRadius * Math.cos(firstAngle);
    const firstY = centerY + firstRadius * Math.sin(firstAngle);

    ctx.quadraticCurveTo(nextX, nextY, (nextX + firstX) / 2, (nextY + firstY) / 2);
    ctx.quadraticCurveTo((nextX + firstX) / 2, (nextY + firstY) / 2, firstX, firstY);

    ctx.closePath();
    ctx.fill();
  }
};
