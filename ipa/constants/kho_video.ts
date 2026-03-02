// Đường dẫn: ipa/constants/kho_video.ts

export const GIOI_VIDEOS = [
  require('../assets/videos/gioi_1.mp4'),
  require('../assets/videos/gioi_2.mp4'), 
  require('../assets/videos/gioi_3.mp4'),
  require('../assets/videos/gioi_4.mp4'), 
  require('../assets/videos/gioi_5.mp4'),
];

export const TOT_VIDEOS = [
  require('../assets/videos/tot_1.mp4'),
];

export const CAN_CO_GAN_VIDEOS = [
  require('../assets/videos/cangang_1.mp4'),
  require('../assets/videos/cangang_2.mp4'),
  require('../assets/videos/cangang_3.mp4'),
];

// Này để lỡ có xài pre-load mượt mà thì gọi nó
export const ALL_VIDEOS = [
  ...GIOI_VIDEOS,
  ...TOT_VIDEOS,
  ...CAN_CO_GAN_VIDEOS,
];