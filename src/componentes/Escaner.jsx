import { useEffect, useRef, useState } from "react";
import { leerFrame } from "../escaner.js";

const INTERVALO_MS = 200;

export default function Escaner({ onLeido, onCerrar }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const activoRef = useRef(true);
  const [estado, setEstado] = useState("iniciando"); // iniciando | leyendo | error
  const [error, setError] = useState("");

  useEffect(() => {
    activoRef.current = true;
    let temporizador = null;

    function detener() {
      activoRef.current = false;
      if (temporizador) clearTimeout(temporizador);
      // Sin esto el indicador de camara del telefono se queda encendido.
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((pista) => pista.stop());
        streamRef.current = null;
      }
    }

    async function ciclo() {
      if (!activoRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        const { videoWidth: ancho, videoHeight: alto } = video;
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, ancho, alto);

        try {
          const texto = await leerFrame(ctx.getImageData(0, 0, ancho, alto));
          if (texto && activoRef.current) {
            detener();
            onLeido(texto);
            return;
          }
        } catch (e) {
          console.warn("Fallo al descodificar el frame:", e);
        }
      }

      if (activoRef.current) {
        temporizador = setTimeout(ciclo, INTERVALO_MS);
      }
    }

    async function iniciar() {
      // En http:// por IP de LAN el navegador ni siquiera expone mediaDevices.
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado("error");
        setError(
          "La cámara necesita una conexión segura (https:// o localhost). " +
            "Abre la app por HTTPS para escanear.",
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!activoRef.current) {
          stream.getTracks().forEach((p) => p.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setEstado("leyendo");
        ciclo();
      } catch (e) {
        setEstado("error");
        if (e.name === "NotAllowedError") {
          setError(
            "Permiso de cámara denegado. Actívalo en los ajustes del navegador.",
          );
        } else if (e.name === "NotFoundError") {
          setError("No se encontró ninguna cámara en este dispositivo.");
        } else {
          setError(`No se pudo abrir la cámara: ${e.message}`);
        }
      }
    }

    iniciar();
    return detener;
  }, [onLeido]);

  return (
    <div className="escaner" role="dialog" aria-label="Escanear código">
      <div className="escaner-video">
        <video ref={videoRef} playsInline muted autoPlay />
        <canvas ref={canvasRef} className="oculto" />
        {estado === "leyendo" && <div className="escaner-mira" aria-hidden="true" />}
      </div>

      <div className="escaner-pie">
        {estado === "iniciando" && (
          <p className="escaner-texto">Abriendo la cámara…</p>
        )}
        {estado === "leyendo" && (
          <p className="escaner-texto">
            Encuadra el código de barras dentro del recuadro
          </p>
        )}
        {estado === "error" && <p className="escaner-error">{error}</p>}

        <button type="button" className="boton-grande cancelar" onClick={onCerrar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
