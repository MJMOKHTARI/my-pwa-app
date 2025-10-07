if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      // موفقیت: stream رو برای دوربین/میکروفون استفاده کن
      console.log('مجوز داده شد');
    })
    .catch(err => {
      console.error('خطا در مجوز:', err.name); // مثلاً NotAllowedError یا NotFoundError
      alert('لطفاً مجوز دوربین/میکروفون رو در تنظیمات مرورگر فعال کنید.');
    });
} else {
  alert('این مرورگر از API پشتیبانی نمی‌کنه.');
}
