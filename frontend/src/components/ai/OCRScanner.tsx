import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  CameraAlt,
  Upload,
  Close,
  Refresh,
} from '@mui/icons-material';

interface OCRScannerProps {
  onResult: (extractedData: any) => void;
  onCancel: () => void;
}

const OCRScanner: React.FC<OCRScannerProps> = ({
  onResult,
  onCancel,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('无法访问摄像头，请检查权限设置');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setScannedImage(imageData);
        stopCamera();
        processImage(imageData);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setScannedImage(imageData);
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData: string) => {
    setIsScanning(true);
    setError(null);
    
    try {
      // 模拟OCR处理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟提取的名片数据
      const mockData = {
        name: '张三',
        company: '科技有限公司',
        position: '产品经理',
        phone: '138-0000-0000',
        email: 'zhangsan@example.com',
        address: '北京市朝阳区xxx路xxx号',
      };
      
      setExtractedData(mockData);
    } catch (err) {
      setError('OCR识别失败，请重试');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirm = () => {
    if (extractedData) {
      onResult(extractedData);
    }
  };

  const handleClose = () => {
    stopCamera();
    setScannedImage(null);
    setExtractedData(null);
    setError(null);
    setIsScanning(false);
    onCancel();
  };

  const resetScan = () => {
    setScannedImage(null);
    setExtractedData(null);
    setError(null);
    setIsScanning(false);
  };

  return (
    <Dialog open={true} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">名片扫描</Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {!scannedImage && !cameraActive && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" gutterBottom>
              选择扫描方式
            </Typography>
            <Box display="flex" justifyContent="center" gap={2} mt={2}>
              <Button
                variant="outlined"
                startIcon={<CameraAlt />}
                onClick={startCamera}
              >
                拍照扫描
              </Button>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => fileInputRef.current?.click()}
              >
                上传图片
              </Button>
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </Box>
        )}

        {cameraActive && (
          <Box textAlign="center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', maxWidth: 400, borderRadius: 8 }}
            />
            <Box mt={2}>
              <Button
                variant="contained"
                startIcon={<CameraAlt />}
                onClick={capturePhoto}
                sx={{ mr: 1 }}
              >
                拍照
              </Button>
              <Button onClick={stopCamera}>取消</Button>
            </Box>
          </Box>
        )}

        {scannedImage && (
          <Box>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <img
                src={scannedImage}
                alt="Scanned"
                style={{ width: '100%', maxWidth: 300, borderRadius: 8 }}
              />
            </Paper>
            
            {isScanning && (
              <Box display="flex" alignItems="center" justifyContent="center" py={2}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography>正在识别名片信息...</Typography>
              </Box>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {extractedData && (
              <Paper elevation={1} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  识别结果
                </Typography>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                  <Typography><strong>姓名:</strong> {extractedData.name}</Typography>
                  <Typography><strong>公司:</strong> {extractedData.company}</Typography>
                  <Typography><strong>职位:</strong> {extractedData.position}</Typography>
                  <Typography><strong>电话:</strong> {extractedData.phone}</Typography>
                  <Typography><strong>邮箱:</strong> {extractedData.email}</Typography>
                  <Typography><strong>地址:</strong> {extractedData.address}</Typography>
                </Box>
              </Paper>
            )}
          </Box>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
      <DialogActions>
        {scannedImage && (
          <Button
            startIcon={<Refresh />}
            onClick={resetScan}
          >
            重新扫描
          </Button>
        )}
        <Button onClick={handleClose}>取消</Button>
        {extractedData && (
          <Button
            variant="contained"
            onClick={handleConfirm}
          >
            确认导入
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OCRScanner;