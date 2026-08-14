import { NEW_SIGNUP_USER } from './newSignupUser';
import { WHEELCHAIR_USER } from './wheelchairUser';
import { STROLLER_USER } from './strollerUser';
import { SENIOR_VISUAL_USER } from './seniorVisualUser';
import { NICKNAME_CONFLICT_USER } from './nicknameConflictUser';
import type { PersonaDefinition, PersonaKey } from './types';

export * from './types';
export * from './newSignupUser';
export * from './wheelchairUser';
export * from './strollerUser';
export * from './seniorVisualUser';
export * from './nicknameConflictUser';

export const DEV_PERSONAS: Record<PersonaKey, PersonaDefinition> = {
  NEW_SIGNUP_USER,
  WHEELCHAIR_USER,
  STROLLER_USER,
  SENIOR_VISUAL_USER,
  NICKNAME_CONFLICT_USER,
};

export const DEFAULT_DEV_PERSONA = NEW_SIGNUP_USER;

export function getPersona(key: PersonaKey): PersonaDefinition {
  return DEV_PERSONAS[key] ?? DEFAULT_DEV_PERSONA;
}

export function resolveActivePersona(): PersonaDefinition {
  const envPersona = process.env.EXPO_PUBLIC_DEV_PERSONA as PersonaKey | undefined;
  if (envPersona && envPersona in DEV_PERSONAS) {
    return DEV_PERSONAS[envPersona];
  }
  return DEFAULT_DEV_PERSONA;
}
