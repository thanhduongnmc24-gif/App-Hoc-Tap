const fs = require('fs');
const path = require('path');

// Đường dẫn gốc của dự án
const assetsDir = path.join(__dirname, '../assets');
const constantsDir = path.join(__dirname, '../constants');
const tramDir = path.join(assetsDir, 'tram_nhap_hang');

// Đồ nghề 1: Đảm bảo thư mục tồn tại (Tự tạo nếu chưa có)
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Đồ nghề 2: Lấy danh sách file theo đuôi
const getFiles = (dirPath, extensions) => {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return extensions.includes(ext);
  });
};

const imageExts = ['.png', '.jpg', '.jpeg'];
const videoExts = ['.mp4', '.mov', '.avi'];

console.log('🚀 TÈO ĐANG KHỞI ĐỘNG CỖ MÁY DỌN KHO "ALL-IN-ONE"...');

// =========================================================================
// PHẦN 1: BẢN ĐỒ VẬN CHUYỂN TỪ TRẠM TẠM SANG KHO CHÍNH
// =========================================================================
const mappings = [
  {
    src: path.join(tramDir, 'anh_tap_doc'),
    dest: path.join(assetsDir, 'images', 'anh_tap_doc')
  },
  {
    src: path.join(tramDir, 'anh_tinh_diem', 'gioi'),
    dest: path.join(assetsDir, 'images', 'anh_tinh_diem', 'gioi')
  },
  {
    src: path.join(tramDir, 'anh_tinh_diem', 'tot'),
    dest: path.join(assetsDir, 'images', 'anh_tinh_diem', 'tot')
  },
  {
    src: path.join(tramDir, 'anh_tinh_diem', 'can_co_gan'),
    dest: path.join(assetsDir, 'images', 'anh_tinh_diem', 'can_co_gan')
  },
  {
    src: path.join(tramDir, 'videos', 'gioi'),
    dest: path.join(assetsDir, 'videos', 'gioi')
  },
  {
    src: path.join(tramDir, 'videos', 'tot'),
    dest: path.join(assetsDir, 'videos', 'tot')
  },
  {
    src: path.join(tramDir, 'videos', 'can_co_gan'),
    dest: path.join(assetsDir, 'videos', 'can_co_gan')
  }
];

// Tiến hành dọn hàng theo bản đồ
mappings.forEach(map => {
  ensureDir(map.src); // Mở sẵn cửa trạm cho đại ca quăng hàng
  ensureDir(map.dest); // Mở sẵn cửa kho chính

  if (fs.existsSync(map.src)) {
    const files = fs.readdirSync(map.src);
    let count = 0;

    files.forEach(file => {
      const sourcePath = path.join(map.src, file);
      
      // Chỉ bốc file, bỏ qua thư mục con (nếu lỡ có)
      if (fs.statSync(sourcePath).isFile()) {
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);
        
        // BÙA THAY ÁO: Nếu là video thì nhắm mắt ép luôn thành đuôi .mp4
        const finalExt = videoExts.includes(ext) ? '.mp4' : ext;
        
        let finalName = baseName + finalExt;
        let destPath = path.join(map.dest, finalName);
        
        // KIỂM TRA TRÙNG TÊN: Nếu kho chính đã có file này rồi thì mới gắn đuôi số
        if (fs.existsSync(destPath)) {
          const timestamp = Date.now(); 
          finalName = `${baseName}_${timestamp}${finalExt}`; 
          destPath = path.join(map.dest, finalName);
        }
        
        // Chuyển hàng vào kho chính
        fs.renameSync(sourcePath, destPath);
        count++;
      }
    });

    if (count > 0) {
      // Báo cáo lộ trình gọn gàng cho đại ca dễ theo dõi
      const tenTram = map.src.replace(tramDir, '').substring(1).replace(/\\/g, '/'); 
      console.log(`🚚 Đã chuyển & xử lý ${count} món từ trạm [${tenTram}]`);
    }
  }
});

console.log('📦 ĐÃ DỌN SẠCH TRẠM TRUNG CHUYỂN! BẮT ĐẦU CẬP NHẬT SỔ SÁCH...');


// =========================================================================
// PHẦN 2: CẬP NHẬT LẠI CÁC FILE .TS (SỔ SÁCH CỦA APP)
// =========================================================================

// 1. XỬ LÝ KHO TẬP ĐỌC
const tapDocDir = path.join(assetsDir, 'images', 'anh_tap_doc');
ensureDir(tapDocDir);
const tapDocFiles = getFiles(tapDocDir, imageExts);

let tapDocContent = `// File này Tèo code tự động.\n// Đại ca quăng ảnh vào tram_nhap_hang/anh_tap_doc rồi chạy Tool nha!\n\nexport const TAP_DOC_DATA = [\n`;
tapDocFiles.forEach(file => {
  let word = file.replace(/\.[^/.]+$/, ""); // Gọt đuôi .png, .jpg
  word = word.replace(/_\d{13}$/, ""); // Gọt bỏ đoạn mã số chống trùng (nếu có) để tên trên app vẫn đẹp
  word = word.replace(/_/g, ' '); // Đổi gạch dưới thành khoảng trắng
  
  tapDocContent += `  { word: '${word}', image: require('../assets/images/anh_tap_doc/${file}') },\n`;
});
tapDocContent += `];\n`;

fs.writeFileSync(path.join(constantsDir, 'kho_tap_doc.ts'), tapDocContent, 'utf8');
console.log(`✅ Sổ Tập Đọc : Ghi nhận ${tapDocFiles.length} hình!`);


// 2. XỬ LÝ KHO ẢNH TOÁN
const anhGioiDir = path.join(assetsDir, 'images', 'anh_tinh_diem', 'gioi');
const anhTotDir = path.join(assetsDir, 'images', 'anh_tinh_diem', 'tot');
const anhCanCoGanDir = path.join(assetsDir, 'images', 'anh_tinh_diem', 'can_co_gan');

const makeKhoAnhContent = () => {
  let content = `// File này Tèo code tự động.\n// Đại ca quăng ảnh vào tram_nhap_hang/anh_tinh_diem/... rồi chạy Tool nha!\n\n`;
  const gioiFiles = getFiles(anhGioiDir, imageExts);
  content += `export const GIOI_IMAGES = [\n${gioiFiles.map(f => `  require('../assets/images/anh_tinh_diem/gioi/${f}'),`).join('\n')}\n];\n\n`;
  const totFiles = getFiles(anhTotDir, imageExts);
  content += `export const TOT_IMAGES = [\n${totFiles.map(f => `  require('../assets/images/anh_tinh_diem/tot/${f}'),`).join('\n')}\n];\n\n`;
  const canCoGanFiles = getFiles(anhCanCoGanDir, imageExts);
  content += `export const CAN_CO_GAN_IMAGES = [\n${canCoGanFiles.map(f => `  require('../assets/images/anh_tinh_diem/can_co_gan/${f}'),`).join('\n')}\n];\n\n`;
  content += `export const ALL_IMAGES = [...GIOI_IMAGES, ...TOT_IMAGES, ...CAN_CO_GAN_IMAGES];\n`;
  return content;
};
fs.writeFileSync(path.join(constantsDir, 'kho_anh.ts'), makeKhoAnhContent(), 'utf8');
console.log(`✅ Sổ Ảnh Toán: Cập nhật thành công!`);


// 3. XỬ LÝ KHO VIDEO TOÁN
const videoGioiDir = path.join(assetsDir, 'videos', 'gioi');
const videoTotDir = path.join(assetsDir, 'videos', 'tot');
const videoCanCoGanDir = path.join(assetsDir, 'videos', 'can_co_gan');

const makeKhoVideoContent = () => {
  let content = `// File này Tèo code tự động.\n// Đại ca quăng video vào tram_nhap_hang/videos/... rồi chạy Tool nha!\n\n`;
  
  // Lưu ý: Tèo chỉ quét các file đuôi .mp4 vì nãy Tèo đã ép đổi đuôi ở trên rồi nha đại ca!
  const mp4Exts = ['.mp4']; 
  
  const gioiFiles = getFiles(videoGioiDir, mp4Exts);
  content += `export const GIOI_VIDEOS = [\n${gioiFiles.map(f => `  require('../assets/videos/gioi/${f}'),`).join('\n')}\n];\n\n`;
  
  const totFiles = getFiles(videoTotDir, mp4Exts);
  content += `export const TOT_VIDEOS = [\n${totFiles.map(f => `  require('../assets/videos/tot/${f}'),`).join('\n')}\n];\n\n`;
  
  const canCoGanFiles = getFiles(videoCanCoGanDir, mp4Exts);
  content += `export const CAN_CO_GAN_VIDEOS = [\n${canCoGanFiles.map(f => `  require('../assets/videos/can_co_gan/${f}'),`).join('\n')}\n];\n\n`;
  
  content += `export const ALL_VIDEOS = [...GIOI_VIDEOS, ...TOT_VIDEOS, ...CAN_CO_GAN_VIDEOS];\n`;
  return content;
};
fs.writeFileSync(path.join(constantsDir, 'kho_video.ts'), makeKhoVideoContent(), 'utf8');
console.log(`✅ Sổ Video Toán: Cập nhật thành công!`);

console.log('🎉 XONG RỒI ĐẠI CA ƠI! HỆ THỐNG VẬN HÀNH TRƠN TRU!');