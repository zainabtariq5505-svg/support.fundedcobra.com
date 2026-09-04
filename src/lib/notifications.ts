// Sound notification for new messages
export function playMessageSound() {
  if (typeof window === 'undefined') return;
  
  // Create a simple notification beep using Web Audio API
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (err) {
    console.warn('[Notifications] Could not play sound:', err);
  }
}

// Desktop notification
export async function showDesktopNotification(title: string, body: string, icon?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  
  // Request permission if not granted
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: icon || '/logo/logo.png',
        badge: '/logo/logo.png',
        tag: 'ticket-message',
        renotify: false,
      });
    } catch (err) {
      console.warn('[Notifications] Could not show desktop notification:', err);
    }
  }
}

// Request notification permission on page load
export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('[Notifications] Permission:', permission);
    });
  }
}
