export interface CharacterSpec {
  id: string
  name: string
  gender: 'boy' | 'girl'
  skin: string
  shirt: string
  pants: string
  hair: string
  /** 'short' = cap of hair; 'ponytail' and 'buns' add extra hair blocks */
  hairstyle: 'short' | 'spiky' | 'ponytail' | 'buns' | 'long'
}

export const CHARACTERS: CharacterSpec[] = [
  {
    id: 'max',
    name: 'Max',
    gender: 'boy',
    skin: '#f0c090',
    shirt: '#e4544f',
    pants: '#31456e',
    hair: '#5a4236',
    hairstyle: 'short',
  },
  {
    id: 'leo',
    name: 'Leo',
    gender: 'boy',
    skin: '#a4715a',
    shirt: '#6db56a',
    pants: '#4a4a52',
    hair: '#2e2a28',
    hairstyle: 'spiky',
  },
  {
    id: 'sam',
    name: 'Sam',
    gender: 'boy',
    skin: '#f7d6b0',
    shirt: '#5a8fd6',
    pants: '#8a6a52',
    hair: '#f5c84c',
    hairstyle: 'short',
  },
  {
    id: 'mia',
    name: 'Mia',
    gender: 'girl',
    skin: '#f0c090',
    shirt: '#f2a0bd',
    pants: '#9a6fc4',
    hair: '#5a4236',
    hairstyle: 'ponytail',
  },
  {
    id: 'zoe',
    name: 'Zoe',
    gender: 'girl',
    skin: '#8a5c42',
    shirt: '#f5c84c',
    pants: '#4a9a94',
    hair: '#2e2a28',
    hairstyle: 'buns',
  },
  {
    id: 'lily',
    name: 'Lily',
    gender: 'girl',
    skin: '#f7d6b0',
    shirt: '#c9aede',
    pants: '#e4544f',
    hair: '#c05a2e',
    hairstyle: 'long',
  },
]
