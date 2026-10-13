import Image from 'next/image';

export type PrintableAsset = {
  id: string;
  code: string;
  name: string;
  type: string;
  portalUrl: string;
  qrDataUrl: string;
};

export function LabelCard({ asset, compact = false }: { asset: PrintableAsset; compact?: boolean }) {
  const humanIdentifier = asset.code && asset.code !== asset.id && asset.code !== asset.name ? asset.code : '';
  const nameClass = asset.name.length > 28 ? 'label-asset-name label-asset-name--long' : 'label-asset-name';

  return (
    <article className={`label-card${compact ? ' label-card--compact' : ''}`} aria-label={`Maintenance request label for ${asset.name}`}>
      <Image className="label-logo" src="/welch-logo.png" width={700} height={190} alt="Welch Packaging" priority />
      <div className="label-rule" />
      <p className="label-kicker">ASSET</p>
      <h3 className={nameClass}>{asset.name}</h3>
      {humanIdentifier ? <p className="label-name">{humanIdentifier}</p> : null}
      <Image className="label-qr" src={asset.qrDataUrl} width={640} height={640} unoptimized alt={`QR code for ${asset.name}`} />
      <div className="label-rule" />
      <p className="label-callout">SCAN TO REQUEST MAINTENANCE</p>
      <p className="label-callout label-callout--es">ESCANEE PARA SOLICITAR MANTENIMIENTO</p>
      <p className="label-note">NO LOGIN REQUIRED&nbsp;&nbsp; / &nbsp;&nbsp;NO SE REQUIERE INICIAR SESIÓN</p>
    </article>
  );
}
