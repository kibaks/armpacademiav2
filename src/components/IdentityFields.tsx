import { UserRound, Mail, Fingerprint, ChevronDown } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';
import { filterPersonNameMask, filterEmailMask, filterRoleTitleMask, formatMatriculeOrRccmMask, formatDRCPhoneMask, todayIso, type CivilIdentity } from '../utils/inputMasks';

export function MaskedPhoneInput({ value, onValueChange, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & { value: string; onValueChange: (value: string) => void }) {
  return <input {...props} type="tel" value={value} onChange={event => {
    const input = event.currentTarget, raw = input.value, position = input.selectionStart ?? raw.length;
    const formatted = formatDRCPhoneMask(raw);
    const caret = position === raw.length ? formatted.length : Math.min(formatDRCPhoneMask(raw.slice(0, position)).length, formatted.length);
    onValueChange(formatted);
    requestAnimationFrame(() => { if (document.activeElement === input) input.setSelectionRange(caret, caret); });
  }} />;
}

interface Props {
  value: CivilIdentity;
  onChange: (field: keyof CivilIdentity, value: string) => void;
  errors: Partial<Record<keyof CivilIdentity, string>>;
  isCgpmp: boolean;
  emailLocked: boolean;
}
export function IdentityFields({ value, onChange, errors, isCgpmp, emailLocked }: Props) {
  const [expanded, setExpanded] = useState(false);
  const textField = (field: keyof CivilIdentity, label: string, placeholder: string, mask: (value: string) => string, required = false, autoComplete?: string) => <div className={`identity-field ${field === 'prenom' ? 'identity-field--wide' : ''}`}>
    <label htmlFor={`identity-${field}`}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    <input id={`identity-${field}`} type="text" value={value[field]} placeholder={placeholder} required={required} maxLength={field === 'piece' ? 48 : 70}
      autoComplete={autoComplete} aria-invalid={errors[field] ? true : undefined} aria-describedby={errors[field] ? `identity-${field}-error` : undefined}
      onChange={event => onChange(field, mask(event.target.value))} />
    {errors[field] && <p id={`identity-${field}-error`} className="identity-field__error">{errors[field]}</p>}
  </div>;
  return <div className="identity-fields">
    <div className="identity-fields__intro"><h3>{isCgpmp ? 'Identité du secrétaire permanent' : 'Présentez-vous.'}</h3><p>Les champs marqués d’un * sont obligatoires.</p></div>
    <fieldset><legend><UserRound size={16} aria-hidden="true" /> Votre identité</legend><div className="identity-fields__grid">
      <div className="identity-field"><label htmlFor="identity-civilite">Civilité</label><select id="identity-civilite" value={value.civilite} onChange={event => onChange('civilite', event.target.value)}><option value="">Choisir</option><option value="M.">Monsieur</option><option value="Mme">Madame</option><option value="Ir.">Ingénieur</option><option value="Me">Maître</option><option value="Dr">Docteur</option><option value="Pr.">Professeur</option><option value="Hon.">Honorable</option></select></div>
      <div className="identity-field"><label htmlFor="identity-sexe">Sexe</label><select id="identity-sexe" value={value.sexe} onChange={event => onChange('sexe', event.target.value)}><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
      {textField('nom', 'Nom de famille', 'Votre nom', input => filterPersonNameMask(input).toUpperCase(), true, 'family-name')}
      {textField('postnom', 'Post-nom', 'Votre post-nom', input => filterPersonNameMask(input).toUpperCase(), true, 'additional-name')}
      {textField('prenom', 'Prénom', 'Votre prénom', filterPersonNameMask, true, 'given-name')}
    </div></fieldset>
    <fieldset><legend><Mail size={16} aria-hidden="true" /> Votre contact</legend><div className="identity-field">
      <label htmlFor="identity-email">{isCgpmp ? 'Email du secrétaire permanent' : 'Adresse email'} <span aria-hidden="true">*</span></label>
      <input id="identity-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={120} required value={value.email} readOnly={emailLocked}
        placeholder={isCgpmp ? 'secretaire@institution.cd' : 'vous@exemple.cd'} onChange={event => onChange('email', filterEmailMask(event.target.value))}
        aria-invalid={errors.email ? true : undefined} aria-describedby="identity-email-help" />
      <p id="identity-email-help" className={errors.email ? 'identity-field__error' : 'identity-field__hint'}>{errors.email || (emailLocked ? 'Adresse du compte Google connecté.' : 'Cette adresse servira à vous connecter et à recevoir vos notifications.')}</p>
    </div></fieldset>
    <details className="identity-fields__optional" open={expanded || !!errors.naissance} onToggle={event => setExpanded(event.currentTarget.open)}>
      <summary><Fingerprint size={16} aria-hidden="true" /> Informations complémentaires <span>Facultatif</span><ChevronDown size={14} aria-hidden="true" /></summary>
      <fieldset aria-label="Informations complémentaires"><div className="identity-fields__grid">
      <div className="identity-field"><label htmlFor="identity-naissance">Date de naissance</label><input id="identity-naissance" type="date" autoComplete="bday" max={todayIso()} value={value.naissance} onChange={event => onChange('naissance', event.target.value)} aria-invalid={errors.naissance ? true : undefined} aria-describedby={errors.naissance ? 'identity-naissance-error' : undefined} />{errors.naissance && <p id="identity-naissance-error" className="identity-field__error">{errors.naissance}</p>}</div>
      {textField('lieu', 'Lieu de naissance', 'Ville ou localité', filterPersonNameMask)}
      {textField('nationalite', 'Nationalité', 'Votre nationalité', filterRoleTitleMask)}
      <div className="identity-field"><label htmlFor="identity-etatCivil">État civil</label><select id="identity-etatCivil" value={value.etatCivil} onChange={event => onChange('etatCivil', event.target.value)}><option value="">Choisir</option><option>Marié(e)</option><option>Célibataire</option><option>Veuf / Veuve</option><option>Divorcé(e)</option></select></div>
      <div className="identity-field identity-field--wide"><label htmlFor="identity-piece">Numéro de pièce d’identité</label><input id="identity-piece" type="text" autoCapitalize="characters" spellCheck={false} maxLength={48} value={value.piece} onChange={event => onChange('piece', formatMatriculeOrRccmMask(event.target.value))} placeholder="Référence de votre carte ou passeport" aria-describedby="identity-piece-help" /><p id="identity-piece-help" className="identity-field__hint">Lettres, chiffres, points, tirets et barres obliques.</p></div>
    </div></fieldset></details>
  </div>;
}
