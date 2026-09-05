import React, { useState } from 'react';
import { ImageKitImage } from './ImageKitImage';
import { ImageUploadDropzone, type ImageUploadResult } from './ImageUploadDropzone';
import { Button } from './Button';
import { Modal } from './Modal';
import { Checkbox } from './Checkbox';

export interface StationGalleryAsset {
  id?: string;
  assetUrl: string;
  storageKey?: string;
  assetType: string;
  isPrimary?: boolean;
  altText?: string;
  displayOrder?: number;
}

export interface StationGalleryProps {
  stationId: string;
  stationName: string;
  assets: StationGalleryAsset[];
  onUploadSuccess: (result: ImageUploadResult, isPrimary: boolean) => Promise<void> | void;
  onDeleteAsset: (assetId: string) => Promise<void> | void;
  onSetPrimaryAsset: (assetId: string) => Promise<void> | void;
  getAuthParams: () => Promise<{
    token: string;
    expire: number;
    signature: string;
    publicKey?: string;
    urlEndpoint?: string;
  }>;
  readOnly?: boolean;
  className?: string;
}

export const StationGallery: React.FC<StationGalleryProps> = ({
  stationId,
  stationName,
  assets = [],
  onUploadSuccess,
  onDeleteAsset,
  onSetPrimaryAsset,
  getAuthParams,
  readOnly = false,
  className = '',
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadAsPrimary, setUploadAsPrimary] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi trạm sạc?')) return;
    setDeletingId(id);
    try {
      await onDeleteAsset(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (id: string) => {
    setSettingPrimaryId(id);
    try {
      await onSetPrimaryAsset(id);
    } finally {
      setSettingPrimaryId(null);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink flex items-center gap-2">
            <span>Thư viện ảnh trạm sạc</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-chip text-muted">
              {assets.length} ảnh
            </span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Ảnh hiển thị trên bản đồ tìm kiếm và thẻ thông tin cho tài xế xe điện.
          </p>
        </div>

        {!readOnly && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setUploadAsPrimary(assets.length === 0);
              setIsUploadModalOpen(true);
            }}
          >
            + Tải ảnh mới
          </Button>
        )}
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-line bg-surface-2/60">
          <div className="w-12 h-12 rounded-full bg-chip text-faint flex items-center justify-center mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-ink">
            Chưa có hình ảnh nào cho trạm sạc này
          </p>
          <p className="text-xs text-muted mt-1 max-w-sm">
            Thêm ảnh chụp thực tế vị trí trạm, cổng sạc và biển báo giúp tài xế dễ dàng nhận diện và check-in.
          </p>
          {!readOnly && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-4"
              onClick={() => {
                setUploadAsPrimary(true);
                setIsUploadModalOpen(true);
              }}
            >
              Tải ảnh đại diện đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {assets.map((asset, index) => {
            const assetKey = asset.id || asset.storageKey || `asset-${index}`;
            const isPrimary = Boolean(asset.isPrimary);

            return (
              <div
                key={assetKey}
                className={`group relative flex flex-col rounded-xl overflow-hidden border transition-all duration-200 bg-surface ${
                  isPrimary
                    ? 'border-owner ring-2 ring-owner/20 shadow-sm'
                    : 'border-line hover:border-line-hover shadow-sm'
                }`}
              >
                {/* Image Container with ImageKitImage */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-chip">
                  <ImageKitImage
                    src={asset.assetUrl}
                    alt={asset.altText || `${stationName} - Ảnh ${index + 1}`}
                    transformation={{
                      width: 480,
                      height: 300,
                      cropMode: 'maintain_ratio',
                      quality: 80,
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Primary Badge */}
                  {isPrimary && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-owner text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Ảnh chính
                    </div>
                  )}

                  {/* Top-right overlay actions */}
                  <a
                    href={asset.assetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Xem ảnh gốc"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>

                {/* Footer Controls */}
                {!readOnly && (
                  <div className="flex items-center justify-between p-2.5 border-t border-line-2 text-xs">
                    {!isPrimary ? (
                      <button
                        type="button"
                        onClick={() => asset.id && handleSetPrimary(asset.id)}
                        disabled={settingPrimaryId === asset.id}
                        className="text-body hover:text-owner font-medium transition-colors"
                      >
                        {settingPrimaryId === asset.id ? 'Đang đặt...' : 'Đặt làm ảnh chính'}
                      </button>
                    ) : (
                      <span className="text-owner font-semibold text-[11px]">
                        Đang làm ảnh bìa
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => asset.id && handleDelete(asset.id)}
                      disabled={deletingId === asset.id}
                      className="text-faint hover:text-bad transition-colors p-1"
                      title="Xóa ảnh"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        maxWidth={480}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h3 className="text-base font-semibold text-ink">Tải ảnh mới cho trạm sạc</h3>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="text-faint hover:text-ink text-sm p-1 rounded-md transition-colors"
            >
              ✕
            </button>
          </div>
          <ImageUploadDropzone
            folder={`/chargeops/stations/${stationId}`}
            tags={['station', 'gallery', stationId]}
            getAuthParams={getAuthParams}
            onSuccess={async (res) => {
              await onUploadSuccess(res, uploadAsPrimary);
              setIsUploadModalOpen(false);
            }}
          />

          <div className="pt-1">
            <Checkbox
              id="set-primary-checkbox"
              checked={uploadAsPrimary}
              onChange={setUploadAsPrimary}
              accent="owner"
            >
              Đặt bức ảnh này làm ảnh chính (Cover) cho trạm sạc
            </Checkbox>
          </div>
        </div>
      </Modal>
    </div>
  );
};
