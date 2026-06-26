import { useRef, useCallback, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useIdCardLayout } from '../context/IdCardLayoutContext';
import { getCardLayout } from '../config/idCardLayout';

/**
 * Renders text scaled down (via scaleX) so it always fits within maxWidthPx.
 * Font size is never increased beyond the original fontSize.
 */
const FitText = ({ text, fontSize, fontWeight, color, textAlign, maxWidthPx, style = {}, className = '' }) => {
  const measureRef = useRef(null);
  const [scaleX, setScaleX] = useState(1);

  useEffect(() => {
    if (!measureRef.current || !maxWidthPx) return;
    const naturalWidth = measureRef.current.scrollWidth;
    if (naturalWidth > maxWidthPx) {
      setScaleX(maxWidthPx / naturalWidth);
    } else {
      setScaleX(1);
    }
  }, [text, fontSize, maxWidthPx]);

  return (
    <span
      ref={measureRef}
      className={className}
      style={{
        display: 'inline-block',
        whiteSpace: 'nowrap',
        fontSize,
        fontWeight,
        color,
        textAlign,
        transformOrigin: 'center center',
        transform: `scaleX(${scaleX})`,
        ...style,
      }}
    >
      {text}
    </span>
  );
};

const getCardType = (participant) => {
  if (participant?.isHonorary) return 'honorary';
  if (participant?.guestId) return 'guest';
  return 'member';
};

const getCardTypeLabel = (participant) => {
  if (participant?.isHonorary) return 'Honorary Guest';
  if (participant?.guestId) return 'Guest';
  return 'Member';
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');



const IdCardGenerator = ({
  participant,
  showActions = true,
  layout: layoutOverride,
  previewWidth,
  templateSrc = '/id-card-template.jpeg',
}) => {
  const { layout: contextLayout } = useIdCardLayout();
  const layout = getCardLayout(layoutOverride || contextLayout, getCardType(participant));
  const cardRef = useRef(null);

  const cardWidth = previewWidth || layout.cardWidth;
  const physicalWidthIn = Number(layout.cardWidthIn) || 3;
  const physicalHeightIn = Number(layout.cardHeightIn) || physicalWidthIn * layout.aspectRatio;
  const physicalAspectRatio = physicalHeightIn / physicalWidthIn;
  const cardHeight = Math.round(cardWidth * physicalAspectRatio);
  const printWidthPx = physicalWidthIn * 96;
  const printScale = printWidthPx / cardWidth;
  const scale = cardWidth / layout.cardWidth;

  const { name, industry, qr, typeLabel } = layout;
  const cardTypeLabel = getCardTypeLabel(participant);

  const captureCard = useCallback(async () => {
    if (!cardRef.current) return null;
    return html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  }, []);

  const downloadPng = async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${participant.participantId || participant.guestId}-id-card.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const downloadPdf = async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const cardWmm = physicalWidthIn * 25.4;
    const cardHmm = physicalHeightIn * 25.4;
    pdf.addImage(imgData, 'PNG', (pageW - cardWmm) / 2, (pageH - cardHmm) / 2, cardWmm, cardHmm);
    pdf.save(`${participant.participantId || participant.guestId}-id-card.pdf`);
  };

  const printCard = async () => {
    const win = window.open('', '_blank');
    if (!win) return;
    if (!cardRef.current) { win.close(); return; }

    // Scale factor: layout config values are authored at layout.cardWidth pixels (e.g. 400px).
    // The print card is rendered at physicalWidthIn inches. We compute the scale from
    // the layout's base coordinate space to the physical print size in CSS pixels (96 dpi).
    const printPx = physicalWidthIn * 96;
    const pScale = printPx / layout.cardWidth;

    // Only text + QR are printed (no background image) because the cards are pre-printed.
    const printCardMarkup = `
      <div class="print-card">
        <div
          class="print-layer print-type-label"
          style="
            top:${typeLabel.topPercent}%;
            left:0;
            right:0;
            justify-content:center;
            font-size:${typeLabel.fontSizePx * pScale}px;
            font-weight:${typeLabel.fontWeight};
            text-align:${typeLabel.textAlign};
            color:${typeLabel.color};
            text-transform:${typeLabel.textTransform};
          "
        >${escapeHtml(cardTypeLabel)}</div>
        <div
          class="print-layer"
          style="
            top:${name.topPercent}%;
            left:0;
            right:0;
            justify-content:center;
          "
        >
          <div class="fit-text-wrapper" data-max-width="${(name.maxWidthPx || 290) * pScale}"
            style="
              font-size:${name.fontSizePx * pScale}px;
              font-weight:${name.fontWeight};
              text-align:center;
              color:${name.color};
              line-height:1.25;
              white-space:nowrap;
              display:inline-block;
              transform-origin:center center;
            "
          >${escapeHtml(participant.fullName)}</div>
        </div>
        <div
          class="print-layer"
          style="
            top:${industry.topPercent}%;
            left:0;
            right:0;
            justify-content:center;
          "
        >
          <div class="fit-text-wrapper" data-max-width="${(industry.maxWidthPx || 270) * pScale}"
            style="
              font-size:${industry.fontSizePx * pScale}px;
              line-height:${industry.lineHeight};
              font-weight:${industry.fontWeight};
              text-align:center;
              color:${industry.color};
              white-space:nowrap;
              display:inline-block;
              transform-origin:center center;
            "
          >${escapeHtml(participant.industryName)}</div>
        </div>
        <div
          class="print-layer"
          style="
            right:${qr.rightPercent}%;
            bottom:${qr.bottomPercent}%;
            width:${qr.widthPercent}%;
            aspect-ratio:1;
            padding:${qr.paddingPx * pScale}px;
            align-items:center;
            justify-content:center;
          "
        >
          ${
            participant.qrImage
              ? `<img src="${escapeHtml(participant.qrImage)}" alt="QR" style="width:100%;height:100%;object-fit:contain;" />`
              : ''
          }
        </div>
      </div>
    `;

    win.document.open();
    win.document.write(`
      <html>
        <head>
          <title>Print ID Card</title>
          <style>
            @page {
              size: ${physicalWidthIn}in ${physicalHeightIn}in;
              margin: 0;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              width: ${physicalWidthIn}in;
              height: ${physicalHeightIn}in;
              overflow: hidden;
              background: transparent;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .print-card {
              position: relative;
              overflow: hidden;
              width: ${physicalWidthIn}in;
              height: ${physicalHeightIn}in;
              background: transparent;
              font-family: Georgia, Cambria, "Times New Roman", Times, serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }
            .print-card-wrapper {
              width: ${physicalWidthIn}in;
              height: ${physicalHeightIn}in;
              overflow: hidden;
            }
            .print-layer {
              position: absolute;
              z-index: 1;
              display: flex;
            }
            .print-type-label {
              white-space: nowrap;
            }
            img { display: block; }
            @media print {
              html, body { width: 100%; height: 100%; background: transparent; }
              body { min-height: auto; }
            }
          </style>
          <script>
            window.addEventListener('DOMContentLoaded', function() {
              document.querySelectorAll('.fit-text-wrapper').forEach(function(el) {
                var maxW = parseFloat(el.getAttribute('data-max-width'));
                if (!maxW) return;
                var natural = el.scrollWidth;
                if (natural > maxW) {
                  el.style.transform = 'scaleX(' + (maxW / natural) + ')';
                }
              });
            });
          </script>
        </head>
        <body onload="window.focus(); setTimeout(() => window.print(), 350);">
          <div class="print-card-wrapper">${printCardMarkup}</div>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={cardRef}
        className="print-area print-card relative overflow-hidden shadow-xl rounded-lg"
        style={{ width: cardWidth, height: cardHeight, '--id-card-print-scale': printScale }}
      >
        <img
          src={templateSrc}
          alt="IIA ID Card Template"
          className="print-card-template absolute inset-0 w-full h-full object-fill"
          crossOrigin="anonymous"
        />

        <div
          className="id-card-screen-type id-card-print-layer absolute left-0 right-0 flex justify-center"
          style={{ top: `${typeLabel.topPercent}%` }}
        >
          <span
            className="id-card-type-label font-serif leading-tight"
            style={{
              fontSize: `${typeLabel.fontSizePx * scale}px`,
              fontWeight: typeLabel.fontWeight,
              textAlign: typeLabel.textAlign,
              color: typeLabel.color,
              textTransform: typeLabel.textTransform,
            }}
          >
            {cardTypeLabel}
          </span>
        </div>

        <div
          className="id-card-print-only-type absolute left-0 right-0 justify-center"
          style={{ top: `${typeLabel.topPercent}%` }}
        >
          <span
            className="font-serif leading-tight"
            style={{
              fontSize: `${typeLabel.fontSizePx * scale}px`,
              fontWeight: typeLabel.fontWeight,
              color: typeLabel.color,
              textTransform: typeLabel.textTransform,
            }}
          >
            {cardTypeLabel}
          </span>
        </div>

        <div
          className="id-card-print-layer absolute left-0 right-0 flex justify-center"
          style={{ top: `${name.topPercent}%` }}
        >
          <FitText
            text={participant.fullName}
            fontSize={`${name.fontSizePx * scale}px`}
            fontWeight={name.fontWeight}
            color={name.color}
            textAlign="center"
            maxWidthPx={(name.maxWidthPx || 290) * scale}
            className="font-serif leading-tight"
          />
        </div>

        <div
          className="id-card-print-layer absolute left-0 right-0 flex justify-center"
          style={{ top: `${industry.topPercent}%` }}
        >
          <FitText
            text={participant.industryName}
            fontSize={`${industry.fontSizePx * scale}px`}
            fontWeight={industry.fontWeight}
            color={industry.color}
            textAlign="center"
            maxWidthPx={(industry.maxWidthPx || 270) * scale}
            style={{ lineHeight: industry.lineHeight }}
            className="font-serif"
          />
        </div>

        <div
          className="id-card-print-layer absolute flex items-center justify-center"
          style={{ right: `${qr.rightPercent}%`, bottom: `${qr.bottomPercent}%`, width: `${qr.widthPercent}%`, aspectRatio: '1', padding: qr.paddingPx * scale }}
        >
          {participant.qrImage ? (
            <img
              src={participant.qrImage}
              alt="QR"
              className="w-full h-full object-contain"
              style={{ backgroundColor: qr.whiteBackground ? '#fff' : 'transparent' }}
              crossOrigin="anonymous"
            />
          ) : (
            <span className="text-xs text-slate-400">No QR</span>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex flex-wrap gap-2 justify-center no-print">
          <button type="button" onClick={printCard} className="btn-primary">Print Card</button>
          <button type="button" onClick={downloadPdf} className="btn-gold">Download PDF</button>
          <button type="button" onClick={downloadPng} className="btn-outline">Download PNG</button>
        </div>
      )}
    </div>
  );
};

export default IdCardGenerator;
