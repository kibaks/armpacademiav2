import React from 'react';
import { SkeletonLoader } from './SkeletonLoader';

export class DeferredPanel extends React.Component<{ label: string; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div role="alert" className="p-6 space-y-3 text-center">
      <p>Cet espace n’a pas pu s’afficher. Rechargez l’application pour réessayer.</p>
      <button type="button" onClick={() => window.location.reload()} className="rounded-xl px-4 py-2 bg-blue-700 text-white font-bold">Recharger l’application</button>
    </div>;
    return <React.Suspense fallback={<SkeletonLoader label={this.props.label} />}>{this.props.children}</React.Suspense>;
  }
}
