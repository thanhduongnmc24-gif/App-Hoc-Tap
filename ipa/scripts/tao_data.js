const fs = require('fs');
const path = require('path');

// Tèo dùng '../' để lùi ra khỏi thư mục scripts, rồi mới trỏ tới đúng ổ chứa ảnh và kho
const imageDir = path.join(__dirname, '../assets/images/anh_tap_doc');
const outputFile = path.join(__dirname, '../constants/kho_tap_doc.ts');

fs.readdir(imageDir, (err, files) => {
  if (err) {
    console.log('❌ Chưa tìm thấy thư mục ảnh đại ca ơi! Kiểm tra lại đường dẫn assets/images/anh_tap_doc nha.', err);
    return;
  }

  // Lọc lấy mấy file hình thôi (png, jpg, jpeg)
  const imageFiles = files.filter(f => f.match(/\.(png|jpe?g)$/i));

  let fileContent = `// File này được Tèo viết tự động bằng Tool.\n`;
  fileContent += `// Đại ca quăng ảnh vào thư mục assets/images/anh_tap_doc rồi chạy lệnh node để cập nhật nha!\n\n`;
  fileContent += `export const TAP_DOC_DATA = [\n`;

  imageFiles.forEach(file => {
    // Gọt bỏ đuôi file để lấy chữ
    let word = file.replace(/\.[^/.]+$/, "");
    
    // Đổi dấu gạch dưới thành khoảng trắng (nếu có)
    word = word.replace(/_/g, ' ');

    // Cái đường dẫn require này vẫn giữ nguyên vì file đích nằm ở thư mục constants
    fileContent += `  { word: '${word}', image: require('../assets/images/anh_tap_doc/${file}') },\n`;
  });

  fileContent += `];\n`;

  // Ghi đè vào file
  fs.writeFileSync(outputFile, fileContent, 'utf8');
  console.log('✅ TÈO ĐÃ TẠO XONG KHO TẬP ĐỌC! Ghi nhận được ' + imageFiles.length + ' tấm ảnh nha đại ca!');
});