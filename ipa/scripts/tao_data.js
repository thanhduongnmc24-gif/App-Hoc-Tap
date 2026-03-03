const fs = require('fs');
const path = require('path');

// Đường dẫn gốc của dự án
const assetsDir = path.join(__dirname, '../assets');
const constantsDir = path.join(__dirname, '../constants');

// Đồ nghề của Tèo: Tự động tạo thư mục nếu đại ca chưa tạo để tránh văng lỗi
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Đồ nghề của Tèo: Quét tìm file đúng định dạng
const getFiles = (dirPath, extensions) => {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return extensions.includes(ext);
  });
};

const imageExts = ['.png', '.jpg', '.jpeg'];
const videoExts = ['.mp4', '.mov', '.avi'];

console.log('🚀 TÈO ĐANG BẬT CHẾ ĐỘ QUÉT TOÀN TẬP...');

// ==========================================
// 1. XỬ LÝ KHO TẬP ĐỌC
// ==========================================
const tapDocDir = path.join(assetsDir, 'images', 'anh_tap_doc');
ensureDir(tapDocDir);
const tapDocFiles = getFiles(tapDocDir, imageExts);

let tapDocContent = `// File này Tèo code tự động. Đại ca quăng ảnh vào rồi chạy Tool nha!\n\nexport const TAP_DOC_DATA = [\n`;
tapDocFiles.forEach(file => {
  let word = file.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
  tapDocContent += `  { word: '${word}', image: require('../assets/images/anh_tap_doc/${file}') },\n`;
});
tapDocContent += `];\n`;

fs.writeFileSync(path.join(constantsDir, 'kho_tap_doc.ts'), tapDocContent, 'utf8');
console.log(`✅ Kho Tập Đọc : Đã nạp ${tapDocFiles.length} tấm ảnh!`);


// ==========================================
// 2. XỬ LÝ KHO ẢNH TOÁN (Thưởng) - ĐÃ SỬA CHUẨN ĐƯỜNG DẪN anh_tinh_diem
// ==========================================
const anhGioiDir = path.join(assetsDir, 'images', 'anh_tinh_diem', 'gioi');
const anhTotDir = path.join(assetsDir, 'images', 'anh_tinh_diem', 'tot');
const anhCanCoGanDir = path.join(assetsDir, 'images', 'anh_tinh_diem', 'can_co_gan');

// Đảm bảo 3 rổ này phải tồn tại
[anhGioiDir, anhTotDir, anhCanCoGanDir].forEach(ensureDir);

const makeKhoAnhContent = () => {
  let content = `// File này Tèo code tự động. Đại ca phân loại ảnh vào đúng thư mục rồi chạy Tool nha!\n\n`;
  
  const gioiFiles = getFiles(anhGioiDir, imageExts);
  content += `export const GIOI_IMAGES = [\n${gioiFiles.map(f => `  require('../assets/images/anh_tinh_diem/gioi/${f}'),`).join('\n')}\n];\n\n`;
  
  const totFiles = getFiles(anhTotDir, imageExts);
  content += `export const TOT_IMAGES = [\n${totFiles.map(f => `  require('../assets/images/anh_tinh_diem/tot/${f}'),`).join('\n')}\n];\n\n`;
  
  const canCoGanFiles = getFiles(anhCanCoGanDir, imageExts);
  content += `export const CAN_CO_GAN_IMAGES = [\n${canCoGanFiles.map(f => `  require('../assets/images/anh_tinh_diem/can_co_gan/${f}'),`).join('\n')}\n];\n\n`;

  content += `export const ALL_IMAGES = [...GIOI_IMAGES, ...TOT_IMAGES, ...CAN_CO_GAN_IMAGES];\n`;
  
  console.log(`✅ Kho Ảnh Toán: Đã nạp ${gioiFiles.length} Giỏi, ${totFiles.length} Tốt, ${canCoGanFiles.length} Cố gắng!`);
  return content;
};
fs.writeFileSync(path.join(constantsDir, 'kho_anh.ts'), makeKhoAnhContent(), 'utf8');


// ==========================================
// 3. XỬ LÝ KHO VIDEO TOÁN (Thưởng)
// ==========================================
// Tèo vẫn để nguyên video ở assets/videos/gioi, nếu đại ca có bỏ video vào thư mục tên khác thì ới Tèo sửa nốt nha!
const videoGioiDir = path.join(assetsDir, 'videos', 'gioi');
const videoTotDir = path.join(assetsDir, 'videos', 'tot');
const videoCanCoGanDir = path.join(assetsDir, 'videos', 'can_co_gan');

// Đảm bảo 3 rổ này phải tồn tại
[videoGioiDir, videoTotDir, videoCanCoGanDir].forEach(ensureDir);

const makeKhoVideoContent = () => {
  let content = `// File này Tèo code tự động. Đại ca phân loại video vào đúng thư mục rồi chạy Tool nha!\n\n`;
  
  const gioiFiles = getFiles(videoGioiDir, videoExts);
  content += `export const GIOI_VIDEOS = [\n${gioiFiles.map(f => `  require('../assets/videos/gioi/${f}'),`).join('\n')}\n];\n\n`;
  
  const totFiles = getFiles(videoTotDir, videoExts);
  content += `export const TOT_VIDEOS = [\n${totFiles.map(f => `  require('../assets/videos/tot/${f}'),`).join('\n')}\n];\n\n`;
  
  const canCoGanFiles = getFiles(videoCanCoGanDir, videoExts);
  content += `export const CAN_CO_GAN_VIDEOS = [\n${canCoGanFiles.map(f => `  require('../assets/videos/can_co_gan/${f}'),`).join('\n')}\n];\n\n`;

  content += `export const ALL_VIDEOS = [...GIOI_VIDEOS, ...TOT_VIDEOS, ...CAN_CO_GAN_VIDEOS];\n`;
  
  console.log(`✅ Kho Video Toán: Đã nạp ${gioiFiles.length} Giỏi, ${totFiles.length} Tốt, ${canCoGanFiles.length} Cố gắng!`);
  return content;
};
fs.writeFileSync(path.join(constantsDir, 'kho_video.ts'), makeKhoVideoContent(), 'utf8');

console.log('🎉 TÈO ĐÃ LÀM PHÉP XONG TOÀN BỘ KHO DỮ LIỆU! ĐẠI CA MỞ APP LÊN QUẨY ĐI!');