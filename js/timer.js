/**
 * timer.js - 时间控制器
 * 精确控制每词之间的停顿时间，支持开始/暂停/重置
 */

const Timer = (function () {
  let timerId = null;
  let remaining = 0;      // 剩余秒数
  let total = 0;           // 总秒数
  let paused = false;
  let tickCallback = null;  // 每秒回调
  let doneCallback = null;  // 完成回调
  let lastTickTime = 0;

  /**
   * 开始计时
   * @param {number} seconds - 倒计时秒数
   * @param {function} onTick - 每秒回调，参数(remaining)
   * @param {function} onDone - 完成回调
   */
  function start(seconds, onTick, onDone) {
    reset();
    total = seconds;
    remaining = seconds;
    tickCallback = onTick || null;
    doneCallback = onDone || null;
    paused = false;

    if (tickCallback) tickCallback(remaining);

    lastTickTime = Date.now();
    timerId = setInterval(function () {
      if (paused) return;

      var now = Date.now();
      var elapsed = (now - lastTickTime) / 1000;
      lastTickTime = now;

      remaining -= elapsed;

      if (remaining <= 0) {
        remaining = 0;
        if (tickCallback) tickCallback(0);
        var cb = doneCallback;
        reset();
        if (cb) cb();
        return;
      }

      if (tickCallback) tickCallback(Math.ceil(remaining));
    }, 200); // 200ms 精度
  }

  /**
   * 暂停计时
   */
  function pause() {
    paused = true;
  }

  /**
   * 恢复计时
   */
  function resume() {
    if (paused) {
      paused = false;
      lastTickTime = Date.now();
    }
  }

  /**
   * 重置计时器
   */
  function reset() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    remaining = 0;
    total = 0;
    paused = false;
    tickCallback = null;
    doneCallback = null;
  }

  /**
   * 获取剩余时间
   */
  function getRemaining() {
    return Math.max(0, Math.ceil(remaining));
  }

  /**
   * 是否暂停中
   */
  function isPaused() {
    return paused;
  }

  /**
   * 是否正在运行
   */
  function isRunning() {
    return timerId !== null;
  }

  return {
    start: start,
    pause: pause,
    resume: resume,
    reset: reset,
    getRemaining: getRemaining,
    isPaused: isPaused,
    isRunning: isRunning
  };
})();
