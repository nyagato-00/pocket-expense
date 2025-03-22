import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// アップロードディレクトリの設定
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// アップロードディレクトリが存在しない場合は作成
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ストレージ設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // オリジナルのファイル名から拡張子を取得
    const ext = path.extname(file.originalname);
    // タイムスタンプとランダムな文字列を含むファイル名を生成
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    // 日本語ファイル名をエンコード
    const encodedName = Buffer.from(path.basename(file.originalname, ext)).toString('hex');
    cb(null, `${encodedName}-${uniqueSuffix}${ext}`);
  }
});

// ファイルフィルター
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 許可するファイル形式
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('許可されていないファイル形式です。JPEG、PNG、GIF、PDFのみアップロード可能です。'));
  }
};

// ファイルサイズ制限（5MB）
const limits = {
  fileSize: 5 * 1024 * 1024
};

// multerの設定
export const upload = multer({
  storage,
  fileFilter,
  limits
});

// ファイルパスからURLを生成
export const getFileUrl = (filePath: string): string => {
  const relativePath = path.relative(UPLOAD_DIR, filePath);
  return `/uploads/${relativePath}`;
};

// ファイル情報を取得
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    filePath: file.path,
    fileName: file.originalname,
    fileUrl: getFileUrl(file.path)
  };
};
