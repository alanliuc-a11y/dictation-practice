/**
 * tts.js - 语音播放引擎（腾讯云版）
 * 优先使用腾讯云语音合成，降级到浏览器 Web Speech API
 * 
 * 手机兼容：使用持久 Audio 元素，避免自动播放限制
 */

const TTS = (() => {
  'use strict';

  // 私有变量
  let synth = null;
  let isSupported = false;
  let currentUtterance = null;
  let isCancelled = false;
  let repeatTimer = null;
  let isPlaying = false;
  let currentCallbackId = 0;

  // 持久 Audio 元素（手机兼容：只创建一次，复用播放）
  let persistentAudio = null;
  let audioUnlocked = false; // 是否已解锁自动播放

  // 常量定义
  const CONSTANTS = {
    DEFAULT_RATE: 0.25,
    DEFAULT_PITCH: 1.0,
    DEFAULT_VOLUME: 1.0,
    DEFAULT_REPEAT: 3,
    DEFAULT_INTERVAL: 800,
    MIN_RATE: 0.1,
    MAX_RATE: 1.5,
    MIN_REPEAT: 1,
    MAX_REPEAT: 5
  };

  // ========== UI反馈工具 ==========
  
  const Toast = {
    show(message, type = 'info', duration = 3000) {
      this.remove();
      const toast = document.createElement('div');
      toast.id = 'tts-toast';
      const colors = { error: '#ff4444', success: '#4CAF50', info: '#2196F3' };
      toast.style.cssText = `
        position:fixed;top:20px;left:50%;transform:translateX(-50%);
        background:${colors[type]||colors.info};color:white;
        padding:12px 24px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);
        z-index:10000;font-size:14px;max-width:80%;text-align:center;
        opacity:0;transition:opacity 0.3s ease;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);
      requestAnimationFrame(() => { toast.style.opacity = '1'; });
      if (duration > 0) setTimeout(() => this.remove(), duration);
    },
    remove() {
      const el = document.getElementById('tts-toast');
      if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
    }
  };

  // ========== 初始化 ==========

  const init = () => {
    if ('speechSynthesis' in window) {
      synth = window.speechSynthesis;
      isSupported = true;
    }

    // 创建持久 Audio 元素（预加载一个无声音频来解锁播放）
    persistentAudio = new Audio();
    persistentAudio.preload = 'auto';
    persistentAudio.volume = 1.0;

    // 在用户首次交互时解锁 Audio
    const unlock = () => {
      if (audioUnlocked) return;
      persistentAudio.play().then(() => {
        persistentAudio.pause();
        persistentAudio.currentTime = 0;
        audioUnlocked = true;
      }).catch(() => {});
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { once: false });
    document.addEventListener('touchend', unlock, { once: false });
    document.addEventListener('click', unlock, { once: false });
  };

  // ========== 工具函数 ==========

  const clearAllTimers = () => {
    if (repeatTimer) { clearTimeout(repeatTimer); repeatTimer = null; }
  };

  const isMathExpression = (text) => {
    return /[+\-×÷]/.test(text) && /=$/.test(text);
  };

  const mathToChinese = (text) => {
    if (typeof text !== 'string') return '';
    const operators = { '+':'加','-':'减','×':'乘','x':'乘','*':'乘','÷':'除','/':'除','=':'等于' };
    let result = text;
    Object.entries(operators).forEach(([op, cn]) => { result = result.split(op).join(cn); });
    const numToChinese = (num) => {
      const cn = ['零','一','二','三','四','五','六','七','八','九'];
      const places = ['','十','百','千'];
      const digits = num.toString().split('').map(Number);
      let s = '';
      digits.forEach((d, i) => {
        if (d !== 0) s += cn[d] + places[digits.length - 1 - i];
        else if (s && !s.endsWith('零')) s += '零';
      });
      return s || '零';
    };
    result = result.replace(/\d+/g, numToChinese);
    return result;
  };

  const getBestVoice = () => {
    if (!synth) return null;
    const voices = synth.getVoices();
    return voices.find(v => v.lang.includes('zh') && v.name.includes('Female'))
      || voices.find(v => v.lang.includes('zh'))
      || voices[0];
  };

  /**
   * 使用持久 Audio 播放 base64 音频
   * 返回 Promise，播放完成 resolve
   */
  const playAudioOnce = (audioSrc) => {
    return new Promise((resolve, reject) => {
      persistentAudio.src = audioSrc;
      persistentAudio.currentTime = 0;
      
      const onEnd = () => {
        persistentAudio.removeEventListener('ended', onEnd);
        persistentAudio.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        persistentAudio.removeEventListener('ended', onEnd);
        persistentAudio.removeEventListener('error', onError);
        reject(new Error('音频播放失败'));
      };

      persistentAudio.addEventListener('ended', onEnd);
      persistentAudio.addEventListener('error', onError);

      persistentAudio.play().catch(e => {
        persistentAudio.removeEventListener('ended', onEnd);
        persistentAudio.removeEventListener('error', onError);
        reject(e);
      });
    });
  };

  // ========== 腾讯云 TTS ==========

  const speakWithTencent = (text, options, callbackId, onEnd) => {
    const speechText = isMathExpression(text) ? mathToChinese(text) : text;
    let repeatCount = 0;

    const doRepeat = () => {
      if (isCancelled || callbackId !== currentCallbackId) {
        isPlaying = false;
        return;
      }

      // 调用 API 获取音频
      fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speechText })
      })
      .then(res => res.json())
      .then(result => {
        if (!result.success || !result.data?.audio) throw new Error('语音生成失败');
        if (isCancelled || callbackId !== currentCallbackId) return;

        const audioSrc = `data:audio/mp3;base64,${result.data.audio}`;
        persistentAudio.volume = options.volume || 1.0;

        return playAudioOnce(audioSrc);
      })
      .then(() => {
        if (isCancelled || callbackId !== currentCallbackId) return;

        repeatCount++;
        if (repeatCount < options.repeat) {
          repeatTimer = setTimeout(doRepeat, options.interval);
        } else {
          isPlaying = false;
          if (onEnd) onEnd();
        }
      })
      .catch(error => {
        console.warn('腾讯云 TTS 失败:', error.message);
        if (callbackId === currentCallbackId) {
          speakWithBrowser(text, options, callbackId, onEnd);
        }
      });
    };

    isPlaying = true;
    doRepeat();
  };

  /**
   * 使用浏览器 Web Speech API 播放（降级方案）
   */
  const speakWithBrowser = (text, options, callbackId, onEnd) => {
    const speechText = isMathExpression(text) ? mathToChinese(text) : text;
    let repeatCount = 0;

    const speakOnce = () => {
      if (isCancelled || callbackId !== currentCallbackId) {
        isPlaying = false;
        return;
      }

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = 'zh-CN';
      utterance.rate = options.rate;
      utterance.pitch = options.pitch;
      utterance.volume = options.volume;

      const voice = getBestVoice();
      if (voice) utterance.voice = voice;
      currentUtterance = utterance;

      utterance.onend = () => {
        if (callbackId !== currentCallbackId) return;
        repeatCount++;
        if (repeatCount < options.repeat && !isCancelled) {
          repeatTimer = setTimeout(speakOnce, options.interval);
        } else {
          isPlaying = false;
          if (onEnd) onEnd();
        }
      };

      utterance.onerror = (e) => {
        if (e.error === 'canceled' || callbackId !== currentCallbackId) return;
        isPlaying = false;
        if (onEnd) onEnd();
      };

      synth.speak(utterance);
    };

    isPlaying = true;
    speakOnce();
  };

  // ========== 公共 API ==========

  const speak = (text, options = {}, onEnd) => {
    if (typeof options === 'function') { onEnd = options; options = {}; }
    if (!text || typeof text !== 'string') {
      Toast.show('播放失败：无效的文本', 'error');
      if (onEnd) onEnd(new Error('无效的播放文本'));
      return;
    }

    const config = {
      rate: CONSTANTS.DEFAULT_RATE, pitch: CONSTANTS.DEFAULT_PITCH,
      volume: CONSTANTS.DEFAULT_VOLUME, repeat: CONSTANTS.DEFAULT_REPEAT,
      interval: CONSTANTS.DEFAULT_INTERVAL, ...options
    };
    config.rate = Math.max(CONSTANTS.MIN_RATE, Math.min(CONSTANTS.MAX_RATE, config.rate));
    config.repeat = Math.max(CONSTANTS.MIN_REPEAT, Math.min(CONSTANTS.MAX_REPEAT, config.repeat));

    // 递增回调ID
    currentCallbackId++;
    const thisCallbackId = currentCallbackId;

    // 停止之前的播放
    stop();
    isCancelled = false;

    // 优先使用腾讯云 TTS
    speakWithTencent(text, config, thisCallbackId, onEnd);
  };

  const stop = () => {
    isCancelled = true;
    isPlaying = false;
    clearAllTimers();

    // 停止持久 Audio
    if (persistentAudio) {
      persistentAudio.pause();
      persistentAudio.removeAttribute('src');
      persistentAudio.load();
    }

    // 停止 Web Speech API
    if (synth) synth.cancel();
  };

  const pause = () => {
    if (persistentAudio) persistentAudio.pause();
    if (synth) synth.pause();
  };

  const resume = () => {
    if (persistentAudio) persistentAudio.play().catch(() => {});
    if (synth) synth.resume();
  };

  // 初始化
  init();

  return {
    speak, stop, pause, resume,
    mathToChinese, isMathExpression, getBestVoice,
    Toast, isSupported: () => isSupported, isPlaying: () => isPlaying
  };
})();
