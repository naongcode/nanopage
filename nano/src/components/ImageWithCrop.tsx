'use client';

interface ImageWithCropProps {
  imageUrl: string;
  crop: any;
  onCropChange: (crop: any) => void;
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
  // 원본 이미지만 표시
  return (
    <div className="w-full">
      <img src={imageUrl} alt="" className="w-full h-auto object-contain" />
    </div>
  );
}
