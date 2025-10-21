"use client";

import Image from "next/image";
import {
  WhatsappShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  FacebookShareButton,
  TelegramShareButton,
  PinterestShareButton,
  EmailShareButton,
  FacebookMessengerShareButton,
  WhatsappIcon,
  TwitterIcon,
  LinkedinIcon,
  FacebookIcon,
  TelegramIcon,
  PinterestIcon,
  EmailIcon,
  FacebookMessengerIcon,
} from "react-share";

interface SharePopupProps {
  shareUrl: string;
  title: string;
  type: string;
  onClose: () => void;
}

export default function SharePopup({ shareUrl, title, type, onClose }: SharePopupProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      
    } catch {
     
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative flex flex-col items-start p-[0_0_24px] gap-1.5 bg-white/5 border border-[rgba(80,80,80,0.24)]
                   shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px]"
        style={{ width: "465px", minHeight: "140px" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
        >
          ×
        </button>

        {/* Title */}
        <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 mt-4 ml-6">
          Share this {type}
        </h2>

        {/* Link + Copy */}
        <div className="flex items-center gap-2 mt-4 mx-6 w-[90%]">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 p-2 bg-transparent border border-[#918AAB26] rounded text-white text-sm focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white hover:bg-white/20 transition"

          >
            Copy
          </button>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-wrap gap-2 justify-center w-full mt-6 px-4">
          <FacebookShareButton url={shareUrl} title={`Check this out: ${title}`}>
            <FacebookIcon size={40} round />
          </FacebookShareButton>

          <FacebookMessengerShareButton url={shareUrl} appId="YOUR_FACEBOOK_APP_ID">
            <FacebookMessengerIcon size={40} round />
          </FacebookMessengerShareButton>

          <WhatsappShareButton url={shareUrl} title={title}>
            <WhatsappIcon size={40} round />
          </WhatsappShareButton>

          <TwitterShareButton url={shareUrl} title={title}>
            <TwitterIcon size={40} round />
          </TwitterShareButton>

          <LinkedinShareButton url={shareUrl} title={title}>
            <LinkedinIcon size={40} round />
          </LinkedinShareButton>

          <TelegramShareButton url={shareUrl} title={title}>
            <TelegramIcon size={40} round />
          </TelegramShareButton>

          <PinterestShareButton url={shareUrl} media="/postcard.png" description={title}>
            <PinterestIcon size={40} round />
          </PinterestShareButton>

          <EmailShareButton
            url={shareUrl}
            subject={`Interesting ${type} on Trix`}
            body={`Hey, check this out: ${shareUrl}`}
          >
            <EmailIcon size={40} round />
          </EmailShareButton>

          {/* Gmail */}
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
              `Check this ${type} on Trix`
            )}&body=${encodeURIComponent(`Hey, check this out: ${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition"
          >
            <Image src="/gmail.png" alt="Gmail" width={40} height={40} className="rounded-full" />
          </a>
        </div>
      </div>
    </div>
  );
}
