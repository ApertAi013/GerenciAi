import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onClose: () => void;
  cropShape?: 'rect' | 'round';
  aspect?: number;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas is empty'));
    }, 'image/jpeg', 0.9);
  });
}

export default function ImageCropModal({
  imageSrc, onCropComplete, onClose, cropShape = 'round', aspect = 1,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropDone = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
    } catch (err) {
      console.error('Erro ao cortar imagem:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropDone}
        />
      </div>
      <div style={{
        padding: '16px 24px', background: '#1a1a1a',
        display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <span style={{ fontSize: '0.85rem', color: '#999', whiteSpace: 'nowrap' }}>Zoom</span>
          <input
            type="range"
            min={1} max={3} step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, maxWidth: '200px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: '1px solid #444',
              background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: '#22C55E', color: 'white', cursor: saving ? 'wait' : 'pointer',
              fontWeight: 600, fontSize: '0.9rem', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Cortando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
