Array.prototype.sum = function () {
  return this.reduce((a, c) => a + c, 0);
};
Array.prototype.average = function () {
  return this.sum() / this.length;
};
Array.prototype.minN = function () {
  return this.reduce((a, c) => (a ? (a < c ? a : c) : c), undefined);
};
Array.prototype.maxN = function () {
  return this.reduce((a, c) => (a ? (a > c ? a : c) : c), undefined);
};
