'use client';

import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, UploadCloud, File as FileIcon, X, Check, Loader2, QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function QRCodeGenerator() {
  const t = useTranslations('QRCode');
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  
  // QR Code Settings
  const [content, setContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState(''); // Separate state for generated QR
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('L');

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [ttl, setTtl] = useState(168);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    setGeneratedContent(content);
  };

  const downloadQR = (format: 'png' | 'svg') => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    const url = canvas.toDataURL(`image/${format}`);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const isImage = selectedFile.type.startsWith('image/');
      const maxSize = isImage ? 50 * 1024 * 1024 : 200 * 1024 * 1024; // 50MB for images, 200MB for others (video)

      if (selectedFile.size > maxSize) {
        setError(t('upload.errorSize')); // Note: You might want to update translation key or text to reflect dynamic size
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const isImage = selectedFile.type.startsWith('image/');
      const maxSize = isImage ? 50 * 1024 * 1024 : 200 * 1024 * 1024;

      if (selectedFile.size > maxSize) {
        setError(t('upload.errorSize'));
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      // 1. Get presigned URL
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          ttl,
        }),
      });

      const responseData = await res.json();

      if (responseData.status !== 'success') {
        throw new Error(responseData.message || t('upload.errorGeneric'));
      }

      const { uploadUrl, key } = responseData.data;

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error(t('upload.errorUpload'));
      }

      // 3. Confirm and Record in DB
      const confirmRes = await fetch('/api/files/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              key,
              filename: file.name,
              contentType: file.type,
              ttl
          })
      });

      const confirmData = await confirmRes.json();
      if (confirmData.status !== 'success') {
          throw new Error(confirmData.message || 'Failed to confirm upload');
      }

      const { accessUrl, ttlHours } = confirmData.data;

      setContent(accessUrl);
      setGeneratedContent(accessUrl);
      
      // Show success message with TTL
      const days = Math.floor(ttlHours / 24);
      const hours = ttlHours % 24;
      const timeString = days > 0 ? `${days}天 ${hours}小时` : `${hours}小时`;
      alert(`文件上传成功！\n文件将在 ${timeString} 后自动删除`);

      setFile(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('upload.errorGeneric'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Tabs */}
      <div className="flex gap-2 bg-muted/30 p-1.5 rounded-xl backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
            activeTab === 'text'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('tabs.text')}
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${
            activeTab === 'file'
              ? 'bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98]'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          {t('tabs.file')}
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          {activeTab === 'text' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('contentLabel')}</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={t('placeholder')}
                />
              </div>
              <button
                onClick={handleGenerate}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 h-10 px-4 py-2"
              >
                <QrCode className="mr-2 h-4 w-4" />
                {t('generate')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-3 rounded-full bg-muted">
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('upload.dragDrop')}</p>
                    <div className="text-xs text-muted-foreground">
                      <p>{t('upload.limitInfoSize')}</p>
                      <p>{t('upload.limitInfoExpiration', { days: Math.floor(ttl / 24), hours: ttl % 24 })}</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="qr-file-upload"
                  />
                  <label
                    htmlFor="qr-file-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95 h-9 px-4 py-2"
                  >
                    {t('upload.selectFile')}
                  </label>
                </div>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded bg-muted">
                      <FileIcon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium max-w-[200px] truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('ttlLabel')}</label>
                <input
                  type="number"
                  value={ttl}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTtl(val > 168 ? 168 : val);
                  }}
                  min={1}
                  max={168}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">{t('ttlHelp')}</p>
              </div>

              <button
                onClick={uploadFile}
                disabled={!file || uploading}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 h-10 px-4 py-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('upload.uploading')}
                  </>
                ) : (
                  t('upload.uploadFile')
                )}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('size')}</label>
              <input
                type="number"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                min={128}
                max={1024}
                step={32}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('errorCorrection')}</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="L">{t('levels.L')}</option>
                <option value="M">{t('levels.M')}</option>
                <option value="Q">{t('levels.Q')}</option>
                <option value="H">{t('levels.H')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('foregroundColor')}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('backgroundColor')}</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-6 rounded-lg bg-muted/50 p-8 min-h-[400px]">
          {generatedContent ? (
            <>
              <div ref={canvasRef} className="bg-white p-4 rounded-lg shadow-sm">
                <QRCodeCanvas
                  value={generatedContent}
                  size={size}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level={level}
                  includeMargin={true}
                />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground break-all max-w-[250px]">
                  {generatedContent}
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => downloadQR('png')}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 h-10 px-4 py-2"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('downloadPNG')}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              <QrCode className="mx-auto h-12 w-12 opacity-20 mb-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
