import React, { useState, useRef, ChangeEvent } from 'react';

interface FileUploadProps {
  onFileUpload: (fileInfo: { filePath: string; fileName: string; fileUrl: string }) => void;
  currentFileUrl?: string;
  currentFileName?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, currentFileUrl, currentFileName }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentFileUrl || null);
  const [fileName, setFileName] = useState<string | null>(currentFileName || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択ハンドラ
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    // 許可されたファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('JPEG、PNG、GIF、PDFのみアップロード可能です');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // FormDataの作成
      const formData = new FormData();
      formData.append('file', file);

      // ファイルアップロードAPIを呼び出し
      const response = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ファイルのアップロードに失敗しました');
      }

      const fileInfo = await response.json();
      
      // プレビュー設定
      if (file.type.startsWith('image/')) {
        setPreview(`http://localhost:4000${fileInfo.fileUrl}`);
      } else if (file.type === 'application/pdf') {
        // PDFの場合はプレビューなし（後でテキストで表示）
        setPreview('pdf');
      }
      
      setFileName(file.name);
      
      // 親コンポーネントに通知
      onFileUpload(fileInfo);
    } catch (err: any) {
      console.error('ファイルアップロードエラー:', err);
      setError(err.message || 'ファイルのアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  // ファイル選択ボタンクリックハンドラ
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  // ファイル削除ハンドラ
  const handleRemoveFile = () => {
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileUpload({ filePath: '', fileName: '', fileUrl: '' });
  };

  return (
    <div className="mt-1">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,application/pdf"
      />

      {!preview ? (
        <div 
          onClick={handleSelectFile}
          className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500"
        >
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="mt-1 text-sm text-gray-600">
            クリックしてファイルを選択
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPEG、PNG、GIF、PDF（最大5MB）
          </p>
        </div>
      ) : (
        <div className="relative border rounded-md p-4">
          <div className="flex items-center">
            {preview.startsWith('http') ? (
              <img src={preview} alt="プレビュー" className="w-16 h-16 object-cover rounded" />
            ) : preview === 'pdf' ? (
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span className="text-xs text-gray-500 absolute bottom-1">PDF</span>
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            )}
            <div className="ml-4 flex-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">{fileName}</h4>
              <div className="mt-1 flex items-center">
                <button
                  type="button"
                  onClick={handleSelectFile}
                  className="text-xs text-indigo-600 hover:text-indigo-900 mr-2"
                >
                  変更
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-xs text-red-600 hover:text-red-900"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mt-2 text-sm text-gray-500">
          アップロード中...
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
