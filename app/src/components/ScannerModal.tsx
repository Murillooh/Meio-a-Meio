import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface ScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (url: string) => void;
}

export function ScannerModal({ open, onClose, onScan }: ScannerModalProps) {
  const [error, setError] = useState<string>('');
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      return;
    }

    setError('');
    const qrCodeId = 'reader';
    const html5QrCode = new Html5Qrcode(qrCodeId);
    scannerRef.current = html5QrCode;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setHasCamera(true);
          // Prefer back camera
          const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id;
          
          html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              // Only trigger if it looks like a URL
              if (decodedText.startsWith('http')) {
                // Stop scanner
                html5QrCode.stop().then(() => {
                  html5QrCode.clear();
                  scannerRef.current = null;
                  onScan(decodedText);
                }).catch(console.error);
              }
            },
            (errorMessage) => {
              // Ignorar erros de leitura de frame (normal quando não acha o QR)
            }
          ).catch((err) => {
            setError('Erro ao acessar a câmera. Verifique as permissões.');
            console.error(err);
          });
        } else {
          setHasCamera(false);
          setError('Nenhuma câmera encontrada no dispositivo.');
        }
      })
      .catch((err) => {
        setHasCamera(false);
        setError('Permissão negada ou erro ao buscar câmeras.');
        console.error(err);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [open, onScan]);

  return (
    <Modal open={open} onClose={onClose} title="Ler QR Code da Nota">
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-alert-bg border border-alert-line rounded-xl text-alert text-sm">
            {error}
          </div>
        )}
        
        {hasCamera ? (
          <div className="overflow-hidden rounded-xl bg-black">
            <div id="reader" className="w-full h-[300px]" />
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center bg-base rounded-xl border border-base-line">
            <span className="text-ink-muted text-sm">Câmera indisponível</span>
          </div>
        )}

        <p className="text-center text-sm text-ink-muted">
          Aponte a câmera para o QR Code da Nota Fiscal de Consumidor (NFC-e).
        </p>
        
        <Button variant="secondary" onClick={onClose} full>
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}
