/**
 * Default ID card text positions for id-card-template.jpeg (941 × 1672).
 * Edit this file directly, OR use Admin → Card Layout tuner (saved in browser).
 */
export const DEFAULT_CARD_LAYOUT = {
  cardWidth: 400,
  cardWidthIn: 3,
  cardHeightIn: 5,
  aspectRatio: 1672 / 941,

  name: {
    topPercent: 40,
    leftPercent: 5,
    paddingLeft: 0,
    paddingRight: 0,
    fontSizePx: 25,
    maxWidthPx: 290,
    fontWeight: 700,
    textAlign: 'left',
    color: '#000000',
  },

  industry: {
    topPercent: 51,
    leftPercent: 5,
    paddingLeft: 0,
    paddingRight: 0,
    fontSizePx: 20.4,
    maxWidthPx: 270,
    lineHeight: 1.35,
    fontWeight: 550,
    textAlign: 'left',
    color: '#000000',
  },

  typeLabel: {
    topPercent: 3,
    fontSizePx: 18,
    fontWeight: 700,
    textAlign: 'center',
    color: '#000000',
    textTransform: 'uppercase',
  },

  qr: {
    rightPercent: 7,
    bottomPercent: 5.5,
    widthPercent: 29,
    paddingPx: 2,
    whiteBackground: true,
  },
};

export const STORAGE_KEY = 'iia_id_card_layout';
export const CARD_LAYOUT_TYPES = ['member', 'guest', 'honorary'];

const buildDefaultLayouts = () =>
  CARD_LAYOUT_TYPES.reduce(
    (cards, type) => ({
      ...cards,
      [type]: mergeCardLayout(DEFAULT_CARD_LAYOUT),
    }),
    {}
  );

export const DEFAULT_ID_CARD_LAYOUT = {
  cards: buildDefaultLayouts(),
};

export const loadLayoutFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeLayout(parsed);
  } catch {
    return null;
  }
};

export function mergeCardLayout(overrides = {}) {
  const cardWidthIn =
    overrides?.cardWidthIn ?? (overrides?.cardWidthCm ? overrides.cardWidthCm / 2.54 : DEFAULT_CARD_LAYOUT.cardWidthIn);
  const cardHeightIn =
    overrides?.cardHeightIn ?? (overrides?.cardHeightCm ? overrides.cardHeightCm / 2.54 : DEFAULT_CARD_LAYOUT.cardHeightIn);
  const { cardWidthCm, cardHeightCm, ...inchOverrides } = overrides || {};

  return {
  ...DEFAULT_CARD_LAYOUT,
  ...inchOverrides,
  cardWidthIn,
  cardHeightIn,
  name: { ...DEFAULT_CARD_LAYOUT.name, ...inchOverrides?.name },
  industry: { ...DEFAULT_CARD_LAYOUT.industry, ...inchOverrides?.industry },
  typeLabel: { ...DEFAULT_CARD_LAYOUT.typeLabel, ...inchOverrides?.typeLabel },
  qr: { ...DEFAULT_CARD_LAYOUT.qr, ...inchOverrides?.qr },
  };
}

export const normalizeLayout = (layout = {}) => {
  if (layout.cards) {
    return {
      cards: CARD_LAYOUT_TYPES.reduce(
        (cards, type) => ({
          ...cards,
          [type]: mergeCardLayout(layout.cards[type]),
        }),
        {}
      ),
    };
  }

  const migratedLayout = mergeCardLayout(layout);
  return {
    cards: CARD_LAYOUT_TYPES.reduce(
      (cards, type) => ({
        ...cards,
        [type]: mergeCardLayout(migratedLayout),
      }),
      {}
    ),
  };
};

export const getCardLayout = (layout, type = 'member') => {
  if (layout?.cards) return mergeCardLayout(layout.cards[type] || layout.cards.member);
  return mergeCardLayout(layout);
};
