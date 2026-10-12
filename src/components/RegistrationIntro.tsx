import { Building2, Check, Landmark, BriefcaseBusiness, Users, UserRound, Handshake } from 'lucide-react';
import type { UserRole } from '../types';

type Step = 1 | 2 | 3 | 4 | 5;
export function RegistrationProgress({ step, isCgpmp, onSelectStep }: { step: Step; isCgpmp: boolean; onSelectStep: (step: Step) => void }) {
  const labels = isCgpmp ? ['Profil', 'Identité', 'Cellule', 'Membres', 'Accès'] : ['Profil', 'Identité', 'Activité', 'Accès'];
  return <nav className="auth-register__progress" aria-label="Étapes de création du compte"><ol>
    {labels.map((label, index) => <li key={label} className={index + 1 <= step ? 'is-reached' : ''}>
      <button type="button" disabled={index + 1 > step} aria-current={index + 1 === step ? 'step' : undefined}
        aria-label={`Étape ${index + 1} : ${label}`} onClick={() => onSelectStep((index + 1) as Step)}>
        <span className="auth-register__step-number">{index + 1 < step ? <Check size={13} aria-hidden="true" /> : index + 1}</span><span>{label}</span>
      </button>
    </li>)}
  </ol></nav>;
}

const profiles = [
  { role: 'particulier', title: 'Particulier', description: 'Apprendre à titre personnel', icon: UserRound },
  { role: 'ac_agent', title: 'Agent public', description: 'Autorité contractante', icon: Landmark },
  { role: 'pme', title: 'PME & sous-traitant', description: 'Entreprise locale', icon: Handshake },
  { role: 'grande_entreprise', title: 'Grande entreprise', description: 'Opérateur économique', icon: Building2 },
  { role: 'independant', title: 'Indépendant', description: 'Consultant & expert', icon: BriefcaseBusiness },
  { role: 'societe_civile', title: 'Société civile', description: 'Association & observatoire', icon: Users },
] as const;

export function RegistrationProfilePicker({ role, onSelect }: { role: UserRole; onSelect: (role: UserRole) => void }) {
  const selectedIndex = profiles.findIndex(profile => profile.role === role);
  return <fieldset className="auth-register__profiles"><legend>Quel profil vous correspond ?</legend>
    <div role="radiogroup" aria-label="Profil du compte" className="auth-register__profile-grid">
      {profiles.map((profile, index) => {
        const Icon = profile.icon, selected = role === profile.role;
        return <button type="button" role="radio" aria-checked={selected} key={profile.role} className={selected ? 'is-selected' : ''}
          tabIndex={selected || (selectedIndex === -1 && index === 0) ? 0 : -1} onClick={() => onSelect(profile.role)}
          onKeyDown={event => {
            if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? profiles.length - 1 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + profiles.length) % profiles.length;
            onSelect(profiles[next].role);
            (event.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined)?.focus();
          }}>
          <span className="auth-register__profile-icon"><Icon size={20} strokeWidth={1.6} aria-hidden="true" /></span>
          <strong>{profile.title}</strong><span>{profile.description}</span>
          {selected && <span className="auth-register__profile-check"><Check size={11} aria-hidden="true" /></span>}
        </button>;
      })}
    </div>
  </fieldset>;
}
