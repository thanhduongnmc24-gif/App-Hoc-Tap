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
const lottieExts = ['.json']; // Thêm đuôi json cho hoạt hình

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
  },
  {
    src: path.join(tramDir, 'game_cho_vat_an'),
    dest: path.join(assetsDir, 'game_cho_vat_an')
  },
  // BĂNG CHUYỀN MỚI CHO THÚ NHÚN LOTTIE (GAME BẬP BÊNH)
  {
    src: path.join(tramDir, 'lottie_animals'),
    dest: path.join(assetsDir, 'lottie')
  }
];

// Tiến hành dọn hàng theo bản đồ
mappings.forEach(map => {
  ensureDir(map.src); 
  ensureDir(map.dest); 

  if (fs.existsSync(map.src)) {
    const files = fs.readdirSync(map.src);
    let count = 0;

    files.forEach(file => {
      const sourcePath = path.join(map.src, file);
      
      if (fs.statSync(sourcePath).isFile()) {
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);
        
        const finalExt = videoExts.includes(ext) ? '.mp4' : ext;
        
        let finalName = baseName + finalExt;
        let destPath = path.join(map.dest, finalName);
        
        if (fs.existsSync(destPath)) {
          // Xóa cũ đè mới cho sạch sẽ
          fs.unlinkSync(destPath); 
        }
        
        fs.renameSync(sourcePath, destPath);
        count++;
      }
    });

    if (count > 0) {
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
  let word = file.replace(/\.[^/.]+$/, "").replace(/_\d{13}$/, "").replace(/_/g, ' '); 
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
  content += `export const GIOI_IMAGES = [\n${getFiles(anhGioiDir, imageExts).map(f => `  require('../assets/images/anh_tinh_diem/gioi/${f}'),`).join('\n')}\n];\n\n`;
  content += `export const TOT_IMAGES = [\n${getFiles(anhTotDir, imageExts).map(f => `  require('../assets/images/anh_tinh_diem/tot/${f}'),`).join('\n')}\n];\n\n`;
  content += `export const CAN_CO_GAN_IMAGES = [\n${getFiles(anhCanCoGanDir, imageExts).map(f => `  require('../assets/images/anh_tinh_diem/can_co_gan/${f}'),`).join('\n')}\n];\n\n`;
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
  content += `export const GIOI_VIDEOS = [\n${getFiles(videoGioiDir, ['.mp4']).map(f => `  require('../assets/videos/gioi/${f}'),`).join('\n')}\n];\n\n`;
  content += `export const TOT_VIDEOS = [\n${getFiles(videoTotDir, ['.mp4']).map(f => `  require('../assets/videos/tot/${f}'),`).join('\n')}\n];\n\n`;
  content += `export const CAN_CO_GAN_VIDEOS = [\n${getFiles(videoCanCoGanDir, ['.mp4']).map(f => `  require('../assets/videos/can_co_gan/${f}'),`).join('\n')}\n];\n\n`;
  content += `export const ALL_VIDEOS = [...GIOI_VIDEOS, ...TOT_VIDEOS, ...CAN_CO_GAN_VIDEOS];\n`;
  return content;
};
fs.writeFileSync(path.join(constantsDir, 'kho_video.ts'), makeKhoVideoContent(), 'utf8');
console.log(`✅ Sổ Video Toán: Cập nhật thành công!`);

// 4. XỬ LÝ KHO ĐỘNG VẬT CHO RẠP XIẾC
const dongVatAssetDir = path.join(assetsDir, 'game_cho_vat_an');
ensureDir(dongVatAssetDir);
const dongVatFiles = fs.readdirSync(dongVatAssetDir);
const animalGroups = {};
dongVatFiles.forEach(file => {
  const filePath = path.join(dongVatAssetDir, file);
  if (fs.statSync(filePath).isFile()) {
     const ext = path.extname(file).toLowerCase();
     const baseName = path.basename(file, ext);
     let id = baseName;
     let type = 'image'; 
     if (baseName.endsWith('_an')) { id = baseName.replace('_an', ''); type = 'videoAn'; } 
     else if (baseName.endsWith('_khoc')) { id = baseName.replace('_khoc', ''); type = 'videoKhoc'; }
     if (!animalGroups[id]) animalGroups[id] = {};
     animalGroups[id][type] = file;
  }
});

let khoDongVatContent = `// File này Tèo code tự động.\n// Đại ca quăng ảnh/video vào tram_nhap_hang/game_cho_vat_an rồi chạy Tool nha!\n\nexport const KHO_DONG_VAT = [\n`;
let validCount = 0;
Object.keys(animalGroups).forEach(id => {
   const group = animalGroups[id];
   if (group.image && group.videoAn && group.videoKhoc) {
      khoDongVatContent += `  {\n    id: '${id}',\n    name: '${id}',\n    image: require('../assets/game_cho_vat_an/${group.image}'),\n    videoAn: require('../assets/game_cho_vat_an/${group.videoAn}'),\n    videoKhoc: require('../assets/game_cho_vat_an/${group.videoKhoc}')\n  },\n`;
      validCount++;
   }
});
khoDongVatContent += `];\n`;
fs.writeFileSync(path.join(constantsDir, 'kho_dong_vat.ts'), khoDongVatContent, 'utf8');
console.log(`✅ Sổ Động Vật : Đã ghép thành công ${validCount} con vật vào rạp xiếc!`);

// 5. XỬ LÝ KHO LOTTIE CHO GAME BẬP BÊNH (MỚI NÈ ĐẠI CA)
const lottieAssetDir = path.join(assetsDir, 'lottie');
ensureDir(lottieAssetDir);
const lottieFiles = getFiles(lottieAssetDir, lottieExts);
let khoLottieContent = `// File này Tèo code tự động.\n// Đại ca tải file .json (hoạt hình Lottie) ném vào tram_nhap_hang/lottie_animals rồi chạy Tool nha!\n\nexport const LOTTIE_ANIMALS = [\n`;
lottieFiles.forEach(file => {
  khoLottieContent += `  require('../assets/lottie/${file}'),\n`;
});
khoLottieContent += `];\n`;
fs.writeFileSync(path.join(constantsDir, 'kho_lottie.ts'), khoLottieContent, 'utf8');
console.log(`✅ Sổ Lottie   : Ghi nhận ${lottieFiles.length} thú nhún 3D!`);

console.log('🎉 XONG RỒI ĐẠI CA ƠI! HỆ THỐNG VẬN HÀNH TRƠN TRU!');