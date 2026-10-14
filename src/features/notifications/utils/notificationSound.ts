/**
 * Phát âm thanh thông báo bằng Web Audio API.
 *
 * Tách khỏi `components/NotificationHeaderIcon.tsx` để file component chỉ export
 * component — yêu cầu của `react-refresh/only-export-components`, vốn bắt buộc
 * để Fast Refresh hoạt động đúng.
 *
 * Không phụ thuộc file mp3 bên ngoài nên không cần thêm asset vào bundle.
 */

/**
 * Phát một chuỗi hai nốt ngắn (E5 rồi A5) báo hiệu có thông báo mới.
 *
 * Không bao giờ ném lỗi: trình duyệt chặn `AudioContext` khi người dùng chưa
 * tương tác với trang, và môi trường test có thể không có Web Audio API. Trong
 * cả hai trường hợp, việc không phát được âm thanh không được làm hỏng UI.
 */
export const playNotificationSound = (): void => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Âm 1: E5 (659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Âm 2: A5 (880.00Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.2, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);
  } catch {
    // Bỏ qua lỗi nếu môi trường không hỗ trợ audio hoặc chưa tương tác người dùng
  }
};
