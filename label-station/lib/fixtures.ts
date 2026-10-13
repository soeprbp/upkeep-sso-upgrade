export type Location = { id: string; name: string };
export type Portal = Record<string, unknown> & { customUrl: string };
export type Asset = { id: string; name: string; code: string; type: string; locationId: string; portal?: Portal };

const locked = {
  portalType: 'asset', files: 'optional', priority: 'optional', location: 'hidden', asset: 'hidden',
  category: 'hidden', dueDate: 'hidden', assignedUser: 'hidden', team: 'hidden', customFields: []
};

export const locations: Location[] = [
  { id: 'loc-elkhart', name: 'Elkhart' },
  { id: 'loc-batavia', name: 'Batavia' },
  { id: 'loc-nashville', name: 'Nashville' }
];

export const assets: Asset[] = [
  { id: 'asset-148', code: 'ELK-148', name: 'Load Form', type: 'Load Form', locationId: 'loc-elkhart', portal: { ...locked, assets: ['asset-148'], customUrl: 'elk-148-load-form' } },
  { id: 'asset-123', code: 'ELK-123', name: 'Case Packer', type: 'Case Packer', locationId: 'loc-elkhart', portal: { ...locked, assets: ['asset-123'], customUrl: 'elk-123-case-packer' } },
  { id: 'asset-134', code: 'ELK-134', name: 'Shrink Tunnel', type: 'Shrink Tunnel', locationId: 'loc-elkhart', portal: { ...locked, assets: ['asset-134'], customUrl: 'elk-134-shrink-tunnel' } },
  { id: 'asset-142', code: 'ELK-142', name: 'Carton Sealer', type: 'Carton Sealer', locationId: 'loc-elkhart', portal: { ...locked, assets: ['asset-142'], customUrl: 'elk-142-carton-sealer' } },
  { id: 'asset-155', code: 'ELK-155', name: 'Conveyor', type: 'Conveyor', locationId: 'loc-elkhart' },
  { id: 'asset-201', code: 'BAT-201', name: 'Pallet Wrapper', type: 'Wrapper', locationId: 'loc-batavia', portal: { ...locked, assets: ['asset-201'], customUrl: 'bat-201-pallet-wrapper' } },
  { id: 'asset-301', code: 'NSH-301', name: 'Flexo Folder Gluer', type: 'FFG', locationId: 'loc-nashville', portal: { ...locked, assets: ['asset-301'], customUrl: 'nsh-301-ffg' } }
];
