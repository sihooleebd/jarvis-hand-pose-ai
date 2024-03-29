function calculateCosineSimilarity(v1, v2) {
  if (!Array.isArray(v1) || !Array.isArray(v1) || v1.length != v2.length) {
    return -1;
  }
  const innerProduct = v1.map((v1Value, i) => v1Value * v2[i]).sum();
  const v1Len = Math.sqrt(v1.map((v) => v * v).sum());
  const v2Len = Math.sqrt(v2.map((v) => v * v).sum());
  if (v1Len == 0 || v2Len == 0) {
    return -1;
  }
  return innerProduct / v1Len / v2Len;
}

function standardize(handLandmarks) {
  if (!Array.isArray(handLandmarks)) {
    return null;
  }
  const avgX = handLandmarks.map((p) => p[0]).average();
  const avgY = handLandmarks.map((p) => p[1]).average();
  const avgZ = handLandmarks.map((p) => p[2]).average();
  const vX = handLandmarks.map((p) => (p[0] - avgX) * (p[0] - avgX)).average();
  const vY = handLandmarks.map((p) => (p[1] - avgY) * (p[1] - avgY)).average();
  const vZ = handLandmarks.map((p) => (p[2] - avgZ) * (p[2] - avgZ)).average();

  const sX = Math.sqrt(vX);
  const sY = Math.sqrt(vY);
  const sZ = Math.sqrt(vZ);
  return handLandmarks.map((p) => [
    (p[0] - avgX) / sX,
    (p[1] - avgY) / sY,
    (p[2] - avgZ) / sZ,
  ]);
}

function normalize(handLandmarks) {
  if (!Array.isArray(handLandmarks)) {
    return null;
  }
  const minX = handLandmarks.map((p) => p[0]).minN();
  const maxX = handLandmarks.map((p) => p[0]).maxN();
  const minY = handLandmarks.map((p) => p[1]).minN();
  const maxY = handLandmarks.map((p) => p[1]).maxN();
  const minZ = handLandmarks.map((p) => p[2]).minN();
  const maxZ = handLandmarks.map((p) => p[2]).maxN();
  return handLandmarks.map((p) => [
    ((p[0] - minX) / (maxX - minX)) * 10,
    ((p[1] - minY) / (maxY - minY)) * 10,
    ((p[2] - minZ) / (maxZ - minZ)) * 10,
  ]);
  // x' = x-(x의 최소값)/(x의 최대값-x의 최소값)
  // y' = y-(y의 최소값)/(y의 최대값-y의 최소값)
  // z' = z-(z의 최소값)/(z의 최대값-z의 최소값)
}

export { calculateCosineSimilarity, standardize, normalize };
