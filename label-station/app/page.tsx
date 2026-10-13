'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Building2, Check, ChevronLeft, ChevronRight, Copy, Info, Lock, Minus, Paperclip, Plus, Printer, Search, Settings, ShieldCheck, Trash2, X } from 'lucide-react';
import { LabelCard, type PrintableAsset } from '../components/LabelCard';
import { createPortalPlan, expandQueue, isCompliantPortal, paginate, portalSlug, portalUrl, suggestedPortalSlug } from '../lib/policy.mjs';

type Location = { id: string; name: string };
type Portal = Record<string, unknown> & { customUrl: string };
type Asset = { id: string; code: string; name: string; type: string; locationId: string; portal?: Portal };
type PortalAsset = Omit<PrintableAsset, 'qrDataUrl'>;
type QueueItem = PrintableAsset & { rowId: string; quantity: number };
type Inventory = { mode: 'fixture' | 'live'; locations: Location[]; assets: Asset[] };
type Profile = 'zebra' | 'avery';

const clampQuantity = (value: number) => Math.max(1, Math.min(99, Number.isFinite(value) ? Math.round(value) : 1));
const secondaryAssetCode = (asset: Pick<Asset, 'id' | 'code' | 'name'>) => asset.code && asset.code !== asset.id && asset.code !== asset.name ? asset.code : '';

export default function Page() {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [error, setError] = useState('');
  const [queueError, setQueueError] = useState('');
  const [queueBusy, setQueueBusy] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [profile, setProfile] = useState<Profile>('avery');
  const [previewPage, setPreviewPage] = useState(0);
  const [desktopSettings, setDesktopSettings] = useState<DesktopSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'fixture' | 'live'>('fixture');
  const [upkeepEmail, setUpkeepEmail] = useState('');
  const [upkeepPassword, setUpkeepPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [portalSlugValue, setPortalSlugValue] = useState('');
  const [portalConfirmed, setPortalConfirmed] = useState(false);
  const [portalSaving, setPortalSaving] = useState(false);
  const [portalError, setPortalError] = useState('');

  const loadInventory = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        const detail = response.headers.get('content-type')?.includes('application/json')
          ? (await response.json()).error ?? ''
          : '';
        throw new Error(detail || `Inventory could not be loaded (HTTP ${response.status}). Check the local service and retry.`);
      }
      const data = await response.json() as Inventory;
      setInventory(data);
      setLocationId((current) => data.locations.some((location) => location.id === current) ? current : data.locations[0]?.id ?? '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load inventory. Restart Label Station and retry.');
    }
  }, []);

  useEffect(() => { void loadInventory(); }, [loadInventory]);

  useEffect(() => {
    const desktop = window.labelStationDesktop;
    if (!desktop) return;
    desktop.getSettings().then((settings) => {
      setDesktopSettings(settings);
      setSettingsMode(settings.mode);
      if (!settings.configured) setSettingsOpen(true);
    }).catch((reason) => setSettingsError(reason instanceof Error ? reason.message : 'Desktop settings could not be loaded.'));
  }, []);

  const saveDesktopSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    const desktop = window.labelStationDesktop;
    if (!desktop) return;
    setSettingsSaving(true);
    setSettingsError('');
    try {
      const saved = await desktop.saveSettings({ mode: settingsMode, email: upkeepEmail, password: upkeepPassword });
      setDesktopSettings(saved);
      setUpkeepPassword('');
      if (!saved.restartScheduled) setSettingsOpen(false);
    } catch (reason) {
      setSettingsError(reason instanceof Error ? reason.message : 'Desktop settings could not be saved.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const removeSavedApiKey = async () => {
    const desktop = window.labelStationDesktop;
    if (!desktop) return;
    setSettingsSaving(true);
    setSettingsError('');
    try {
      const saved = await desktop.saveSettings({ mode: 'fixture', removeApiKey: true });
      setDesktopSettings(saved);
      setSettingsMode('fixture');
      setUpkeepEmail('');
      setUpkeepPassword('');
    } catch (reason) {
      setSettingsError(reason instanceof Error ? reason.message : 'The saved API key could not be removed.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const visibleAssets = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (inventory?.assets ?? []).filter((asset) => asset.locationId === locationId && (!needle || `${asset.code} ${asset.name} ${asset.type}`.toLowerCase().includes(needle)));
  }, [inventory, locationId, search]);

  useEffect(() => {
    if (!visibleAssets.some((asset) => asset.id === selectedId)) setSelectedId(visibleAssets[0]?.id ?? '');
  }, [visibleAssets, selectedId]);

  const printableFor = (asset: Asset): PortalAsset | null => {
    if (!isCompliantPortal(asset.portal, asset.id)) return null;
    const url = portalUrl(asset.portal?.customUrl);
    return url ? { id: asset.id, code: asset.code, name: asset.name, type: asset.type, portalUrl: url } : null;
  };

  const queueLabel = async (asset: Asset, portalUrl: string) => {
    setQueueBusy(true);
    setQueueError('');
    try {
      const qrDataUrl = await QRCode.toDataURL(portalUrl, { errorCorrectionLevel: 'M', margin: 1, width: 640, color: { dark: '#000000', light: '#ffffff' } });
      setQueue((current) => [...current, { id: asset.id, code: asset.code, name: asset.name, type: asset.type, portalUrl, qrDataUrl, rowId: `${asset.id}-${crypto.randomUUID()}`, quantity: 1 }]);
      return true;
    } catch {
      setQueueError(`The QR code for ${asset.name} could not be generated. Try adding the label again.`);
      return false;
    } finally {
      setQueueBusy(false);
    }
  };

  const addSelected = async () => {
    const asset = inventory?.assets.find((item) => item.id === selectedId);
    if (!asset) return;
    const printable = printableFor(asset);
    if (!printable) return;
    await queueLabel(asset, printable.portalUrl);
  };

  const openPortalCreate = () => {
    const asset = inventory?.assets.find((item) => item.id === selectedId);
    if (!asset || asset.portal) return;
    setPortalSlugValue(suggestedPortalSlug(asset));
    setPortalConfirmed(false);
    setPortalError('');
    setPortalModalOpen(true);
  };

  const createPortalAndQueue = async () => {
    const asset = inventory?.assets.find((item) => item.id === selectedId);
    if (!asset || !portalConfirmed) return;
    setPortalSaving(true);
    setPortalError('');
    try {
      const response = await fetch('/api/portals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: asset.id, customUrl: portalSlugValue, confirmed: true })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Portal creation failed.');
      const updatedAsset = { ...asset, portal: result.portal as Portal };
      const publicUrl = portalUrl(result.portal?.customUrl);
      if (!publicUrl || !isCompliantPortal(result.portal, asset.id)) throw new Error('The created portal did not pass label verification.');
      setInventory((current) => current ? { ...current, assets: current.assets.map((item) => item.id === asset.id ? updatedAsset : item) } : current);
      if (await queueLabel(asset, publicUrl)) setPortalModalOpen(false);
      else setPortalError('The portal is ready, but its QR code could not be generated. Close this dialog and try Add QR Label to Batch.');
    } catch (reason) {
      setPortalError(reason instanceof Error ? reason.message : 'Portal creation failed.');
    } finally {
      setPortalSaving(false);
    }
  };

  const physicalLabels = useMemo(() => expandQueue(queue) as QueueItem[], [queue]);
  const sheets = useMemo(() => paginate(physicalLabels, profile === 'avery' ? 4 : 1) as QueueItem[][], [physicalLabels, profile]);
  const safePage = Math.min(previewPage, Math.max(0, sheets.length - 1));
  useEffect(() => { setPreviewPage(0); }, [profile, queue.length]);

  const updateQuantity = (rowId: string, quantity: number) => setQueue((current) => current.map((item) => item.rowId === rowId ? { ...item, quantity: clampQuantity(quantity) } : item));
  const duplicate = (rowId: string) => setQueue((current) => {
    const source = current.find((item) => item.rowId === rowId);
    return source ? [...current, { ...source, rowId: `${source.id}-${crypto.randomUUID()}` }] : current;
  });
  const remove = (rowId: string) => setQueue((current) => current.filter((item) => item.rowId !== rowId));

  const selected = inventory?.assets.find((asset) => asset.id === selectedId);
  const selectedReady = selected ? Boolean(printableFor(selected)) : false;
  const selectedHasPortal = Boolean(selected?.portal);
  const portalPlan = selected ? createPortalPlan(selected, portalSlugValue || suggestedPortalSlug(selected)) : null;
  const selectedPortalMessage = !selected
    ? 'Choose an asset above to continue.'
    : selectedReady
      ? 'Request portal found and verified. This asset is ready for a QR label.'
      : selectedHasPortal
        ? 'Review this existing portal in UpKeep. Its fields do not match the Welch label policy, so printing is blocked.'
        : 'No request portal was found. The portal must be created before a QR label can be added.';

  return (
    <main className={`app-shell print-profile-${profile}`}>
      <header className="topbar">
        <div className="brand"><Image src="/welch-logo.png" width={700} height={190} alt="Welch Packaging" priority /><span className="brand-divider" /><strong><span className="brand-product">UpKeep </span>Label Station</strong></div>
        <div className="topbar-actions"><div className={`connection${error ? ' connection--error' : ''}`} role="status"><span />{error ? 'Inventory unavailable' : inventory ? 'Label Station ready' : 'Connecting…'}</div>{desktopSettings ? <button className="settings-button" onClick={() => { setSettingsMode(desktopSettings.mode); setSettingsError(''); setSettingsOpen(true); }} aria-label="Desktop settings"><Settings size={18} /></button> : null}</div>
      </header>

      {error ? <div className="error-banner" role="alert"><Info size={18} /><span>{error}</span><button onClick={() => void loadInventory()}>Retry</button></div> : null}

      <section className="workspace">
        <aside className="asset-panel">
          <Step number={1} title="Select Location" description="Choose the facility or site where the asset is located." />
          <label className="select-wrap"><Building2 size={17} /><select value={locationId} onChange={(event) => setLocationId(event.target.value)} aria-label="Location">{inventory?.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
          <div className="section-divider" />
          <Step number={2} title="Select Asset" description="Search and select the asset to add to the batch queue." />
          <label className="search-wrap"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assets by name or ID…" aria-label="Search assets" /></label>
          <div className="asset-list" role="group" aria-label="Assets">
            <div className="asset-list-head"><span>ASSET</span><span>TYPE</span></div>
            {visibleAssets.map((asset) => {
              const ready = Boolean(printableFor(asset));
              const needsReview = Boolean(asset.portal) && !ready;
              return <button key={asset.id} className={selectedId === asset.id ? 'asset-row selected' : 'asset-row'} onClick={() => setSelectedId(asset.id)} aria-pressed={selectedId === asset.id}>
                <span className="radio-dot" /><span className="asset-display"><strong>{asset.name}</strong>{secondaryAssetCode(asset) ? <small>{secondaryAssetCode(asset)}</small> : null}</span><span>{asset.type}</span><span className={ready ? 'portal-dot ready' : needsReview ? 'portal-dot review' : 'portal-dot'} title={ready ? 'Portal ready' : needsReview ? 'Existing portal needs review' : 'No portal'} />
              </button>;
            })}
            {!visibleAssets.length ? <div className="asset-list-empty">{error ? 'Inventory is unavailable. Retry the connection above.' : !inventory ? 'Loading assets…' : inventory.assets.length === 0 ? 'UpKeep returned no assets. Check the connection and retry.' : search.trim() ? 'No assets match this location and search.' : 'No assets are assigned to this location.'}</div> : null}
          </div>
          <div className={`selected-portal-status${selectedReady ? ' ready' : selectedHasPortal ? ' review' : ''}`} role="status">
            {selectedReady ? <Check size={17} /> : <Info size={17} />}
            <span><strong>{selected?.name ?? 'No asset selected'}</strong><small>{selectedPortalMessage}</small></span>
          </div>
          <button className={selectedReady ? 'add-button' : 'add-button create-portal-button'} onClick={selectedReady ? addSelected : openPortalCreate} disabled={queueBusy || !selected || selectedHasPortal && !selectedReady}><Plus size={18} />{queueBusy ? 'Generating QR code…' : selectedReady ? 'Add QR Label to Batch' : selectedHasPortal ? 'Portal Setup Needs Review' : 'Create Required Portal & Add Label'}</button>
          {queueError ? <p className="inline-error" role="alert">{queueError}</p> : null}
        </aside>

        <section className="queue-panel">
          <Step number={3} title="Configure Portal Request (Locked)" description="Portal fields are locked for consistency." lock />
          <div className="locked-fields">
            <LockedField icon={<Paperclip size={19} />} title="Attachments" description="Allow users to add attachments to their request" />
            <LockedField icon={<ShieldCheck size={19} />} title="Priority" description="Allow users to set request priority" />
          </div>

          <div className="queue-heading"><Step number={4} title="Batch Queue" description="Add assets and set quantities. Duplicate or remove items as needed." /><button onClick={() => setQueue([])} disabled={!queue.length}><Trash2 size={15} />Clear Queue</button></div>
          <div className="queue-table">
            <div className="queue-row queue-head"><span>#</span><span>ASSET</span><span>QUANTITY</span><span>PORTAL STATUS</span><span>ACTIONS</span></div>
            {queue.length ? queue.map((item, index) => <div className="queue-row" key={item.rowId}>
              <span>{index + 1}</span><span><strong>{item.name}</strong>{secondaryAssetCode(item) ? <small>{secondaryAssetCode(item)}</small> : null}</span>
              <span className="quantity"><button onClick={() => updateQuantity(item.rowId, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={15} /></button><input type="number" min="1" max="99" value={item.quantity} onChange={(event) => updateQuantity(item.rowId, Number(event.target.value))} aria-label={`Quantity for ${item.name}`} /><button onClick={() => updateQuantity(item.rowId, item.quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button></span>
              <span className="ready-status"><Check size={16} />Ready</span><span className="actions"><button onClick={() => duplicate(item.rowId)} aria-label={`Duplicate ${item.name}`}><Copy size={17} /></button><button onClick={() => remove(item.rowId)} aria-label={`Remove ${item.name}`}><Trash2 size={17} /></button></span>
            </div>) : <div className="queue-empty">Choose an asset on the left to build and preview your label batch.</div>}
          </div>

          <Step number={5} title="Output Profile" description="Select the label template and printer format." />
          <div className="profile-control" role="group" aria-label="Output profile"><button className={profile === 'zebra' ? 'active' : ''} onClick={() => setProfile('zebra')} aria-pressed={profile === 'zebra'}><strong>Zebra 4 × 6</strong><span>Single Label</span></button><button className={profile === 'avery' ? 'active' : ''} onClick={() => setProfile('avery')} aria-pressed={profile === 'avery'}><strong>Letter 4-up</strong><span>4.25 × 5.5 in each</span></button></div>
          {profile === 'avery' ? <p className="print-guidance">Print on US Letter in portrait orientation at Actual size / 100%. Turn off Fit to page.</p> : null}
        </section>

        <section className="preview-panel">
          <div className="preview-title"><Step number={6} title="Print Preview" description={profile === 'avery' ? 'Letter 4-up — 4.25 × 5.5 in each' : 'Zebra 4 × 6'} /></div>
          <div className={profile === 'avery' ? 'sheet-preview avery-preview' : 'sheet-preview zebra-preview'}>
            {(sheets[safePage] ?? []).map((item, index) => <LabelCard key={`${item.rowId}-${index}`} asset={item} compact />)}
            {!physicalLabels.length ? <div className="preview-empty"><Printer size={36} /><p>Your queued labels will appear here.</p></div> : null}
          </div>
          <div className="pagination"><button onClick={() => setPreviewPage((page) => Math.max(0, page - 1))} disabled={safePage === 0}><ChevronLeft size={18} /></button><span>{sheets.length ? safePage + 1 : 0} of {sheets.length}</span><button onClick={() => setPreviewPage((page) => Math.min(sheets.length - 1, page + 1))} disabled={!sheets.length || safePage >= sheets.length - 1}><ChevronRight size={18} /></button></div>
        </section>
      </section>

      <section className="batch-bar"><div><strong>Batch Summary</strong><span><b>{physicalLabels.length}</b> Labels&nbsp;&nbsp;/&nbsp;&nbsp;<b>{sheets.length}</b> {profile === 'avery' ? 'Sheets' : 'Pages'}</span></div><div><strong>{profile === 'avery' ? 'Letter 4-up (4.25 × 5.5)' : 'Zebra 4 × 6'}</strong><span>{profile === 'avery' ? 'US Letter · Actual size / 100%' : 'Single Label'}</span></div><button className="print-button" onClick={() => window.print()} disabled={!physicalLabels.length}><Printer size={19} />Print Batch</button></section>
      <footer><span className="mode"><ShieldCheck size={17} />{inventory?.mode === 'live' ? 'Live UpKeep Mode' : 'Fixture Mode'} <small>{inventory?.mode === 'live' ? 'Portal writes require confirmation.' : 'Portal creation is simulated.'}</small></span><span>{error ? 'Inventory unavailable.' : inventory ? 'Label Station is ready.' : 'Connecting to Label Station…'}</span></footer>

      <div className="print-root" aria-hidden="true">{sheets.map((sheet, pageIndex) => <section className="print-page" key={pageIndex}>{sheet.map((item, index) => <LabelCard key={`${item.rowId}-${index}`} asset={item} />)}</section>)}</div>

      {portalModalOpen && inventory && selected && portalPlan ? <div className="modal-backdrop" role="presentation"><section className="settings-modal portal-modal" role="dialog" aria-modal="true" aria-labelledby="portal-create-title">
        <div className="settings-modal-head"><div><h2 id="portal-create-title">Create UpKeep Request Portal</h2><p>Review the exact asset binding and request fields before creating it.</p></div><button onClick={() => setPortalModalOpen(false)} aria-label="Close portal creation"><X size={20} /></button></div>
        <div className="portal-modal-body">
          {inventory.mode === 'fixture' ? <div className="fixture-explainer"><ShieldCheck size={19} /><span>Fixture mode will simulate this creation. No UpKeep data will change.</span></div> : <div className="live-write-warning"><Info size={19} /><span>This action will create one live Public Request Portal in UpKeep.</span></div>}
          <div className="portal-summary"><div><span>Portal name</span><strong>{portalPlan.name}</strong></div><div><span>Asset</span><strong>{selected.code} — {selected.name}</strong></div><div><span>Portal type</span><strong>Asset Portal</strong></div></div>
          <label className="settings-field"><span>Public URL slug</span><input value={portalSlugValue} onChange={(event) => setPortalSlugValue(portalSlug(event.target.value))} maxLength={80} autoComplete="off" /><small>https://request-portal.onupkeep.com/{portalSlugValue}</small></label>
          <div className="portal-policy-grid"><div><Check size={16} /><span>Attachments</span><strong>Optional</strong></div><div><Check size={16} /><span>Priority</span><strong>Optional</strong></div>{['Location', 'Asset selector', 'Category', 'Due date', 'Assigned user', 'Team'].map((field) => <div key={field}><Lock size={15} /><span>{field}</span><strong>Hidden</strong></div>)}</div>
          <label className="portal-confirm"><input type="checkbox" checked={portalConfirmed} onChange={(event) => setPortalConfirmed(event.target.checked)} /><span>I confirm this exact asset-bound portal should be {inventory.mode === 'live' ? 'created in UpKeep' : 'simulated'}.</span></label>
          {portalError ? <p className="settings-error">{portalError}</p> : null}
          <div className="settings-actions"><button type="button" onClick={() => setPortalModalOpen(false)} disabled={portalSaving}>Cancel</button><button className="settings-save" type="button" onClick={createPortalAndQueue} disabled={!portalConfirmed || !portalSlugValue || portalSaving}>{portalSaving ? 'Creating & Verifying…' : inventory.mode === 'live' ? 'Create in UpKeep & Add' : 'Simulate & Add'}</button></div>
        </div>
      </section></div> : null}

      {settingsOpen ? <div className="modal-backdrop" role="presentation"><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="desktop-settings-title">
        <div className="settings-modal-head"><div><h2 id="desktop-settings-title">Desktop Connection</h2><p>Choose how this Windows application connects to UpKeep.</p></div>{desktopSettings?.configured ? <button onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X size={20} /></button> : null}</div>
        <form onSubmit={saveDesktopSettings}>
          <label className="settings-field"><span>Data mode</span><select value={settingsMode} onChange={(event) => setSettingsMode(event.target.value as 'fixture' | 'live')}><option value="fixture">Fixture — safe sample data</option><option value="live">Live — UpKeep inventory and confirmed portal creation</option></select></label>
          {settingsMode === 'live' ? <div className="settings-credentials"><label className="settings-field"><span>UpKeep email</span><input type="email" value={upkeepEmail} onChange={(event) => setUpkeepEmail(event.target.value)} autoComplete="username" placeholder="api@welchpkg.com" /></label><label className="settings-field"><span>UpKeep password</span><input type="password" value={upkeepPassword} onChange={(event) => setUpkeepPassword(event.target.value)} autoComplete="current-password" placeholder={desktopSettings?.hasCredentials ? 'Leave blank to keep the saved connection' : 'Enter the UpKeep password'} /><small>Label Station uses UpKeep's current documented authentication API. The credentials and returned session token are encrypted for this Windows user and are never displayed.</small></label></div> : <div className="fixture-explainer"><ShieldCheck size={19} /><span>Fixture mode makes no UpKeep connection and safely simulates portal creation and printing.</span></div>}
          {settingsError ? <p className="settings-error">{settingsError}</p> : null}
          <div className="settings-actions">{desktopSettings?.hasCredentials || desktopSettings?.hasApiKey ? <button type="button" onClick={removeSavedApiKey} disabled={settingsSaving}>Remove Saved Connection</button> : null}{desktopSettings?.configured ? <button type="button" onClick={() => setSettingsOpen(false)}>Cancel</button> : null}<button className="settings-save" type="submit" disabled={settingsSaving}>{settingsSaving ? 'Connecting…' : settingsMode === 'fixture' ? 'Continue in Fixture Mode' : desktopSettings?.hasCredentials && !upkeepPassword ? 'Keep Saved Connection' : 'Sign In and Connect'}</button></div>
        </form>
      </section></div> : null}
    </main>
  );
}

function Step({ number, title, description, lock = false }: { number: number; title: string; description: string; lock?: boolean }) {
  return <div className="step"><span className="step-number">{number}</span><div><h2>{title}{lock ? <Lock size={15} /> : null}</h2><p>{description}</p></div></div>;
}

function LockedField({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="locked-field"><span>{icon}</span><div><strong>{title}</strong><small>{description}</small></div><span className="locked-state"><Lock size={14} />Locked</span></div>;
}
