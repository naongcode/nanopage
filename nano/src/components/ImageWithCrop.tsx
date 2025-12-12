'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { ImageCrop } from '@/types';

interface ImageWithCropProps {
  imageUrl: string;
  crop: ImageCrop | null;
  onCropChange: (crop: ImageCrop) => void;
  isEditing: boolean;
  onEditComplete: () => void;
}

export function ImageWithCrop({
  imageUrl,
  crop,
  onCropChange,
  isEditing,
  onEditComplete,
}: ImageWithCropProps) {
  const [cropArea, setCropArea] = useState({ x: crop?.x || 0, y: crop?.y || 0 });
  const [zoom, setZoom] = useState(crop?.zoom || 1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = () => {
    if (croppedAreaPixels) {
      // 퍼센트 기반으로 crop 정보 저장
      onCropChange({
        x: cropArea.x,
        y: cropArea.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
        zoom,
      });
    }
    onEditComplete();
  };

  const handleCancel = () => {
    // 이전 crop 설정으로 되돌리기
    if (crop) {
      setCropArea({ x: crop.x, y: crop.y });
      setZoom(crop.zoom);
    }
    onEditComplete();
  };

  if (!isEditing) {
    // 뷰 모드: crop된 이미지 표시
    if (crop) {
      return (
        <div className="relative w-full" style={{ height: '400px', overflow: 'hidden' }}>
          <img
            src={imageUrl}
            alt=""
            className="absolute"
            style={{
              left: `${-crop.x}%`,
              top: `${-crop.y}%`,
              width: `${100 * crop.zoom}%`,
              height: 'auto',
            }}
          />
        </div>
      );
    }

    // crop이 없으면 원본 이미지 표시
    return (
      <div className="w-full">
        <img src={imageUrl} alt="" className="w-full h-auto object-contain" />
      </div>
    );
  }

  // 편집 모드: react-easy-crop UI
  return (
    <div className="relative">
      <div className="relative h-96 bg-black">
        <Cropper
          image={imageUrl}
          crop={cropArea}
          zoom={zoom}
          aspect={16 / 9}
          onCropChange={setCropArea}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* 컨트롤 */}
      <div className="mt-4 space-y-4 p-4 bg-white rounded-lg border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            확대/축소: {zoom.toFixed(1)}x
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            자르기 적용
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
