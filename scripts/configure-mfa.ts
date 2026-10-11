import { services } from '../backend/admin';
import config from '../firebase-applet-config.json' with { type: 'json' };

const manager = services().auth.projectConfigManager();
const current = await manager.getProjectConfig();
const previous = current.multiFactorConfig;
const totpEnabled = previous?.state === 'ENABLED' && previous.providerConfigs?.some(provider => provider.state === 'ENABLED' && provider.totpProviderConfig);
if (process.argv.includes('--apply') && !totpEnabled) {
  await manager.updateProjectConfig({ multiFactorConfig: {
    state: 'ENABLED',
    ...(previous?.factorIds ? { factorIds: previous.factorIds } : {}),
    providerConfigs: [
      ...(previous?.providerConfigs || []).filter(provider => !provider.totpProviderConfig),
      { state: 'ENABLED', totpProviderConfig: { adjacentIntervals: 1 } },
    ],
  } });
  console.log(JSON.stringify({ project: config.projectId, totpEnabled: true, changed: true }));
} else console.log(JSON.stringify({ project: config.projectId, totpEnabled: !!totpEnabled, changed: false, mode: 'read-only' }));
