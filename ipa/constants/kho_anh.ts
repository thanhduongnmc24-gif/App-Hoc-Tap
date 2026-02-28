// Đường dẫn: ipa/constants/kho_anh.ts

export const GIOI_IMAGES = [
  require('../assets/images/anh_tinh_diem/gioi/1.png'),
  require('../assets/images/anh_tinh_diem/gioi/2.png'),
  require('../assets/images/anh_tinh_diem/gioi/3.png'),
  // Sau này có ảnh giỏi mới, anh hai chỉ việc copy file vào thư mục rồi thêm 1 dòng ở đây:
  // require('../assets/images/anh_tinh_diem/gioi/3.png'),
];

export const TOT_IMAGES = [
  require('../assets/images/anh_tinh_diem/tot/1.png'),
  require('../assets/images/anh_tinh_diem/tot/2.png'),
  // Thêm ảnh tốt ở đây:
  // require('../assets/images/anh_tinh_diem/tot/3.png'),
];

export const CAN_CO_GAN_IMAGES = [
  require('../assets/images/anh_tinh_diem/can_co_gan/1.png'),
  require('../assets/images/anh_tinh_diem/can_co_gan/2.png'),
  // Thêm ảnh cần cố gắng ở đây:
  // require('../assets/images/anh_tinh_diem/can_co_gan/3.png'),
];

// Gom tất cả lại để lát nữa app tải một lần cho lẹ
export const ALL_IMAGES = [...GIOI_IMAGES, ...TOT_IMAGES, ...CAN_CO_GAN_IMAGES];