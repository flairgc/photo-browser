import { type Dispatch, type SetStateAction, useState } from 'react';
import {
  Lightbox,
  IconButton,
  // createIcon,
  useLightboxState,
} from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import { fetchExif } from '@/services/common.api.ts';
import type { DirItemWithIndex } from '@/types/fs.ts';
import AlmazIcon from '@/assets/almaz.svg?react';
import EyeIcon from '@/assets/eye.svg?react';
import InfoIcon from '@/assets/info.svg?react';



declare module "yet-another-react-lightbox" {
  interface Labels {
    "Raw button"?: string;
    "Open file button"?: string;
    "Info button"?: string;
  }
  interface SlideImage {
    rawUrl: string | null;
    filePath: string | null;
    previewUrl: string | null;
  }
}

const DownloadRawButton = () => {
  const { currentSlide } = useLightboxState();

  const rawUrl = currentSlide?.rawUrl;

  // todo допилить если download это объект
  if (!rawUrl) return null;

  const handleClick = () => {
    const a = document.createElement('a');
    a.href = rawUrl;
    a.target = '_blank';      // 👈 ключевой момент
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <IconButton
      label="Raw button"
      icon={AlmazIcon}
      disabled={!currentSlide}
      onClick={handleClick}
    />
  );
};

const OpenPreviwButton = () => {
  const { currentSlide } = useLightboxState();

  const previewUrl = currentSlide?.previewUrl;

  // todo допилить если download это объект
  if (!previewUrl) return null;

  const handleClick = () => {
    window.open(previewUrl, '_blank');
  }

  return (
    <IconButton
      label="Open file button"
      icon={EyeIcon}
      disabled={!currentSlide}
      onClick={handleClick}
    />
  );
};

const InfoButton = () => {

  const [isLoading, setIsLoading] = useState(false);

  const { currentSlide } = useLightboxState();

  const filePath = currentSlide?.filePath;

  if (!filePath) return null;


  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const exif = await fetchExif(filePath);
    setIsLoading(false)
    alert(exif);
  }

  return (
    <IconButton
      label="Info button"
      icon={InfoIcon}
      disabled={!currentSlide || isLoading}
      onClick={handleClick}
    />
  );
};


type Props = {
  images: DirItemWithIndex[];
  imageIndexToOpen: number | undefined;
  setImageIndexToOpen: Dispatch<SetStateAction<number | undefined>>;
}

export function PhotoViewer({images, imageIndexToOpen, setImageIndexToOpen }: Props) {

  return (
      <Lightbox
        open={imageIndexToOpen !== undefined}
        close={() => setImageIndexToOpen(undefined)}
        index={imageIndexToOpen}
        slides={images.map((item) => ({
          src: `api/image/preview?path=${item.path}&size=big`,
          title: item.name,
          download: `api/image/file?path=${item.path}`,
          rawUrl: item.rawPath ? `/api/image/file?path=${encodeURIComponent(item.rawPath)}` : null,
          filePath: item.path,
          previewUrl: `api/image/file?path=${item.path}&preview`,
        }))}
        carousel={{
          finite: true,
          preload: 2,
        }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        animation={{ fade: 100, swipe: 150 }}
        toolbar={{
          buttons: [ <InfoButton key="open-preview-button" />, <OpenPreviwButton key="open-preview-button" />, <DownloadRawButton key="raw-button" />, "close"],
        }}
        plugins={[Fullscreen, Zoom, Captions, Download]}
      />
  );
}
