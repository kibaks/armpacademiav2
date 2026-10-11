import { auth } from '../firebase';
import { createScopedStorage } from '../../shared/scopedStorage';
export const scopedStorage = createScopedStorage(window.localStorage, () => auth.currentUser?.uid);
