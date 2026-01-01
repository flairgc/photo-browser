import { useState } from 'react';
import {
  Lightbox,
  IconButton,
  useLightboxState,
} from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import { fetchExif } from '@/services/common.api.ts';
import type { DirItem } from '@/types/fs.ts';
import AlmazIcon from '@/assets/almaz.svg?react';
// import EyeIcon from '@/assets/eye.svg?react';
import InfoIcon from '@/assets/info.svg?react';
import { CheckBoxIcon, CheckedIcon, FullSizeIcon } from '@/components/PhotoViewer/svg-lib.tsx';



declare module "yet-another-react-lightbox" {
  interface Labels {
    "Checkbox button"?: string;
    "Raw button"?: string;
    // "Open file button"?: string;
    "Info button"?: string;
    "FullSize button"?: string;
  }
  interface SlideImage {
    name: string;
    rawUrl: string | null;
    filePath: string | null;
    previewUrl: string | null;
    fullSize?: boolean;
    isSelected?: boolean;
  }
}


const CheckBoxButton = ({selectItem}: {
  selectItem: (name: string, flag?: boolean) => void;
}) => {
  const { currentSlide } = useLightboxState();

  const name = currentSlide?.name;
  const isSelected = currentSlide?.isSelected;

  // todo допилить если download это объект
  if (!name) return null;

  const handleClick = () => {
    selectItem(name)
  }

  return (
    <IconButton
      label="Checkbox button"
      icon={isSelected ? CheckedIcon : CheckBoxIcon}
      disabled={!currentSlide}
      onClick={handleClick}
    />
  );
};

const DownloadRawButton = () => {
  const { currentSlide } = useLightboxState();

  const rawUrl = currentSlide?.rawUrl;

  // todo допилить если download это объект
  if (!rawUrl) return null;

  const handleClick = () => {
    const a = document.createElement('a');
    a.href = rawUrl;
    a.target = '_blank';
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

// const OpenPreviewButton = () => {
//   const { currentSlide } = useLightboxState();
//
//   const previewUrl = currentSlide?.previewUrl;
//
//   // todo допилить если download это объект
//   if (!previewUrl) return null;
//
//   const handleClick = () => {
//     window.open(previewUrl, '_blank');
//   }
//
//   return (
//     <IconButton
//       label="Open file button"
//       icon={EyeIcon}
//       disabled={!currentSlide}
//       onClick={handleClick}
//     />
//   );
// };

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

const FullSizeButton = ({makeFullSize}: {makeFullSize: (name: string)=> void, }) => {

  const { currentSlide } = useLightboxState();
  const fullSize = currentSlide?.fullSize;
  const name = currentSlide?.name;


  const handleClick = async () => {
    if (name) {
      makeFullSize(name)
    }
  }

  return (
    <IconButton
      label="FullSize button"
      icon={(props) => <FullSizeIcon {...props} size={20}/>}
      disabled={fullSize}
      onClick={handleClick}
    />
  );
}


type Props = {
  images: DirItem[];
  imageIndexToOpen: number | undefined;
  setImageIndexToOpen: (index: number) => void;
  switchPhotoFullSize: (name: string) => void;
  selectItem: (name: string, flag?: boolean) => void;
}

export function PhotoViewer({images, imageIndexToOpen, setImageIndexToOpen, switchPhotoFullSize, selectItem }: Props) {

  return (
      <Lightbox
        open={imageIndexToOpen !== undefined}
        close={() => history.back()}
        index={imageIndexToOpen}
        carousel={{
          finite: true,
          preload: 2,
        }}
        controller={{ closeOnPullDown: true, closeOnPullUp: true, closeOnBackdropClick: false }}
        animation={{ fade: 100, swipe: 150 }}
        on={{ view: ({ index: currentIndex }) => setImageIndexToOpen(currentIndex) }}
        slides={images.map((item) => ({
          src: item.fullSize ? `/api/image/file?path=${item.path}&preview` : `/api/image/preview?path=${item.path}&size=big`,
          title: item.name,
          name: item.name,
          download: `/api/image/file?path=${item.path}`,
          rawUrl: item.rawPath ? `/api/image/file?path=${encodeURIComponent(item.rawPath)}` : null,
          filePath: item.path,
          previewUrl: `/api/image/file?path=${item.path}&preview`,
          fullSize: item.fullSize,
          isSelected: item.isSelected,
        }))}
        toolbar={{
          buttons: [
            <CheckBoxButton key="checkbox-button" selectItem={selectItem}/>,
            <InfoButton key="open-info-button" />,
            // <OpenPreviewButton key="open-preview-button" />,
            <FullSizeButton key="test-button" makeFullSize={switchPhotoFullSize}/>,
            <DownloadRawButton key="raw-button" />,
            "close"],
        }}
        plugins={[Fullscreen, Zoom, Captions, Download]}
      />
  );
}
